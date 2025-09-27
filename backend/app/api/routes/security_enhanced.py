"""
Enhanced Security API Routes with comprehensive security monitoring and maintenance mode
"""
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import logging
from sqlalchemy import func, text

from ...admin_security import admin_required
from ...models_security import (
    SecurityLog, ThreatDetection, IPBlacklist, RateLimitLog,
    MaintenanceMode, SecurityConfiguration, FailedLoginAttempt,
    AuditLog, SecurityUtils
)
from ...models import User, db
from ...extensions import db as ext_db

security_enhanced_bp = Blueprint('security_enhanced', __name__)
logger = logging.getLogger(__name__)

# Security Dashboard
@security_enhanced_bp.route('/dashboard', methods=['GET'])
@login_required
@admin_required()
def get_security_dashboard():
    """Get comprehensive security dashboard data"""
    try:
        days = int(request.args.get('days', 30))
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Security metrics
        total_threats = ThreatDetection.query.filter(
            ThreatDetection.first_seen >= cutoff_date
        ).count()
        
        active_threats = ThreatDetection.query.filter(
            ThreatDetection.is_active == True,
            ThreatDetection.is_mitigated == False
        ).count()
        
        blocked_ips = IPBlacklist.query.filter(
            IPBlacklist.is_active == True
        ).count()
        
        failed_logins = FailedLoginAttempt.query.filter(
            FailedLoginAttempt.created_at >= cutoff_date
        ).count()
        
        security_logs_count = SecurityLog.query.filter(
            SecurityLog.created_at >= cutoff_date
        ).count()
        
        # High-risk events in last 24 hours
        high_risk_events = SecurityLog.query.filter(
            SecurityLog.created_at >= datetime.utcnow() - timedelta(hours=24),
            SecurityLog.risk_score >= 50
        ).count()
        
        # Recent security events
        recent_events = SecurityLog.query.filter(
            SecurityLog.created_at >= cutoff_date
        ).order_by(SecurityLog.created_at.desc()).limit(50).all()
        
        # Threat breakdown by type
        threat_breakdown = db.session.query(
            ThreatDetection.threat_type,
            func.count(ThreatDetection.id).label('count'),
            func.max(ThreatDetection.threat_level).label('max_level')
        ).filter(
            ThreatDetection.first_seen >= cutoff_date
        ).group_by(ThreatDetection.threat_type).all()
        
        # Geographic threat analysis
        geographic_threats = db.session.query(
            func.json_extract(SecurityLog.event_metadata, '$.country').label('country'),
            func.count(SecurityLog.id).label('threat_count')
        ).filter(
            SecurityLog.created_at >= cutoff_date,
            SecurityLog.risk_score >= 25,
            func.json_extract(SecurityLog.event_metadata, '$.country').isnot(None)
        ).group_by(func.json_extract(SecurityLog.event_metadata, '$.country')).order_by(
            func.count(SecurityLog.id).desc()
        ).limit(10).all()
        
        # System status
        maintenance_info = SecurityUtils.get_maintenance_info()
        
        return jsonify({
            'success': True,
            'data': {
                'overview': {
                    'total_threats': total_threats,
                    'active_threats': active_threats,
                    'blocked_ips': blocked_ips,
                    'failed_logins': failed_logins,
                    'security_logs_count': security_logs_count,
                    'high_risk_events_24h': high_risk_events
                },
                'recent_events': [event.to_dict() for event in recent_events],
                'threat_breakdown': [{
                    'type': t[0],
                    'count': t[1],
                    'max_level': t[2]
                } for t in threat_breakdown],
                'geographic_threats': [{
                    'country': g[0],
                    'threat_count': g[1]
                } for g in geographic_threats if g[0]],
                'maintenance_mode': maintenance_info
            }
        })
        
    except Exception as e:
        logger.error(f"Security dashboard error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load security dashboard'
        }), 500

# Security Logs
@security_enhanced_bp.route('/logs', methods=['GET'])
@login_required
@admin_required()
def get_security_logs():
    """Get security logs with filtering and pagination"""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)
        severity = request.args.get('severity')
        event_type = request.args.get('event_type')
        days = int(request.args.get('days', 7))
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = SecurityLog.query.filter(SecurityLog.created_at >= cutoff_date)
        
        if severity:
            query = query.filter(SecurityLog.severity == severity)
        if event_type:
            query = query.filter(SecurityLog.event_type == event_type)
        
        logs = query.order_by(SecurityLog.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': [log.to_dict() for log in logs.items],
            'meta': {
                'page': page,
                'pages': logs.pages,
                'per_page': per_page,
                'total': logs.total
            }
        })
        
    except Exception as e:
        logger.error(f"Security logs error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load security logs'
        }), 500

# Threat Detection Management
@security_enhanced_bp.route('/threats', methods=['GET'])
@login_required
@admin_required()
def get_threats():
    """Get threat detection data"""
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        threat_level = request.args.get('threat_level')
        
        query = ThreatDetection.query
        
        if active_only:
            query = query.filter(ThreatDetection.is_active == True)
        if threat_level:
            query = query.filter(ThreatDetection.threat_level == threat_level)
        
        threats = query.order_by(ThreatDetection.last_seen.desc()).all()
        
        threat_data = []
        for threat in threats:
            threat_data.append({
                'id': threat.id,
                'threat_type': threat.threat_type,
                'threat_level': threat.threat_level,
                'source_ip': threat.source_ip,
                'target_endpoint': threat.target_endpoint,
                'frequency': threat.frequency,
                'is_active': threat.is_active,
                'is_mitigated': threat.is_mitigated,
                'mitigation_action': threat.mitigation_action,
                'first_seen': threat.first_seen.isoformat(),
                'last_seen': threat.last_seen.isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': threat_data
        })
        
    except Exception as e:
        logger.error(f"Threats error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load threats'
        }), 500

@security_enhanced_bp.route('/threats/<int:threat_id>/mitigate', methods=['POST'])
@login_required
@admin_required()
def mitigate_threat(threat_id):
    """Mitigate a specific threat"""
    try:
        data = request.get_json()
        action = data.get('action', 'manual_review')
        
        threat = ThreatDetection.query.get_or_404(threat_id)
        
        threat.is_mitigated = True
        threat.mitigation_action = action
        
        # If action is to block IP, add to blacklist
        if action == 'block_ip':
            IPBlacklist.add_to_blacklist(
                ip_address=threat.source_ip,
                reason=f'Blocked due to {threat.threat_type} threat',
                added_by=current_user.id,
                threat_level=threat.threat_level
            )
        
        db.session.commit()
        
        # Log the mitigation action
        SecurityLog.log_event(
            event_type='threat_mitigated',
            description=f'Threat {threat_id} mitigated with action: {action}',
            user_id=current_user.id,
            severity='info',
            metadata={'threat_id': threat_id, 'action': action}
        )
        
        return jsonify({
            'success': True,
            'message': 'Threat mitigated successfully'
        })
        
    except Exception as e:
        logger.error(f"Threat mitigation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to mitigate threat'
        }), 500

# IP Blacklist Management
@security_enhanced_bp.route('/blacklist', methods=['GET'])
@login_required
@admin_required()
def get_blacklist():
    """Get IP blacklist"""
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        query = IPBlacklist.query
        if active_only:
            query = query.filter(IPBlacklist.is_active == True)
        
        blacklist = query.order_by(IPBlacklist.created_at.desc()).all()
        
        blacklist_data = []
        for entry in blacklist:
            blacklist_data.append({
                'id': entry.id,
                'ip_address': entry.ip_address,
                'reason': entry.reason,
                'threat_level': entry.threat_level,
                'auto_added': entry.auto_added,
                'expires_at': entry.expires_at.isoformat() if entry.expires_at else None,
                'is_active': entry.is_active,
                'hit_count': entry.hit_count,
                'last_hit': entry.last_hit.isoformat() if entry.last_hit else None,
                'created_at': entry.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': blacklist_data
        })
        
    except Exception as e:
        logger.error(f"Blacklist error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load blacklist'
        }), 500

@security_enhanced_bp.route('/blacklist', methods=['POST'])
@login_required
@admin_required()
def add_to_blacklist():
    """Add IP to blacklist"""
    try:
        data = request.get_json()
        
        if not data.get('ip_address'):
            return jsonify({
                'success': False,
                'message': 'IP address is required'
            }), 400
        
        IPBlacklist.add_to_blacklist(
            ip_address=data['ip_address'],
            reason=data.get('reason', 'Manually added by admin'),
            added_by=current_user.id,
            expires_hours=data.get('expires_hours'),
            threat_level=data.get('threat_level', 'medium')
        )
        
        # Log the blacklist action
        SecurityLog.log_event(
            event_type='ip_blacklisted',
            description=f'IP {data["ip_address"]} added to blacklist',
            user_id=current_user.id,
            severity='medium',
            metadata={'ip_address': data['ip_address'], 'reason': data.get('reason')}
        )
        
        return jsonify({
            'success': True,
            'message': 'IP added to blacklist successfully'
        })
        
    except Exception as e:
        logger.error(f"Add to blacklist error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to add IP to blacklist'
        }), 500

@security_enhanced_bp.route('/blacklist/<int:blacklist_id>', methods=['DELETE'])
@login_required
@admin_required()
def remove_from_blacklist(blacklist_id):
    """Remove IP from blacklist"""
    try:
        entry = IPBlacklist.query.get_or_404(blacklist_id)
        
        entry.is_active = False
        db.session.commit()
        
        # Log the removal
        SecurityLog.log_event(
            event_type='ip_unblacklisted',
            description=f'IP {entry.ip_address} removed from blacklist',
            user_id=current_user.id,
            severity='info',
            metadata={'ip_address': entry.ip_address}
        )
        
        return jsonify({
            'success': True,
            'message': 'IP removed from blacklist successfully'
        })
        
    except Exception as e:
        logger.error(f"Remove from blacklist error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to remove IP from blacklist'
        }), 500

# Maintenance Mode Management
@security_enhanced_bp.route('/maintenance', methods=['GET'])
@login_required
@admin_required()
def get_maintenance_status():
    """Get maintenance mode status"""
    try:
        maintenance_info = SecurityUtils.get_maintenance_info()
        
        # Get maintenance history
        history = MaintenanceMode.query.order_by(
            MaintenanceMode.updated_at.desc()
        ).limit(10).all()
        
        history_data = []
        for entry in history:
            history_data.append({
                'id': entry.id,
                'is_enabled': entry.is_enabled,
                'maintenance_type': entry.maintenance_type,
                'title': entry.title,
                'message': entry.message,
                'enabled_at': entry.enabled_at.isoformat() if entry.enabled_at else None,
                'disabled_at': entry.disabled_at.isoformat() if entry.disabled_at else None,
                'estimated_duration': entry.estimated_duration
            })
        
        return jsonify({
            'success': True,
            'data': {
                'current_status': maintenance_info,
                'history': history_data
            }
        })
        
    except Exception as e:
        logger.error(f"Maintenance status error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get maintenance status'
        }), 500

@security_enhanced_bp.route('/maintenance/enable', methods=['POST'])
@login_required
@admin_required()
def enable_maintenance():
    """Enable maintenance mode"""
    try:
        data = request.get_json()
        
        maintenance = MaintenanceMode.enable_maintenance(
            title=data.get('title'),
            message=data.get('message'),
            maintenance_type=data.get('maintenance_type', 'general'),
            enabled_by=current_user.id,
            estimated_duration=data.get('estimated_duration'),
            allowed_ips=data.get('allowed_ips')
        )
        
        return jsonify({
            'success': True,
            'message': 'Maintenance mode enabled successfully',
            'data': {
                'id': maintenance.id,
                'title': maintenance.title,
                'message': maintenance.message,
                'maintenance_type': maintenance.maintenance_type,
                'estimated_duration': maintenance.estimated_duration
            }
        })
        
    except Exception as e:
        logger.error(f"Enable maintenance error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to enable maintenance mode'
        }), 500

@security_enhanced_bp.route('/maintenance/disable', methods=['POST'])
@login_required
@admin_required()
def disable_maintenance():
    """Disable maintenance mode"""
    try:
        maintenance = MaintenanceMode.disable_maintenance(disabled_by=current_user.id)
        
        return jsonify({
            'success': True,
            'message': 'Maintenance mode disabled successfully'
        })
        
    except Exception as e:
        logger.error(f"Disable maintenance error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to disable maintenance mode'
        }), 500

@security_enhanced_bp.route('/maintenance/progress', methods=['POST'])
@login_required
@admin_required()
def update_maintenance_progress():
    """Update maintenance progress"""
    try:
        data = request.get_json()
        
        if 'percentage' not in data:
            return jsonify({
                'success': False,
                'message': 'Progress percentage is required'
            }), 400
        
        maintenance = MaintenanceMode.get_current()
        if not maintenance or not maintenance.is_enabled:
            return jsonify({
                'success': False,
                'message': 'Maintenance mode is not currently enabled'
            }), 400
        
        maintenance.update_progress(
            percentage=data['percentage'],
            message=data.get('message')
        )
        
        return jsonify({
            'success': True,
            'message': 'Maintenance progress updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Update maintenance progress error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update maintenance progress'
        }), 500

# Security Configuration
@security_enhanced_bp.route('/configuration', methods=['GET'])
@login_required
@admin_required()
def get_security_configuration():
    """Get security configuration"""
    try:
        config = SecurityConfiguration.get_current()
        
        config_data = {
            'id': config.id,
            'enable_2fa': config.enable_2fa,
            'require_2fa_for_admin': config.require_2fa_for_admin,
            'password_min_length': config.password_min_length,
            'password_require_uppercase': config.password_require_uppercase,
            'password_require_lowercase': config.password_require_lowercase,
            'password_require_numbers': config.password_require_numbers,
            'password_require_symbols': config.password_require_symbols,
            'password_expiry_days': config.password_expiry_days,
            'password_history_count': config.password_history_count,
            'session_timeout_minutes': config.session_timeout_minutes,
            'max_concurrent_sessions': config.max_concurrent_sessions,
            'enable_rate_limiting': config.enable_rate_limiting,
            'login_attempts_per_minute': config.login_attempts_per_minute,
            'api_requests_per_minute': config.api_requests_per_minute,
            'api_requests_per_hour': config.api_requests_per_hour,
            'enable_account_lockout': config.enable_account_lockout,
            'lockout_attempts': config.lockout_attempts,
            'lockout_duration_minutes': config.lockout_duration_minutes,
            'enable_auto_ip_blocking': config.enable_auto_ip_blocking,
            'suspicious_ip_threshold': config.suspicious_ip_threshold,
            'auto_block_duration_hours': config.auto_block_duration_hours,
            'enable_security_alerts': config.enable_security_alerts,
            'alert_email': config.alert_email,
            'enable_csrf_protection': config.enable_csrf_protection,
            'enable_sql_injection_detection': config.enable_sql_injection_detection,
            'enable_xss_protection': config.enable_xss_protection,
            'enable_audit_logs': config.enable_audit_logs,
            'log_retention_days': config.log_retention_days,
            'updated_at': config.updated_at.isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': config_data
        })
        
    except Exception as e:
        logger.error(f"Security configuration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load security configuration'
        }), 500

@security_enhanced_bp.route('/configuration', methods=['PUT'])
@login_required
@admin_required()
def update_security_configuration():
    """Update security configuration"""
    try:
        data = request.get_json()
        config = SecurityConfiguration.get_current()
        
        # Update configuration fields
        updateable_fields = [
            'enable_2fa', 'require_2fa_for_admin', 'password_min_length',
            'password_require_uppercase', 'password_require_lowercase',
            'password_require_numbers', 'password_require_symbols',
            'password_expiry_days', 'password_history_count',
            'session_timeout_minutes', 'max_concurrent_sessions',
            'enable_rate_limiting', 'login_attempts_per_minute',
            'api_requests_per_minute', 'api_requests_per_hour',
            'enable_account_lockout', 'lockout_attempts',
            'lockout_duration_minutes', 'enable_auto_ip_blocking',
            'suspicious_ip_threshold', 'auto_block_duration_hours',
            'enable_security_alerts', 'alert_email',
            'enable_csrf_protection', 'enable_sql_injection_detection',
            'enable_xss_protection', 'enable_audit_logs',
            'log_retention_days'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(config, field, data[field])
        
        config.updated_by = current_user.id
        config.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log the configuration change
        SecurityLog.log_event(
            event_type='security_config_updated',
            description='Security configuration updated',
            user_id=current_user.id,
            severity='medium',
            metadata={'updated_fields': list(data.keys())}
        )
        
        return jsonify({
            'success': True,
            'message': 'Security configuration updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Update security configuration error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update security configuration'
        }), 500

# Audit Logs
@security_enhanced_bp.route('/audit-logs', methods=['GET'])
@login_required
@admin_required()
def get_audit_logs():
    """Get audit logs with filtering"""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)
        action = request.args.get('action')
        resource_type = request.args.get('resource_type')
        user_id = request.args.get('user_id')
        days = int(request.args.get('days', 7))
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = AuditLog.query.filter(AuditLog.created_at >= cutoff_date)
        
        if action:
            query = query.filter(AuditLog.action == action)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        logs = query.order_by(AuditLog.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        audit_data = []
        for log in logs.items:
            audit_data.append({
                'id': log.id,
                'user_id': log.user_id,
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'old_values': log.old_values,
                'new_values': log.new_values,
                'ip_address': log.ip_address,
                'endpoint': log.endpoint,
                'method': log.method,
                'details': log.details,
                'created_at': log.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': audit_data,
            'meta': {
                'page': page,
                'pages': logs.pages,
                'per_page': per_page,
                'total': logs.total
            }
        })
        
    except Exception as e:
        logger.error(f"Audit logs error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load audit logs'
        }), 500

# Security Report Generation
@security_enhanced_bp.route('/generate-report', methods=['POST'])
@login_required
@admin_required()
def generate_security_report():
    """Generate comprehensive security report"""
    try:
        data = request.get_json()
        days = data.get('days', 30)
        include_sections = data.get('sections', ['overview', 'threats', 'logs', 'audit'])
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        report = {
            'generated_at': datetime.utcnow().isoformat(),
            'generated_by': current_user.id,
            'period_days': days,
            'period_start': cutoff_date.isoformat(),
            'period_end': datetime.utcnow().isoformat()
        }
        
        if 'overview' in include_sections:
            # Security overview
            report['overview'] = {
                'total_threats': ThreatDetection.query.filter(
                    ThreatDetection.first_seen >= cutoff_date
                ).count(),
                'active_threats': ThreatDetection.query.filter(
                    ThreatDetection.is_active == True
                ).count(),
                'blocked_ips': IPBlacklist.query.filter(
                    IPBlacklist.is_active == True
                ).count(),
                'failed_logins': FailedLoginAttempt.query.filter(
                    FailedLoginAttempt.created_at >= cutoff_date
                ).count(),
                'security_incidents': SecurityLog.query.filter(
                    SecurityLog.created_at >= cutoff_date,
                    SecurityLog.risk_score >= 50
                ).count()
            }
        
        if 'threats' in include_sections:
            # Threat analysis
            threats = ThreatDetection.query.filter(
                ThreatDetection.first_seen >= cutoff_date
            ).all()
            
            report['threats'] = [{
                'threat_type': t.threat_type,
                'threat_level': t.threat_level,
                'source_ip': t.source_ip,
                'frequency': t.frequency,
                'is_mitigated': t.is_mitigated,
                'first_seen': t.first_seen.isoformat(),
                'last_seen': t.last_seen.isoformat()
            } for t in threats]
        
        if 'logs' in include_sections:
            # Security logs summary
            log_summary = db.session.query(
                SecurityLog.severity,
                SecurityLog.event_type,
                func.count(SecurityLog.id).label('count')
            ).filter(
                SecurityLog.created_at >= cutoff_date
            ).group_by(
                SecurityLog.severity,
                SecurityLog.event_type
            ).all()
            
            report['log_summary'] = [{
                'severity': ls[0],
                'event_type': ls[1],
                'count': ls[2]
            } for ls in log_summary]
        
        if 'audit' in include_sections:
            # Audit summary
            audit_summary = db.session.query(
                AuditLog.action,
                AuditLog.resource_type,
                func.count(AuditLog.id).label('count')
            ).filter(
                AuditLog.created_at >= cutoff_date
            ).group_by(
                AuditLog.action,
                AuditLog.resource_type
            ).all()
            
            report['audit_summary'] = [{
                'action': a[0],
                'resource_type': a[1],
                'count': a[2]
            } for a in audit_summary]
        
        return jsonify({
            'success': True,
            'data': report
        })
        
    except Exception as e:
        logger.error(f"Generate security report error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to generate security report'
        }), 500