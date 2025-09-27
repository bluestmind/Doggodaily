from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime
import logging
import os
import platform

# Try to import psutil, but make it optional
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

from ...models import User, db
from ...auth.utils import TokenManager

system_bp = Blueprint('system', __name__)
logger = logging.getLogger(__name__)

# Get system information
@system_bp.route('/info', methods=['GET'])
@login_required
def get_system_info():
    """Get system information (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get system information
        system_info = {
            'platform': platform.system(),
            'platform_version': platform.version(),
            'python_version': platform.python_version(),
            'architecture': platform.architecture()[0],
            'processor': platform.processor(),
            'hostname': platform.node()
        }
        
        # Get memory information
        if PSUTIL_AVAILABLE:
            memory = psutil.virtual_memory()
            memory_info = {
                'total': memory.total,
                'available': memory.available,
                'used': memory.used,
                'percent': memory.percent
            }
            
            # Get disk information
            disk = psutil.disk_usage('/')
            disk_info = {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent
            }
            
            # Get CPU information
            cpu_info = {
                'count': psutil.cpu_count(),
                'percent': psutil.cpu_percent(interval=1),
                'frequency': psutil.cpu_freq().current if psutil.cpu_freq() else None
            }
        else:
            memory_info = {
                'total': None,
                'available': None,
                'used': None,
                'percent': None,
                'note': 'psutil not available'
            }
            disk_info = {
                'total': None,
                'used': None,
                'free': None,
                'percent': None,
                'note': 'psutil not available'
            }
            cpu_info = {
                'count': None,
                'percent': None,
                'frequency': None,
                'note': 'psutil not available'
            }
        
        return jsonify({
            'success': True,
            'system_info': system_info,
            'memory_info': memory_info,
            'disk_info': disk_info,
            'cpu_info': cpu_info
        }), 200
        
    except Exception as e:
        logger.error(f"Get system info error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get system information'
        }), 500

# Get application configuration
@system_bp.route('/config', methods=['GET'])
@login_required
def get_app_config():
    """Get application configuration (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get safe configuration values
        config = {
            'DEBUG': current_app.config.get('DEBUG', False),
            'TESTING': current_app.config.get('TESTING', False),
            'SECRET_KEY': '***HIDDEN***' if current_app.config.get('SECRET_KEY') else None,
            'DATABASE_URI': '***HIDDEN***' if current_app.config.get('DATABASE_URI') else None,
            # JWT removed - using Flask-Login sessions only
            'MAIL_SERVER': current_app.config.get('MAIL_SERVER'),
            'MAIL_PORT': current_app.config.get('MAIL_PORT'),
            'MAIL_USE_TLS': current_app.config.get('MAIL_USE_TLS'),
            'MAIL_USE_SSL': current_app.config.get('MAIL_USE_SSL'),
            'MAIL_USERNAME': current_app.config.get('MAIL_USERNAME'),
            'MAIL_PASSWORD': '***HIDDEN***' if current_app.config.get('MAIL_PASSWORD') else None,
            'MAX_LOGIN_ATTEMPTS': current_app.config.get('MAX_LOGIN_ATTEMPTS'),
            'ACCOUNT_LOCKOUT_DURATION': current_app.config.get('ACCOUNT_LOCKOUT_DURATION'),
            # JWT token settings removed - using Flask-Login sessions only
        }
        
        return jsonify({
            'success': True,
            'config': config
        }), 200
        
    except Exception as e:
        logger.error(f"Get app config error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get application configuration'
        }), 500

# Get database information
@system_bp.route('/database', methods=['GET'])
@login_required
def get_database_info():
    """Get database information (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Test database connection
        try:
            db.session.execute('SELECT 1')
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'
        
        # Get database file size if using SQLite
        db_file_size = None
        db_file_path = current_app.config.get('DATABASE_URI', '')
        if db_file_path.startswith('sqlite:///'):
            file_path = db_file_path.replace('sqlite:///', '')
            if os.path.exists(file_path):
                db_file_size = os.path.getsize(file_path)
        
        # Get table information
        tables = []
        try:
            result = db.session.execute("SELECT name FROM sqlite_master WHERE type='table'")
            for row in result:
                tables.append(row[0])
        except Exception as e:
            tables = [f'Error getting tables: {str(e)}']
        
        return jsonify({
            'success': True,
            'database': {
                'status': db_status,
                'file_size': db_file_size,
                'tables': tables
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get database info error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get database information'
        }), 500

# Get logs information
@system_bp.route('/logs', methods=['GET'])
@login_required
def get_logs_info():
    """Get logs information (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get logs directory information
        logs_dir = os.path.join(current_app.root_path, '..', 'logs')
        logs_info = {
            'logs_directory': logs_dir,
            'exists': os.path.exists(logs_dir),
            'files': []
        }
        
        if os.path.exists(logs_dir):
            try:
                files = os.listdir(logs_dir)
                for file in files:
                    if file.endswith('.log'):
                        file_path = os.path.join(logs_dir, file)
                        file_size = os.path.getsize(file_path)
                        file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                        
                        logs_info['files'].append({
                            'name': file,
                            'size': file_size,
                            'modified': file_mtime.isoformat()
                        })
            except Exception as e:
                logs_info['error'] = str(e)
        
        return jsonify({
            'success': True,
            'logs': logs_info
        }), 200
        
    except Exception as e:
        logger.error(f"Get logs info error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get logs information'
        }), 500

# Get system health check
@system_bp.route('/health', methods=['GET'])
def get_system_health():
    """Get system health check (public endpoint)"""
    try:
        # Check database connection
        try:
            db.session.execute('SELECT 1')
            db_healthy = True
        except Exception as e:
            db_healthy = False
            logger.error(f"Database health check failed: {str(e)}")
        
        # Check memory usage
        if PSUTIL_AVAILABLE:
            memory = psutil.virtual_memory()
            memory_healthy = memory.percent < 90
            
            # Check disk usage
            disk = psutil.disk_usage('/')
            disk_healthy = disk.percent < 90
        else:
            memory_healthy = True  # Assume healthy if psutil not available
            disk_healthy = True    # Assume healthy if psutil not available
        
        # Overall health
        overall_healthy = db_healthy and memory_healthy and disk_healthy
        
        return jsonify({
            'success': True,
            'healthy': overall_healthy,
            'checks': {
                'database': db_healthy,
                'memory': memory_healthy,
                'disk': disk_healthy
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200 if overall_healthy else 503
        
    except Exception as e:
        logger.error(f"System health check error: {str(e)}")
        return jsonify({
            'success': False,
            'healthy': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503 