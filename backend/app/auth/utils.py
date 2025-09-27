import re
import secrets
import hashlib
import pyotp
import requests
from datetime import datetime, timedelta, timezone
from flask import request, current_app, jsonify
# JWT removed - using Flask-Login sessions only
from werkzeug.security import check_password_hash
from sqlalchemy import and_
from ..models import db, User, UserSession, SecurityLog
import user_agents
import logging

logger = logging.getLogger(__name__)

class PasswordValidator:
    """Advanced password validation with customizable rules"""
    
    def __init__(self):
        self.min_length = 8
        self.max_length = 128
        self.require_uppercase = True
        self.require_lowercase = True
        self.require_numbers = True
        self.require_special_chars = True
        self.min_special_chars = 1
        self.forbidden_patterns = [
            r'(.)\1{2,}',  # No more than 2 consecutive identical characters
            r'123|234|345|456|567|678|789|890',  # No sequential numbers
            r'abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz',  # No sequential letters
            r'qwerty|asdfgh|zxcvbn|password|admin|login|welcome|secret|master',  # Common weak patterns
        ]
        self.special_chars = r'[!@#$%^&*(),.?":{}|<>]'
    
    def validate(self, password, user=None):
        """Comprehensive password validation"""
        errors = []
        
        # Length check
        if len(password) < self.min_length:
            errors.append(f'Password must be at least {self.min_length} characters long')
        if len(password) > self.max_length:
            errors.append(f'Password cannot exceed {self.max_length} characters')
        
        # Character requirements
        if self.require_uppercase and not re.search(r'[A-Z]', password):
            errors.append('Password must contain at least one uppercase letter')
        if self.require_lowercase and not re.search(r'[a-z]', password):
            errors.append('Password must contain at least one lowercase letter')
        if self.require_numbers and not re.search(r'\d', password):
            errors.append('Password must contain at least one number')
        if self.require_special_chars:
            special_count = len(re.findall(self.special_chars, password))
            if special_count < self.min_special_chars:
                errors.append(f'Password must contain at least {self.min_special_chars} special character(s)')
        
        # Forbidden patterns
        password_lower = password.lower()
        for pattern in self.forbidden_patterns:
            if re.search(pattern, password_lower):
                errors.append('Password contains forbidden patterns or common weak sequences')
                break
        
        # User-specific checks
        if user:
            user_data = [user.name.lower(), user.email.lower().split('@')[0]]
            for data in user_data:
                if data and len(data) > 2 and data in password_lower:
                    errors.append('Password cannot contain personal information')
                    break
            
            # Check password history
            if user.is_password_reused(password):
                errors.append('Password was recently used. Please choose a different password')
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'strength_score': self._calculate_strength_score(password)
        }
    
    def _calculate_strength_score(self, password):
        """Calculate password strength score (0-100)"""
        score = 0
        
        # Length bonus
        score += min(password.__len__() * 2, 20)
        
        # Character diversity
        if re.search(r'[A-Z]', password):
            score += 10
        if re.search(r'[a-z]', password):
            score += 10
        if re.search(r'\d', password):
            score += 10
        if re.search(self.special_chars, password):
            score += 15
        
        # Bonus for multiple character types
        char_types = sum([
            bool(re.search(r'[A-Z]', password)),
            bool(re.search(r'[a-z]', password)),
            bool(re.search(r'\d', password)),
            bool(re.search(self.special_chars, password))
        ])
        score += char_types * 5
        
        # Penalty for common patterns
        password_lower = password.lower()
        for pattern in self.forbidden_patterns:
            if re.search(pattern, password_lower):
                score -= 20
                break
        
        return max(0, min(100, score))


class TwoFactorAuth:
    """Two-factor authentication utilities"""
    
    @staticmethod
    def generate_secret():
        """Generate a new TOTP secret"""
        return pyotp.random_base32()
    
    @staticmethod
    def get_qr_code_url(secret, email, issuer="DoggoDaily"):
        """Generate QR code URL for TOTP setup"""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=email, issuer_name=issuer)
    
    @staticmethod
    def verify_token(secret, token):
        """Verify TOTP token"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
    
    @staticmethod
    def generate_backup_codes(count=8):
        """Generate backup codes"""
        return [secrets.token_hex(4).upper() for _ in range(count)]


class SecurityUtils:
    """General security utilities"""
    
    @staticmethod
    def generate_secure_token(length=32):
        """Generate cryptographically secure token"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def hash_device_fingerprint(user_agent, ip_address, additional_data=None):
        """Create device fingerprint hash"""
        data = f"{user_agent}:{ip_address}"
        if additional_data:
            data += f":{additional_data}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    @staticmethod
    def get_device_fingerprint(request):
        """Get device fingerprint from request"""
        user_agent = request.headers.get('User-Agent', '')
        ip_address = request.remote_addr
        return SecurityUtils.hash_device_fingerprint(user_agent, ip_address)
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP address from request"""
        # Check for proxy headers
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        elif request.headers.get('X-Real-IP'):
            return request.headers.get('X-Real-IP')
        else:
            return request.remote_addr
    
    @staticmethod
    def is_suspicious_ip(ip_address):
        """Check if IP address is suspicious (basic implementation)"""
        # This could be expanded to check against threat intelligence feeds
        suspicious_ranges = [
            '10.0.0.0/8',    # Private networks (shouldn't be seen from internet)
            '172.16.0.0/12',
            '192.168.0.0/16'
        ]
        # Add more sophisticated IP checking logic here
        return False
    
    @staticmethod
    def detect_suspicious_activity(user, request):
        """Detect suspicious login activity"""
        try:
            ip_address = SecurityUtils.get_client_ip(request)
            device_fingerprint = SecurityUtils.get_device_fingerprint(request)
            user_agent = request.headers.get('User-Agent', '')
            
            suspicious_indicators = []
            
            # Check for suspicious IP
            if SecurityUtils.is_suspicious_ip(ip_address):
                suspicious_indicators.append('suspicious_ip')
            
            # Check for new device
            if SecurityUtils.is_new_device(user, device_fingerprint):
                suspicious_indicators.append('new_device')
            
            # Check for unusual user agent
            if not user_agent or len(user_agent) < 10:
                suspicious_indicators.append('suspicious_user_agent')
            
            # Check login frequency (too many attempts)
            recent_attempts = SecurityLog.query.filter(
                SecurityLog.user_id == user.id,
                SecurityLog.event_type == 'login_attempt',
                SecurityLog.timestamp >= datetime.utcnow() - timedelta(hours=1)
            ).count()
            
            if recent_attempts > 10:
                suspicious_indicators.append('high_frequency_login')
            
            # Check for geographic anomalies (placeholder - would need IP geolocation)
            # This would require external IP geolocation service
            
            return {
                'is_suspicious': len(suspicious_indicators) > 0,
                'indicators': suspicious_indicators,
                'risk_level': 'high' if len(suspicious_indicators) > 2 else 'medium' if len(suspicious_indicators) > 0 else 'low',
                'ip_address': ip_address,
                'device_fingerprint': device_fingerprint
            }
            
        except Exception as e:
            logger.error(f"Error detecting suspicious activity: {str(e)}")
            return {
                'is_suspicious': False,
                'indicators': [],
                'risk_level': 'low',
                'ip_address': 'unknown',
                'device_fingerprint': 'unknown'
            }
    
    @staticmethod
    def is_new_device(user, device_fingerprint):
        """Check if this is a new device for the user"""
        if not device_fingerprint:
            return True
        
        # Check if this device fingerprint exists in user's recent sessions
        recent_sessions = UserSession.query.filter_by(
            user_id=user.id,
            device_fingerprint=device_fingerprint
        ).filter(
            UserSession.created_at > datetime.utcnow() - timedelta(days=30)
        ).first()
        
        return recent_sessions is None
    
    @staticmethod
    def is_suspicious_location(user, ip_address):
        """Check if login location is suspicious"""
        # Basic implementation - could be enhanced with geolocation
        return False
    
    @staticmethod
    def get_ip_location(ip_address):
        """Get approximate location for IP address"""
        try:
            # Using a free geolocation service (in production, use a proper service)
            response = requests.get(f'http://ip-api.com/json/{ip_address}', timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'success':
                    return f"{data.get('city', 'Unknown')}, {data.get('country', 'Unknown')}"
        except:
            pass
        return None
    
    @staticmethod
    def parse_user_agent(user_agent_string):
        """Parse user agent string for device information"""
        try:
            user_agent = user_agents.parse(user_agent_string)
            return {
                'browser': f"{user_agent.browser.family} {user_agent.browser.version_string}",
                'os': f"{user_agent.os.family} {user_agent.os.version_string}",
                'device': user_agent.device.family,
                'is_mobile': user_agent.is_mobile,
                'is_tablet': user_agent.is_tablet,
                'is_bot': user_agent.is_bot
            }
        except:
            return {
                'browser': 'Unknown',
                'os': 'Unknown',
                'device': 'Unknown',
                'is_mobile': False,
                'is_tablet': False,
                'is_bot': False
            }


class TokenManager:
    """Enhanced token management with automatic refresh and security features"""
    
    @staticmethod
    def create_enhanced_tokens(user, device_fingerprint=None, remember_me=False):
        """Create access and refresh tokens with enhanced security"""
        try:
            # Normalize input: accept either a User instance or a user_id (int/str)
            resolved_user: User | None = None
            user_id: int | None = None
            if hasattr(user, 'id'):
                # Likely a User model
                resolved_user = user
                user_id = user.id
            else:
                try:
                    user_id = int(user)
                except (TypeError, ValueError):
                    raise ValueError("create_enhanced_tokens requires a User or user_id")
                resolved_user = User.query.get(user_id)
                if not resolved_user:
                    raise ValueError("User not found for provided user_id")

            # Debug log the resolved user info to diagnose issues
            try:
                logger.debug(f"create_enhanced_tokens: resolved user -> type={type(resolved_user)}, id={user_id}")
            except Exception:
                pass

            # Get user's current sessions
            active_sessions = UserSession.query.filter_by(
                user_id=user_id, 
                is_active=True
            ).count()
            
            # Check session limits
            max_sessions = current_app.config.get('MAX_CONCURRENT_SESSIONS', 5)
            if active_sessions >= max_sessions and not remember_me:
                # End oldest session
                oldest_session = UserSession.query.filter_by(
                    user_id=user_id, 
                    is_active=True
                ).order_by(UserSession.created_at.asc()).first()
                
                if oldest_session:
                    oldest_session.is_active = False
                    oldest_session.ended_at = datetime.utcnow()
                    db.session.commit()
            
            # Create enhanced claims
            additional_claims = {
                'user_id': user_id,
                'email': resolved_user.email,
                'admin_level': resolved_user.admin_level,
                'device_fingerprint': device_fingerprint,
                'session_type': 'remember_me' if remember_me else 'standard',
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', ''),
                'jti': secrets.token_urlsafe(32)
            }
            
            # Create tokens with different expiration times
            access_expires = timedelta(hours=1) if not remember_me else timedelta(hours=24)
            refresh_expires = timedelta(days=7) if not remember_me else timedelta(days=30)
            
            # JWT tokens removed - using Flask-Login sessions only
            access_token = None
            
            # JWT tokens removed - using Flask-Login sessions only  
            refresh_token = None
            
            # Create session record
            session = UserSession(
                user_id=user_id,
                access_token_jti=additional_claims['jti'],
                refresh_token_jti=secrets.token_urlsafe(32),
                device_fingerprint=device_fingerprint,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent', ''),
                is_active=True,
                expires_at=datetime.utcnow() + refresh_expires
            )
            
            db.session.add(session)
            db.session.commit()
            
            return {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'session_id': session.id,
                'expires_in': int(access_expires.total_seconds()),
                'refresh_expires_in': int(refresh_expires.total_seconds())
            }
            
        except Exception as e:
            logger.error(f"Token creation failed: {str(e)}")
            db.session.rollback()
            raise
    
    @staticmethod
    def refresh_tokens(refresh_token, device_fingerprint=None):
        """Enhanced token refresh with security checks"""
        try:
            # JWT removed - using Flask-Login sessions only
            # This method is deprecated and should not be used
            return {'success': False, 'message': 'Token refresh not supported - using session-based auth only'}
            
            user_id = payload.get('sub')
            if not user_id:
                raise ValueError("Invalid refresh token")
            
            # Get user
            user = User.query.get(user_id)
            if not user or not user.is_active:
                raise ValueError("User not found or inactive")
            
            # Check if session exists and is active
            session = UserSession.query.filter_by(
                user_id=user_id,
                is_active=True
            ).first()
            
            if not session:
                raise ValueError("Session not found or inactive")
            
            # Security checks
            if session.device_fingerprint and device_fingerprint:
                if session.device_fingerprint != device_fingerprint:
                    logger.warning(f"Device fingerprint mismatch for user {user_id}")
                    # Log suspicious activity
                    TokenManager.log_security_event(
                        user_id, 'device_fingerprint_mismatch',
                        f"Expected: {session.device_fingerprint}, Got: {device_fingerprint}"
                    )
            
            # Create new tokens
            additional_claims = {
                'user_id': user.id,
                'email': user.email,
                'admin_level': user.admin_level,
                'device_fingerprint': device_fingerprint,
                'session_type': 'refreshed',
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', ''),
                'jti': secrets.token_urlsafe(32)
            }
            
            # JWT tokens removed - using Flask-Login sessions only
            access_token = None
            
            # Update session
            session.access_token_jti = additional_claims['jti']
            session.last_activity = datetime.utcnow()
            db.session.commit()
            
            return {
                'access_token': access_token,
                'expires_in': 3600,
                'user': user.to_dict()
            }
            
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise
    
    @staticmethod
    def revoke_tokens(user_id, session_id=None):
        """Revoke tokens for a user or specific session"""
        try:
            if session_id:
                # Revoke specific session
                session = UserSession.query.filter_by(
                    id=session_id,
                    user_id=user_id
                ).first()
                
                if session:
                    session.is_active = False
                    session.ended_at = datetime.utcnow()
                    db.session.commit()
                    logger.info(f"Session {session_id} revoked for user {user_id}")
            else:
                # Revoke all sessions for user
                UserSession.query.filter_by(
                    user_id=user_id,
                    is_active=True
                ).update({
                    'is_active': False,
                    'ended_at': datetime.utcnow()
                })
                db.session.commit()
                logger.info(f"All sessions revoked for user {user_id}")
                
        except Exception as e:
            logger.error(f"Token revocation failed: {str(e)}")
            db.session.rollback()
            raise
    
    @staticmethod
    def validate_session(user_id, device_fingerprint=None):
        """Validate if user has active session"""
        try:
            session = UserSession.query.filter_by(
                user_id=user_id,
                is_active=True
            ).first()
            
            if not session:
                return False
            
            # Check if session is expired
            if session.expires_at and session.expires_at < datetime.utcnow():
                session.is_active = False
                session.ended_at = datetime.utcnow()
                db.session.commit()
                return False
            
            # Update last activity
            session.last_activity = datetime.utcnow()
            db.session.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Session validation failed: {str(e)}")
            return False
    
    @staticmethod
    def log_security_event(user_id, event_type, details=None):
        """Log security events for monitoring"""
        try:
            security_log = SecurityLog(
                user_id=user_id,
                event_type=event_type,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent', ''),
                details=details,
                timestamp=datetime.utcnow()
            )
            db.session.add(security_log)
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Security logging failed: {str(e)}")
    
    @staticmethod
    def cleanup_expired_sessions():
        """Clean up expired sessions"""
        try:
            expired_sessions = UserSession.query.filter(
                and_(
                    UserSession.is_active == True,
                    UserSession.expires_at < datetime.utcnow()
                )
            ).all()
            
            for session in expired_sessions:
                session.is_active = False
                session.ended_at = datetime.utcnow()
            
            db.session.commit()
            logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
            
        except Exception as e:
            logger.error(f"Session cleanup failed: {str(e)}")
            db.session.rollback()

class SessionManager:
    """Enhanced session management"""
    
    @staticmethod
    def get_user_sessions(user_id):
        """Get all active sessions for a user"""
        try:
            sessions = UserSession.query.filter_by(
                user_id=user_id,
                is_active=True
            ).order_by(UserSession.created_at.desc()).all()
            
            return [{
                'id': session.id,
                'device_fingerprint': session.device_fingerprint,
                'ip_address': session.ip_address,
                'user_agent': session.user_agent,
                'created_at': session.created_at.isoformat(),
                'last_activity': session.last_activity.isoformat() if session.last_activity else None,
                'expires_at': session.expires_at.isoformat() if session.expires_at else None
            } for session in sessions]
            
        except Exception as e:
            logger.error(f"Failed to get user sessions: {str(e)}")
            return []
    
    @staticmethod
    def end_session(user_id, session_id):
        """End a specific session"""
        try:
            session = UserSession.query.filter_by(
                id=session_id,
                user_id=user_id
            ).first()
            
            if session:
                session.is_active = False
                session.ended_at = datetime.utcnow()
                db.session.commit()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to end session: {str(e)}")
            db.session.rollback()
            return False
    
    @staticmethod
    def end_all_sessions(user_id, exclude_session_id=None):
        """End all sessions for a user except the current one"""
        try:
            query = UserSession.query.filter_by(
                user_id=user_id,
                is_active=True
            )
            
            if exclude_session_id:
                query = query.filter(UserSession.id != exclude_session_id)
            
            sessions = query.all()
            
            for session in sessions:
                session.is_active = False
                session.ended_at = datetime.utcnow()
            
            db.session.commit()
            return len(sessions)
            
        except Exception as e:
            logger.error(f"Failed to end all sessions: {str(e)}")
            db.session.rollback()
            return 0

# Enhanced password validator
class PasswordValidator:
    """Enhanced password validation with multiple checks"""
    
    @staticmethod
    def validate_password(password):
        """Comprehensive password validation"""
        errors = []
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        if len(password) > 128:
            errors.append("Password must be less than 128 characters")
        
        if not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one number")
        
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            errors.append("Password must contain at least one special character")
        
        # Check for common patterns
        common_patterns = [
            'password', '123456', 'qwerty', 'admin', 'user',
            'letmein', 'welcome', 'monkey', 'dragon', 'master'
        ]
        
        password_lower = password.lower()
        for pattern in common_patterns:
            if pattern in password_lower:
                errors.append("Password contains common patterns")
                break
        
        # Check for repeated characters
        for i in range(len(password) - 2):
            if password[i] == password[i+1] == password[i+2]:
                errors.append("Password contains too many repeated characters")
                break
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'strength': PasswordValidator.calculate_strength(password)
        }
    
    @staticmethod
    def calculate_strength(password):
        """Calculate password strength score (0-100)"""
        score = 0
        
        # Length contribution
        score += min(len(password) * 4, 40)
        
        # Character variety
        if any(c.isupper() for c in password):
            score += 10
        if any(c.islower() for c in password):
            score += 10
        if any(c.isdigit() for c in password):
            score += 10
        if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            score += 15
        
        # Complexity bonus
        unique_chars = len(set(password))
        score += min(unique_chars * 2, 20)
        
        # Penalty for common patterns
        common_patterns = [
            'password', '123456', 'qwerty', 'admin', 'user'
        ]
        
        password_lower = password.lower()
        for pattern in common_patterns:
            if pattern in password_lower:
                score -= 30
                break
        
        return max(0, min(100, score))

# Initialize instances for easy import
password_validator = PasswordValidator()
token_manager = TokenManager()
session_manager = SessionManager() 