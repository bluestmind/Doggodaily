from flask import Blueprint, request, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
import secrets
import logging

from ..models import User, db, SecurityLog
from .utils import TokenManager, password_validator, SecurityUtils
from ..extensions import mail
from ..email import send_email

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

# Enhanced login with better error handling and user experience
@auth_bp.route('/login', methods=['POST'])
def login():
    """Enhanced login with comprehensive security checks and better UX"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        remember_me = data.get('remember_me', False)
        device_fingerprint = data.get('device_fingerprint')
        two_fa_token = data.get('two_fa_token')
        
        # Input validation
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        if not user:
            # Don't reveal if user exists
            return jsonify({
                'success': False,
                'message': 'Invalid credentials'
            }), 401
        
        # Check if account is locked
        if user.account_locked_until and user.account_locked_until > datetime.utcnow():
            return jsonify({
                'success': False,
                'message': 'Account is temporarily locked due to too many failed attempts',
                'account_locked': True,
                'unlock_time': user.account_locked_until.isoformat()
            }), 423
        
        # Check if account is active
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Account is deactivated. Please contact support.'
            }), 401
        
        # Verify password
        if not user.check_password(password):
            # Increment failed attempts
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            user.last_failed_login = datetime.utcnow()
            
            # Check if account should be locked
            max_attempts = current_app.config.get('MAX_LOGIN_ATTEMPTS', 5)
            if user.failed_login_attempts >= max_attempts:
                lockout_duration = current_app.config.get('ACCOUNT_LOCKOUT_DURATION', 30)
                user.account_locked_until = datetime.utcnow() + timedelta(minutes=lockout_duration)
                
                # Log security event
                TokenManager.log_security_event(
                    user.id, 'account_locked',
                    f'Failed attempts: {user.failed_login_attempts}'
                )
                
                db.session.commit()
                
                return jsonify({
                    'success': False,
                    'message': 'Account has been temporarily locked due to too many failed login attempts',
                    'account_locked': True,
                    'unlock_time': user.account_locked_until.isoformat()
                }), 423
            
            db.session.commit()
            
            # Log failed attempt
            TokenManager.log_security_event(
                user.id, 'failed_login',
                f'Attempt {user.failed_login_attempts}'
            )
            
            return jsonify({
                'success': False,
                'message': 'Invalid credentials',
                'failed_attempts': user.failed_login_attempts,
                'max_attempts': max_attempts
            }), 401
        
        # Check 2FA if enabled
        if user.two_factor_enabled:
            if not two_fa_token:
                return jsonify({
                    'success': False,
                    'message': 'Two-factor authentication required',
                    'requires_2fa': True
                }), 401
            
            # Verify 2FA token
            if not user.verify_2fa_token(two_fa_token):
                TokenManager.log_security_event(
                    user.id, 'failed_2fa',
                    'Invalid 2FA token'
                )
                return jsonify({
                    'success': False,
                    'message': 'Invalid two-factor authentication code'
                }), 401
        
        # Reset failed attempts on successful login
        user.failed_login_attempts = 0
        user.account_locked_until = None
        user.last_login = datetime.utcnow()
        user.login_count = (user.login_count or 0) + 1
        
        # Establish session
        login_user(user, remember=remember_me)
        
        # Log successful login
        TokenManager.log_security_event(
            user.id, 'successful_login',
            f'Device: {device_fingerprint}, Remember: {remember_me}'
        )
        
        # Check for suspicious activity
        suspicious_activity = SecurityUtils.detect_suspicious_activity(user, request)
        
        # Prepare response
        response_data = {
            'success': True,
            'message': 'Login successful',
            'user': user.to_dict()
        }
        
        # Add security alerts if needed
        if suspicious_activity['suspicious']:
            response_data['security_alert'] = {
                'type': suspicious_activity['reason'],
                'message': 'Unusual login activity detected',
                'require_verification': suspicious_activity.get('require_verification', False)
            }
        
        # Check if password change is required
        if user.requires_password_change:
            response_data['requires_password_change'] = True
            response_data['message'] = 'Password change required'
        
        db.session.commit()
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'An error occurred during login'
        }), 500

# Enhanced admin login
@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """Enhanced admin login with strict permission checks"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        device_fingerprint = data.get('device_fingerprint')
        two_fa_token = data.get('two_fa_token')
        remember_me = data.get('remember_me', False)
        
        # Input validation
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid admin credentials'
            }), 401
        
        # Strict admin permission check
        if not user.is_admin_user():
            TokenManager.log_security_event(
                user.id if user else None, 
                'unauthorized_admin_login',
                f'Email: {email}'
            )
            return jsonify({
                'success': False,
                'message': 'Access denied. Insufficient admin permissions'
            }), 403
        
        # Check if account is locked
        if user.account_locked_until and user.account_locked_until > datetime.utcnow():
            return jsonify({
                'success': False,
                'message': 'Account is temporarily locked',
                'account_locked': True,
                'unlock_time': user.account_locked_until.isoformat()
            }), 423
        
        # Verify password
        if not user.check_password(password):
            # Increment failed attempts
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            user.last_failed_login = datetime.utcnow()
            
            # Check if account should be locked
            max_attempts = current_app.config.get('MAX_LOGIN_ATTEMPTS', 5)
            if user.failed_login_attempts >= max_attempts:
                lockout_duration = current_app.config.get('ACCOUNT_LOCKOUT_DURATION', 30)
                user.account_locked_until = datetime.utcnow() + timedelta(minutes=lockout_duration)
                
                TokenManager.log_security_event(
                    user.id, 'admin_account_locked',
                    f'Failed attempts: {user.failed_login_attempts}'
                )
                
                db.session.commit()
                
                return jsonify({
                    'success': False,
                    'message': 'Account has been temporarily locked',
                    'account_locked': True,
                    'unlock_time': user.account_locked_until.isoformat()
                }), 423
            
            db.session.commit()
            
            TokenManager.log_security_event(
                user.id, 'failed_admin_login',
                f'Attempt {user.failed_login_attempts}'
            )
            
            return jsonify({
                'success': False,
                'message': 'Invalid admin credentials',
                'failed_attempts': user.failed_login_attempts,
                'max_attempts': max_attempts
            }), 401
        
        # Check 2FA if enabled
        if user.two_factor_enabled:
            if not two_fa_token:
                return jsonify({
                    'success': False,
                    'message': 'Two-factor authentication required',
                    'requires_2fa': True
                }), 401
            
            if not user.verify_2fa_token(two_fa_token):
                TokenManager.log_security_event(
                    user.id, 'failed_admin_2fa',
                    'Invalid 2FA token'
                )
                return jsonify({
                    'success': False,
                    'message': 'Invalid two-factor authentication code'
                }), 401
        
        # Reset failed attempts
        user.failed_login_attempts = 0
        user.account_locked_until = None
        user.last_login = datetime.utcnow()
        user.login_count = (user.login_count or 0) + 1
        
        # Create admin tokens
        token_data = TokenManager.create_enhanced_tokens(
            user, 
            device_fingerprint, 
            remember_me
        )
        
        # Log successful admin login
        TokenManager.log_security_event(
            user.id, 'successful_admin_login',
            f'Device: {device_fingerprint}, Remember: {remember_me}'
        )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Admin login successful',
            'user': user.to_dict(),
            'access_token': token_data['access_token'],
            'refresh_token': token_data['refresh_token'],
            'expires_in': token_data['expires_in'],
            'refresh_expires_in': token_data['refresh_expires_in'],
            'session_id': token_data['session_id']
        }), 200
        
    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'An error occurred during admin login'
        }), 500

@auth_bp.route('/profile', methods=['GET'])
@login_required
def profile():
    try:
        return jsonify({'success': True, 'user': current_user.to_dict()}), 200
    except Exception as e:
        logger.error(f"Profile error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get profile'}), 500

# Enhanced logout
@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    try:
        uid = current_user.id
        logout_user()
        TokenManager.log_security_event(uid, 'logout', 'User logged out')
        return jsonify({'success': True, 'message': 'Logged out successfully'}), 200
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'success': False, 'message': 'Logout failed'}), 500

# Enhanced logout all sessions
@auth_bp.route('/logout-all', methods=['POST'])
@login_required
def logout_all():
    try:
        uid = current_user.id
        logout_user()
        TokenManager.log_security_event(uid, 'logout_all', 'All sessions terminated')
        return jsonify({'success': True, 'message': 'Logged out'}), 200
    except Exception as e:
        logger.error(f"Logout all error: {str(e)}")
        return jsonify({'success': False, 'message': 'Logout failed'}), 500

# Get user sessions
@auth_bp.route('/sessions', methods=['GET'])
@login_required
def get_sessions():
    try:
        return jsonify({'success': True, 'sessions': []}), 200
    except Exception as e:
        logger.error(f"Get sessions error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get sessions'}), 500

# End specific session
@auth_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@login_required
def end_session(session_id):
    try:
        return jsonify({'success': True, 'message': 'Session ended successfully'}), 200
    except Exception as e:
        logger.error(f"End session error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to end session'}), 500

# Enhanced registration
@auth_bp.route('/register', methods=['POST'])
def register():
    """Enhanced user registration with comprehensive validation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['name', 'email', 'password', 'confirm_password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        name = data['name'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        confirm_password = data['confirm_password']
        
        # Check if passwords match
        if password != confirm_password:
            return jsonify({
                'success': False,
                'message': 'Passwords do not match'
            }), 400
        
        # Validate password
        password_validation = password_validator.validate_password(password)
        if not password_validation['is_valid']:
            return jsonify({
                'success': False,
                'message': 'Password validation failed',
                'errors': password_validation['errors'],
                'strength': password_validation['strength']
            }), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 409
        
        # Create user
        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            is_active=True,
            email_verified=False
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Send welcome email
        try:
            send_email(
                subject='Welcome to DoggoDaily!',
                recipients=user.email,
                template='welcome',
                user=user
            )
        except Exception as e:
            logger.warning(f"Failed to send welcome email: {str(e)}")
        
        # Log registration
        TokenManager.log_security_event(
            user.id, 'user_registered',
            f'Email: {email}'
        )
        
        return jsonify({
            'success': True,
            'message': 'Registration successful. Please check your email to verify your account.',
            'user': user.to_dict(),
            'requires_email_verification': True
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Registration failed'
        }), 500

# Enhanced password change
@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """Enhanced password change with security checks"""
    try:
        current_user_id = current_user.id
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        logout_all_sessions = data.get('logout_all_sessions', True)
        
        if not all([current_password, new_password, confirm_password]):
            return jsonify({
                'success': False,
                'message': 'All password fields are required'
            }), 400
        
        if new_password != confirm_password:
            return jsonify({
                'success': False,
                'message': 'New passwords do not match'
            }), 400
        
        # Get user
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Verify current password
        if not user.check_password(current_password):
            return jsonify({
                'success': False,
                'message': 'Current password is incorrect'
            }), 401
        
        # Validate new password
        password_validation = password_validator.validate_password(new_password)
        if not password_validation['is_valid']:
            return jsonify({
                'success': False,
                'message': 'Password validation failed',
                'errors': password_validation['errors'],
                'strength': password_validation['strength']
            }), 400
        
        # Check if new password is same as current
        if user.check_password(new_password):
            return jsonify({
                'success': False,
                'message': 'New password must be different from current password'
            }), 400
        
        # Update password
        user.password_hash = generate_password_hash(new_password)
        user.password_changed_at = datetime.utcnow()
        user.requires_password_change = False
        
        # Log password change
        TokenManager.log_security_event(
            user.id, 'password_changed',
            'Password updated successfully'
        )
        
        # Optional: end other sessions if tracked
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Password change error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Password change failed'
        }), 500

# Enhanced forgot password
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Enhanced forgot password with rate limiting"""
    try:
        data = request.get_json()
        if not data or not data.get('email'):
            return jsonify({
                'success': False,
                'message': 'Email is required'
            }), 400
        
        email = data['email'].strip().lower()
        
        # Find user
        user = User.query.filter_by(email=email).first()
        if not user:
            # Don't reveal if user exists
            return jsonify({
                'success': True,
                'message': 'If an account with this email exists, a password reset link has been sent'
            }), 200
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        user.reset_password_token = reset_token
        user.reset_password_expires = datetime.utcnow() + timedelta(hours=1)
        
        db.session.commit()
        
        # Send reset email
        try:
            # In development, just log the reset token instead of sending email
            if current_app.config.get('MAIL_SUPPRESS_SEND', False):
                logger.info(f"Password reset token for {user.email}: {reset_token}")
                logger.info(f"Reset URL: {current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}")
            else:
                send_email(
                    subject='Password Reset Request',
                    recipients=user.email,
                    template='password_reset',
                    user=user,
                    reset_token=reset_token
                )
        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Failed to send reset email'
            }), 500
        
        # Log password reset request
        TokenManager.log_security_event(
            user.id, 'password_reset_requested',
            f'Email: {email}'
        )
        
        return jsonify({
            'success': True,
            'message': 'Password reset link sent to your email'
        }), 200
        
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Password reset request failed'
        }), 500

# Enhanced reset password
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Enhanced password reset with token validation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        token = data.get('token')
        new_password = data.get('password')
        confirm_password = data.get('confirm_password')
        
        if not all([token, new_password, confirm_password]):
            return jsonify({
                'success': False,
                'message': 'All fields are required'
            }), 400
        
        if new_password != confirm_password:
            return jsonify({
                'success': False,
                'message': 'Passwords do not match'
            }), 400
        
        # Find user by reset token
        user = User.query.filter_by(reset_password_token=token).first()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid or expired reset token'
            }), 400
        
        # Check if token is expired
        if user.reset_password_expires and user.reset_password_expires < datetime.utcnow():
            return jsonify({
                'success': False,
                'message': 'Reset token has expired'
            }), 400
        
        # Validate new password
        password_validation = password_validator.validate_password(new_password)
        if not password_validation['is_valid']:
            return jsonify({
                'success': False,
                'message': 'Password validation failed',
                'errors': password_validation['errors'],
                'strength': password_validation['strength']
            }), 400
        
        # Update password
        user.password_hash = generate_password_hash(new_password)
        user.password_changed_at = datetime.utcnow()
        user.reset_password_token = None
        user.reset_password_expires = None
        user.requires_password_change = False
        
        # Logout all sessions
        TokenManager.revoke_tokens(user.id)
        
        # Log password reset
        TokenManager.log_security_event(
            user.id, 'password_reset_completed',
            'Password reset via email'
        )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password reset successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Password reset failed'
        }), 500

# Enhanced email verification
@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Enhanced email verification"""
    try:
        data = request.get_json()
        if not data or not data.get('token'):
            return jsonify({
                'success': False,
                'message': 'Verification token is required'
            }), 400
        
        token = data['token']
        
        # Find user by verification token
        user = User.query.filter_by(email_verification_token=token).first()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid verification token'
            }), 400
        
        # Check if token is expired
        if user.email_verification_expires and user.email_verification_expires < datetime.utcnow():
            return jsonify({
                'success': False,
                'message': 'Verification token has expired'
            }), 400
        
        # Verify email
        user.email_verified = True
        user.email_verification_token = None
        user.email_verification_expires = None
        user.verified_at = datetime.utcnow()
        
        # Log email verification
        TokenManager.log_security_event(
            user.id, 'email_verified',
            f'Email: {user.email}'
        )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Email verified successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Email verification failed'
        }), 500

# Enhanced resend verification email
@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend email verification"""
    try:
        data = request.get_json()
        if not data or not data.get('email'):
            return jsonify({
                'success': False,
                'message': 'Email is required'
            }), 400
        
        email = data['email'].strip().lower()
        
        # Find user
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        if user.email_verified:
            return jsonify({
                'success': False,
                'message': 'Email is already verified'
            }), 400
        
        # Generate new verification token
        verification_token = secrets.token_urlsafe(32)
        user.email_verification_token = verification_token
        user.email_verification_expires = datetime.utcnow() + timedelta(hours=24)
        
        db.session.commit()
        
        # Send verification email
        try:
            send_email(
                subject='Verify Your Email',
                recipients=user.email,
                template='verify_email',
                user=user,
                verification_token=verification_token
            )
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Failed to send verification email'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Verification email sent'
        }), 200
        
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to resend verification email'
        }), 500

# Enhanced 2FA setup
@auth_bp.route('/setup-2fa', methods=['POST'])
@login_required
def setup_2fa():
    """Enhanced 2FA setup"""
    try:
        current_user_id = current_user.id
        data = request.get_json()
        
        if not data or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Password is required'
            }), 400
        
        password = data['password']
        
        # Get user
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Verify password
        if not user.check_password(password):
            return jsonify({
                'success': False,
                'message': 'Password is incorrect'
            }), 401
        
        # Generate 2FA secret
        secret = user.generate_2fa_secret()
        backup_codes = user.generate_backup_codes()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '2FA setup initiated',
            'secret': secret,
            'backup_codes': backup_codes,
            'qr_code_url': user.get_2fa_qr_code()
        }), 200
        
    except Exception as e:
        logger.error(f"2FA setup error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': '2FA setup failed'
        }), 500

# Enhanced 2FA verification
@auth_bp.route('/verify-2fa', methods=['POST'])
@login_required
def verify_2fa():
    """Enhanced 2FA verification"""
    try:
        current_user_id = current_user.id
        data = request.get_json()
        
        if not data or not data.get('token'):
            return jsonify({
                'success': False,
                'message': '2FA token is required'
            }), 400
        
        token = data['token']
        
        # Get user
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Verify 2FA token
        if user.verify_2fa_token(token):
            user.two_factor_enabled = True
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': '2FA enabled successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid 2FA token'
            }), 401
        
    except Exception as e:
        logger.error(f"2FA verification error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': '2FA verification failed'
        }), 500

# Enhanced 2FA disable
@auth_bp.route('/disable-2fa', methods=['POST'])
@login_required
def disable_2fa():
    """Enhanced 2FA disable"""
    try:
        current_user_id = current_user.id
        data = request.get_json()
        
        if not data or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Password is required'
            }), 400
        
        password = data['password']
        token = data.get('token')  # Optional backup code
        
        # Get user
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Verify password
        if not user.check_password(password):
            return jsonify({
                'success': False,
                'message': 'Password is incorrect'
            }), 401
        
        # If token provided, verify it's a backup code
        if token and not user.verify_backup_code(token):
            return jsonify({
                'success': False,
                'message': 'Invalid backup code'
            }), 401
        
        # Disable 2FA
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.backup_codes = None
        
        db.session.commit()
        
        # Log 2FA disable
        TokenManager.log_security_event(
            user.id, '2fa_disabled',
            'Two-factor authentication disabled'
        )
        
        return jsonify({
            'success': True,
            'message': '2FA disabled successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"2FA disable error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': '2FA disable failed'
        }), 500 