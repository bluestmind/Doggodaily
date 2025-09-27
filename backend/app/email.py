from flask import current_app, render_template
from flask_mail import Message
from threading import Thread
import secrets
import os
from datetime import datetime, timedelta

def send_async_email(app, msg):
    """Send email asynchronously"""
    with app.app_context():
        from .extensions import mail
        try:
            mail.send(msg)
            app.logger.info(f"Email sent successfully to {msg.recipients}")
        except Exception as e:
            app.logger.error(f"Failed to send email to {msg.recipients}: {str(e)}")

def send_email(subject, recipients, template=None, **kwargs):
    """Send email with optional template rendering"""
    try:
        msg = Message(
            subject=f"[DoggoDaily] {subject}",
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@doggodaily.com'),
            recipients=recipients if isinstance(recipients, list) else [recipients]
        )
        
        if template:
            # Render HTML template
            try:
                msg.html = render_template(f'email/{template}.html', **kwargs)
            except:
                # Fallback to text if HTML template not found
                msg.body = render_template(f'email/{template}.txt', **kwargs)
        else:
            # Use provided body
            msg.body = kwargs.get('body', '')
            msg.html = kwargs.get('html', '')
        
        # Send email asynchronously
        thread = Thread(target=send_async_email, args=(current_app._get_current_object(), msg))
        thread.start()
        
        return True
    except Exception as e:
        current_app.logger.error(f"Email sending failed: {str(e)}")
        return False

# Security Email Functions

def send_verification_email(user, verification_token):
    """Send email verification email to new users"""
    verification_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={verification_token}"
    
    return send_email(
        subject="Please verify your email address",
        recipients=user.email,
        template="verify_email",
        user=user,
        verification_url=verification_url,
        token=verification_token,
        expires_in_hours=24
    )

def send_password_reset_email(user, reset_token):
    """Send password reset email"""
    reset_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"
    
    return send_email(
        subject="Password Reset Request",
        recipients=user.email,
        template="password_reset",
        user=user,
        reset_url=reset_url,
        token=reset_token,
        expires_in_hours=1
    )

def send_password_changed_notification(user, ip_address=None, user_agent=None):
    """Send notification when password is changed"""
    return send_email(
        subject="Your password has been changed",
        recipients=user.email,
        template="password_changed",
        user=user,
        ip_address=ip_address or 'Unknown',
        user_agent=user_agent or 'Unknown',
        timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    )

def send_login_notification(user, ip_address=None, user_agent=None, is_new_device=False):
    """Send notification for new login"""
    return send_email(
        subject="New login to your account" if is_new_device else "Login notification",
        recipients=user.email,
        template="login_notification",
        user=user,
        ip_address=ip_address or 'Unknown',
        user_agent=user_agent or 'Unknown',
        is_new_device=is_new_device,
        timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    )

def send_account_locked_notification(user, unlock_time=None, failed_attempts=0):
    """Send notification when account is locked"""
    return send_email(
        subject="Account temporarily locked",
        recipients=user.email,
        template="account_locked",
        user=user,
        unlock_time=unlock_time.strftime('%Y-%m-%d %H:%M:%S UTC') if unlock_time else 'Please contact support',
        failed_attempts=failed_attempts,
        timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    )

def send_2fa_enabled_notification(user):
    """Send notification when 2FA is enabled"""
    return send_email(
        subject="Two-factor authentication enabled",
        recipients=user.email,
        template="2fa_enabled",
        user=user,
        timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    )

def send_2fa_disabled_notification(user, ip_address=None):
    """Send notification when 2FA is disabled"""
    return send_email(
        subject="Two-factor authentication disabled",
        recipients=user.email,
        template="2fa_disabled",
        user=user,
        ip_address=ip_address or 'Unknown',
        timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    )

def send_suspicious_activity_alert(user, activity_description, ip_address=None):
    """Send alert for suspicious activity"""
    return send_email(
        subject="Suspicious activity detected on your account",
        recipients=user.email,
        template="suspicious_activity",
        user=user,
        activity_description=activity_description,
        ip_address=ip_address or 'Unknown',
        timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    )

def send_welcome_email(user):
    """Send welcome email to new users"""
    return send_email(
        subject="Welcome to DoggoDaily!",
        recipients=user.email,
        template="welcome",
        user=user,
        login_url=f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/login"
    )

def send_session_ended_notification(user, session_info):
    """Send notification when sessions are ended remotely"""
    return send_email(
        subject="Your sessions have been ended",
        recipients=user.email,
        template="session_ended",
        user=user,
        session_info=session_info,
        timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    )

# Token Generation Functions

def generate_verification_token():
    """Generate a secure email verification token"""
    return secrets.token_urlsafe(32)

def generate_reset_token():
    """Generate a secure password reset token"""
    return secrets.token_urlsafe(32)

# Email Template Validation

def validate_email_config():
    """Validate email configuration"""
    required_configs = [
        'MAIL_SERVER',
        'MAIL_PORT',
        'MAIL_USERNAME',
        'MAIL_PASSWORD'
    ]
    
    missing_configs = []
    for config in required_configs:
        if not current_app.config.get(config):
            missing_configs.append(config)
    
    if missing_configs:
        current_app.logger.warning(f"Missing email configurations: {', '.join(missing_configs)}")
        return False
    
    return True

# Test Email Function

def send_test_email(recipient_email):
    """Send a test email to verify email configuration"""
    return send_email(
        subject="Test Email - Configuration Verification",
        recipients=recipient_email,
        body="This is a test email to verify your email configuration is working correctly.",
        html="<p>This is a test email to verify your email configuration is working correctly.</p>"
    ) 