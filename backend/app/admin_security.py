from flask import current_app, request, session, jsonify
from datetime import datetime, timedelta
from functools import wraps
import json
import hashlib
import secrets
from enum import Enum

from .models import db, User, AdminAuditLog, SecurityAlert, SystemConfig
from .email import send_suspicious_activity_alert

class PermissionLevel(Enum):
    """Admin permission levels"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"
    VIEWER = "viewer"

class SecurityLevel(Enum):
    """Security alert levels"""
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"
    CRITICAL = "critical"

class AdminSecurityManager:
    """Comprehensive admin security management"""
    
    def __init__(self):
        self.failed_attempts_threshold = 3
        self.lockout_duration = 30  # minutes
        self.session_timeout = 60   # minutes
        
    def require_permission(self, required_permission):
        """Decorator to enforce admin permissions"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                if not self.check_admin_permission(required_permission):
                    self.log_unauthorized_attempt(required_permission)
                    return {
                        'success': False,
                        'message': 'Insufficient permissions',
                        'required_permission': required_permission
                    }, 403
                return f(*args, **kwargs)
            return decorated_function
        return decorator
    
    def check_admin_permission(self, required_permission):
        """Check if current user has required admin permission"""
        from flask_login import current_user
        
        try:
            user_id = current_user.id if current_user.is_authenticated else None
            if not user_id:
                return False
                
            user = current_user
            if not user or not user.is_admin_user():
                return False
                
            # Super admin has all permissions
            if user.admin_level == PermissionLevel.SUPER_ADMIN.value:
                return True
                
            # Check specific permissions
            permissions_map = {
                PermissionLevel.ADMIN.value: [
                    'view_users', 'edit_users', 'delete_users',
                    'view_system', 'edit_system', 'view_security',
                    'manage_content', 'view_analytics'
                ],
                PermissionLevel.MODERATOR.value: [
                    'view_users', 'edit_users', 'manage_content', 
                    'view_analytics'
                ],
                PermissionLevel.VIEWER.value: [
                    'view_users', 'view_analytics'
                ]
            }
            
            user_permissions = permissions_map.get(user.admin_level, [])
            return required_permission in user_permissions
            
        except Exception as e:
            current_app.logger.error(f"Permission check error: {str(e)}")
            return False
    
    def log_admin_action(self, action, target_type=None, target_id=None, 
                        details=None, severity='info'):
        """Log admin actions for audit trail"""
        from flask_login import current_user
        
        try:
            user_id = current_user.id if current_user.is_authenticated else None
            user = current_user
            
            audit_log = AdminAuditLog(
                admin_user_id=int(user_id),
                admin_username=user.email if user else 'Unknown',
                action=action,
                target_type=target_type,
                target_id=target_id,
                ip_address=self.get_client_ip(),
                user_agent=request.headers.get('User-Agent', ''),
                details=json.dumps(details) if details else None,
                severity=severity,
                timestamp=datetime.utcnow()
            )
            
            db.session.add(audit_log)
            db.session.commit()
            
            # Log to application logger as well
            current_app.logger.info(
                f"Admin action: {user.email if user else 'Unknown'} "
                f"performed '{action}' on {target_type}:{target_id}"
            )
            
            # Check for suspicious patterns
            self.check_suspicious_admin_activity(int(user_id), action)
            
        except Exception as e:
            current_app.logger.error(f"Failed to log admin action: {str(e)}")
    
    def log_unauthorized_attempt(self, attempted_action):
        """Log unauthorized admin access attempts"""
        from flask_login import current_user
        
        try:
            user_id = current_user.id if current_user.is_authenticated else None
            user = current_user
            
            self.log_admin_action(
                action='unauthorized_attempt',
                details={
                    'attempted_action': attempted_action,
                    'user_permission_level': user.admin_level if user else None
                },
                severity='warning'
            )
            
            # Create security alert for repeated unauthorized attempts
            self.create_security_alert(
                alert_type='unauthorized_admin_access',
                severity=SecurityLevel.MEDIUM,
                description=f"Unauthorized admin access attempt: {attempted_action}",
                user_id=int(user_id)
            )
            
        except Exception as e:
            current_app.logger.error(f"Failed to log unauthorized attempt: {str(e)}")
    
    def check_suspicious_admin_activity(self, admin_user_id, action):
        """Check for suspicious admin activity patterns"""
        try:
            # Check for rapid consecutive actions
            recent_actions = AdminAuditLog.query.filter(
                AdminAuditLog.admin_user_id == admin_user_id,
                AdminAuditLog.timestamp > datetime.utcnow() - timedelta(minutes=5)
            ).count()
            
            if recent_actions > 20:  # More than 20 actions in 5 minutes
                self.create_security_alert(
                    alert_type='rapid_admin_actions',
                    severity=SecurityLevel.HIGH,
                    description=f"Admin user performed {recent_actions} actions in 5 minutes",
                    user_id=admin_user_id
                )
            
            # Check for mass deletion actions
            if 'delete' in action.lower():
                recent_deletions = AdminAuditLog.query.filter(
                    AdminAuditLog.admin_user_id == admin_user_id,
                    AdminAuditLog.action.like('%delete%'),
                    AdminAuditLog.timestamp > datetime.utcnow() - timedelta(minutes=10)
                ).count()
                
                if recent_deletions > 5:  # More than 5 deletions in 10 minutes
                    self.create_security_alert(
                        alert_type='mass_deletion',
                        severity=SecurityLevel.CRITICAL,
                        description=f"Admin user performed {recent_deletions} deletion actions",
                        user_id=admin_user_id
                    )
            
            # Check for privilege escalation attempts
            if 'permission' in action.lower() or 'role' in action.lower():
                self.create_security_alert(
                    alert_type='privilege_change',
                    severity=SecurityLevel.HIGH,
                    description=f"Admin user modified permissions/roles: {action}",
                    user_id=admin_user_id
                )
                
        except Exception as e:
            current_app.logger.error(f"Error checking suspicious activity: {str(e)}")
    
    def create_security_alert(self, alert_type, severity, description, 
                            user_id=None, auto_resolve=False):
        """Create security alert for monitoring"""
        try:
            alert = SecurityAlert(
                alert_type=alert_type,
                severity=severity.value,
                description=description,
                user_id=user_id,
                ip_address=self.get_client_ip(),
                user_agent=request.headers.get('User-Agent', ''),
                timestamp=datetime.utcnow(),
                resolved=auto_resolve
            )
            
            db.session.add(alert)
            db.session.commit()
            
            # Send notification for high/critical alerts
            if severity in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]:
                self.notify_security_team(alert)
                
            return alert
            
        except Exception as e:
            current_app.logger.error(f"Failed to create security alert: {str(e)}")
            return None
    
    def notify_security_team(self, alert):
        """Notify security team of critical alerts"""
        try:
            # Get admin users who should be notified
            admin_users = User.query.filter(
                User.admin_level > 0,
                User.admin_level.in_([
                    PermissionLevel.SUPER_ADMIN.value,
                    PermissionLevel.ADMIN.value
                ])
            ).all()
            
            for admin in admin_users:
                send_suspicious_activity_alert(
                    admin,
                    f"{alert.alert_type}: {alert.description}",
                    alert.ip_address
                )
                
        except Exception as e:
            current_app.logger.error(f"Failed to notify security team: {str(e)}")
    
    def get_client_ip(self):
        """Get client IP address"""
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        elif request.headers.get('X-Real-IP'):
            return request.headers.get('X-Real-IP')
        else:
            return request.remote_addr
    
    def validate_admin_session(self, user_id):
        """Validate admin session security"""
        try:
            user = User.query.get(int(user_id))
            if not user or not user.is_admin_user():
                return False
                
            # Check session timeout
            last_activity = session.get('last_activity')
            if last_activity:
                last_activity_time = datetime.fromisoformat(last_activity)
                if datetime.utcnow() - last_activity_time > timedelta(minutes=self.session_timeout):
                    return False
            
            # Update last activity
            session['last_activity'] = datetime.utcnow().isoformat()
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"Session validation error: {str(e)}")
            return False
    
    def get_admin_audit_logs(self, admin_user_id=None, action=None, 
                           start_date=None, end_date=None, limit=100):
        """Get admin audit logs with filtering"""
        try:
            query = AdminAuditLog.query
            
            if admin_user_id:
                query = query.filter(AdminAuditLog.admin_user_id == admin_user_id)
            
            if action:
                query = query.filter(AdminAuditLog.action.like(f'%{action}%'))
            
            if start_date:
                query = query.filter(AdminAuditLog.timestamp >= start_date)
            
            if end_date:
                query = query.filter(AdminAuditLog.timestamp <= end_date)
            
            logs = query.order_by(AdminAuditLog.timestamp.desc()).limit(limit).all()
            
            return [log.to_dict() for log in logs]
            
        except Exception as e:
            current_app.logger.error(f"Error fetching audit logs: {str(e)}")
            return []
    
    def get_security_alerts(self, severity=None, resolved=None, limit=50):
        """Get security alerts with filtering"""
        try:
            query = SecurityAlert.query
            
            if severity:
                query = query.filter(SecurityAlert.severity == severity)
            
            if resolved is not None:
                query = query.filter(SecurityAlert.resolved == resolved)
            
            alerts = query.order_by(SecurityAlert.timestamp.desc()).limit(limit).all()
            
            return [alert.to_dict() for alert in alerts]
            
        except Exception as e:
            current_app.logger.error(f"Error fetching security alerts: {str(e)}")
            return []
    
    def resolve_security_alert(self, alert_id, admin_user_id, resolution_notes=None):
        """Resolve a security alert"""
        try:
            alert = SecurityAlert.query.get(alert_id)
            if not alert:
                return False
            
            alert.resolved = True
            alert.resolved_by = admin_user_id
            alert.resolved_at = datetime.utcnow()
            alert.resolution_notes = resolution_notes
            
            db.session.commit()
            
            self.log_admin_action(
                action='resolve_security_alert',
                target_type='security_alert',
                target_id=alert_id,
                details={'resolution_notes': resolution_notes}
            )
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"Error resolving security alert: {str(e)}")
            return False
    
    def generate_security_report(self, start_date, end_date):
        """Generate comprehensive security report"""
        try:
            # Get audit logs for period
            audit_logs = AdminAuditLog.query.filter(
                AdminAuditLog.timestamp.between(start_date, end_date)
            ).all()
            
            # Get security alerts for period
            security_alerts = SecurityAlert.query.filter(
                SecurityAlert.timestamp.between(start_date, end_date)
            ).all()
            
            # Aggregate statistics
            stats = {
                'period': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'audit_summary': {
                    'total_actions': len(audit_logs),
                    'unique_admins': len(set(log.admin_user_id for log in audit_logs)),
                    'actions_by_type': {},
                    'actions_by_admin': {}
                },
                'security_summary': {
                    'total_alerts': len(security_alerts),
                    'alerts_by_severity': {},
                    'resolved_alerts': len([a for a in security_alerts if a.resolved]),
                    'open_alerts': len([a for a in security_alerts if not a.resolved])
                },
                'top_risks': []
            }
            
            # Process audit logs
            for log in audit_logs:
                # Count actions by type
                action_type = log.action
                stats['audit_summary']['actions_by_type'][action_type] = \
                    stats['audit_summary']['actions_by_type'].get(action_type, 0) + 1
                
                # Count actions by admin
                admin_email = log.admin_username
                stats['audit_summary']['actions_by_admin'][admin_email] = \
                    stats['audit_summary']['actions_by_admin'].get(admin_email, 0) + 1
            
            # Process security alerts
            for alert in security_alerts:
                severity = alert.severity
                stats['security_summary']['alerts_by_severity'][severity] = \
                    stats['security_summary']['alerts_by_severity'].get(severity, 0) + 1
            
            # Identify top risks
            critical_alerts = [a for a in security_alerts if a.severity == SecurityLevel.CRITICAL.value]
            high_alerts = [a for a in security_alerts if a.severity == SecurityLevel.HIGH.value]
            
            stats['top_risks'] = [
                {
                    'type': alert.alert_type,
                    'description': alert.description,
                    'severity': alert.severity,
                    'timestamp': alert.timestamp.isoformat(),
                    'resolved': alert.resolved
                }
                for alert in (critical_alerts + high_alerts)[:10]
            ]
            
            return stats
            
        except Exception as e:
            current_app.logger.error(f"Error generating security report: {str(e)}")
            return None

class AdminPermissionManager:
    """Manage admin permissions and role assignments"""
    
    @staticmethod
    def assign_admin_role(user_id, admin_level, assigned_by_id):
        """Assign admin role to user"""
        try:
            user = User.query.get(int(user_id))
            assigned_by = User.query.get(int(assigned_by_id))
            
            if not user or not assigned_by:
                return False
            
            # Check if assigner has permission to assign this level
            if not AdminPermissionManager.can_assign_level(assigned_by, admin_level):
                return False
            
            old_level = user.admin_level
            user.admin_level = admin_level
            user.admin_assigned_at = datetime.utcnow()
            user.admin_assigned_by = assigned_by_id
            
            db.session.commit()
            
            # Log the action
            admin_security = AdminSecurityManager()
            admin_security.log_admin_action(
                action='assign_admin_role',
                target_type='user',
                target_id=user_id,
                details={
                    'old_level': old_level,
                    'new_level': admin_level,
                    'assigned_to': user.email
                },
                severity='info'
            )
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"Error assigning admin role: {str(e)}")
            return False
    
    @staticmethod
    def revoke_admin_role(user_id, revoked_by_id):
        """Revoke admin role from user"""
        try:
            user = User.query.get(int(user_id))
            revoked_by = User.query.get(int(revoked_by_id))
            
            if not user or not revoked_by:
                return False
            
            # Prevent self-revocation for super admins
            if user_id == revoked_by_id and user.admin_level == PermissionLevel.SUPER_ADMIN.value:
                return False
            
            old_level = user.admin_level
            user.admin_level = None
            user.admin_revoked_at = datetime.utcnow()
            user.admin_revoked_by = revoked_by_id
            
            db.session.commit()
            
            # Log the action
            admin_security = AdminSecurityManager()
            admin_security.log_admin_action(
                action='revoke_admin_role',
                target_type='user',
                target_id=user_id,
                details={
                    'old_level': old_level,
                    'revoked_from': user.email
                },
                severity='warning'
            )
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"Error revoking admin role: {str(e)}")
            return False
    
    @staticmethod
    def can_assign_level(assigner, target_level):
        """Check if assigner can assign target admin level"""
        if not assigner.is_admin:
            return False
        
        # Super admin can assign any level
        if assigner.admin_level == PermissionLevel.SUPER_ADMIN.value:
            return True
        
        # Admin can assign moderator and viewer levels
        if assigner.admin_level == PermissionLevel.ADMIN.value:
            return target_level in [PermissionLevel.MODERATOR.value, PermissionLevel.VIEWER.value]
        
        # Moderators and viewers cannot assign roles
        return False

def admin_required(permission_level=None):
    """
    Decorator to enforce admin access with optional permission level check.
    
    :param permission_level: Minimum required permission level
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask_login import current_user
            
            try:
                # Check Flask-Login session
                if not current_user.is_authenticated:
                    return jsonify({'error': 'Authentication required'}), 401
                
                # Get current user and claims
                user_id = current_user.id
                
                # Find user
                user = User.query.get(int(user_id))
                if not user or not user.is_admin_user():
                    # Log unauthorized access attempt
                    admin_security_manager.log_unauthorized_attempt(
                        f'Attempted access to {f.__name__} without admin rights'
                    )
                    return jsonify({
                        'success': False,
                        'message': 'Admin access required'
                    }), 403
                
                # Check permission level if specified
                if permission_level:
                    # Define permission hierarchy
                    permission_hierarchy = {
                        PermissionLevel.VIEWER.value: 1,
                        PermissionLevel.MODERATOR.value: 2,
                        PermissionLevel.ADMIN.value: 3,
                        PermissionLevel.SUPER_ADMIN.value: 4
                    }
                    
                    # Get current user's permission level
                    current_level = permission_hierarchy.get(user.admin_level, 0)
                    required_level = permission_hierarchy.get(permission_level, 0)
                    
                    if current_level < required_level:
                        # Log insufficient permission attempt
                        admin_security_manager.log_unauthorized_attempt(
                            f'Insufficient permissions for {f.__name__}. '
                            f'Required: {permission_level}, Current: {user.admin_level}'
                        )
                        return jsonify({
                            'success': False,
                            'message': 'Insufficient admin permissions',
                            'required_level': permission_level,
                            'current_level': user.admin_level
                        }), 403
                
                # Log admin action
                admin_security_manager.log_admin_action(
                    action=f'access_{f.__name__}',
                    target_type='admin_route',
                    details={
                        'route': f.__name__,
                        'admin_level': user.admin_level
                    }
                )
                
                return f(*args, **kwargs)
            
            except Exception as e:
                current_app.logger.error(f"Admin access error: {str(e)}")
                return jsonify({
                    'success': False,
                    'message': 'Admin access verification failed'
                }), 500
        
        return decorated_function
    return decorator

# Add method to validate admin session
def validate_admin_session(user_id):
    """
    Validate admin session with enhanced security checks.
    
    :param user_id: ID of the user to validate
    :return: Boolean indicating session validity
    """
    try:
        user = User.query.get(int(user_id))
        if not user or not user.is_admin_user():
            return False
        
        # Check session timeout
        last_activity = session.get('last_activity')
        if last_activity:
            last_activity_time = datetime.fromisoformat(last_activity)
            # Shorter timeout for admin sessions
            if datetime.utcnow() - last_activity_time > timedelta(minutes=30):
                return False
        
        # Additional security checks
        if user.admin_level == PermissionLevel.SUPER_ADMIN.value:
            # Extra strict checks for super admin
            if not user.two_factor_enabled:
                return False
        
        # Update last activity
        session['last_activity'] = datetime.utcnow().isoformat()
        
        return True
        
    except Exception as e:
        current_app.logger.error(f"Admin session validation error: {str(e)}")
        return False

# Global instance
admin_security_manager = AdminSecurityManager()
admin_permission_manager = AdminPermissionManager() 