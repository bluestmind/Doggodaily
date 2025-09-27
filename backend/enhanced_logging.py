#!/usr/bin/env python3
"""
ENHANCED LOGGING CONFIGURATION FOR NAVID DOGGY (WINDOWS COMPATIBLE)

This module sets up comprehensive logging for the Flask application
"""

import logging
import sys
from datetime import datetime
import os

class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for better visibility (Windows compatible)"""
    
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record):
        log_color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{log_color}{record.levelname}{self.RESET}"
        return super().format(record)

def setup_enhanced_logging(app):
    """Setup enhanced logging for the Flask app (Windows compatible)"""
    
    # Create logs directory
    logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
    os.makedirs(logs_dir, exist_ok=True)
    
    # Clear existing handlers
    for handler in app.logger.handlers[:]:
        app.logger.removeHandler(handler)
    
    # Set logging level
    app.logger.setLevel(logging.DEBUG)
    
    # Create formatters (Windows compatible - no emojis)
    detailed_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    colored_formatter = ColoredFormatter(
        '%(asctime)s | %(levelname)s | %(funcName)s:%(lineno)d | %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(colored_formatter)
    app.logger.addHandler(console_handler)
    
    # File handler for all logs
    all_logs_file = os.path.join(logs_dir, f'admin_panel_{datetime.now().strftime("%Y%m%d")}.log')
    file_handler = logging.FileHandler(all_logs_file, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(detailed_formatter)
    app.logger.addHandler(file_handler)
    
    # Error logs file
    error_logs_file = os.path.join(logs_dir, f'errors_{datetime.now().strftime("%Y%m%d")}.log')
    error_handler = logging.FileHandler(error_logs_file, encoding='utf-8')
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    app.logger.addHandler(error_handler)
    
    # Admin actions log
    admin_logs_file = os.path.join(logs_dir, f'admin_actions_{datetime.now().strftime("%Y%m%d")}.log')
    admin_handler = logging.FileHandler(admin_logs_file, encoding='utf-8')
    admin_handler.setLevel(logging.INFO)
    admin_handler.setFormatter(detailed_formatter)
    
    # Create admin logger
    admin_logger = logging.getLogger('admin_actions')
    admin_logger.setLevel(logging.INFO)
    admin_logger.addHandler(admin_handler)
    
    # Log startup information (Windows compatible - no emojis)
    app.logger.info("STARTUP: Enhanced logging system initialized")
    app.logger.info(f"LOGS_DIR: {logs_dir}")
    app.logger.info(f"ALL_LOGS: {all_logs_file}")
    app.logger.info(f"ERROR_LOGS: {error_logs_file}")
    app.logger.info(f"ADMIN_LOGS: {admin_logs_file}")
    
    return app.logger

def log_admin_action(user_email, action, details):
    """Log admin actions to separate file"""
    admin_logger = logging.getLogger('admin_actions')
    admin_logger.info(f"ADMIN_ACTION | User: {user_email} | Action: {action} | Details: {details}")

# Performance monitoring decorator
def monitor_performance(func_name):
    """Decorator to monitor function performance"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            start_time = datetime.now()
            try:
                result = f(*args, **kwargs)
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                # Log performance
                from flask import current_app
                current_app.logger.info(f"PERFORMANCE | {func_name} | Duration: {duration:.3f}s")
                
                return result
            except Exception as e:
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                from flask import current_app
                current_app.logger.error(f"PERFORMANCE_ERROR | {func_name} | Duration: {duration:.3f}s | Error: {str(e)}")
                raise
        
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator 