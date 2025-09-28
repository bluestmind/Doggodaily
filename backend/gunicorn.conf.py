#!/usr/bin/env python3
"""
Gunicorn configuration file for DoggoDaily backend
Optimized for production deployment
"""

import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1  # CPU cores * 2 + 1
worker_class = "gevent"  # Async worker for better performance
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
preload_app = True
timeout = 30
keepalive = 2

# Restart workers after this many requests to prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Restart workers after this many seconds
timeout = 30
graceful_timeout = 30
keepalive = 2

# Logging
accesslog = "/var/log/doggodaily/gunicorn_access.log"
errorlog = "/var/log/doggodaily/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'doggodaily_backend'

# Server mechanics
daemon = False  # Set to True if running as a daemon
pidfile = "/var/run/doggodaily/gunicorn.pid"
user = None  # Set to your app user if needed
group = None  # Set to your app group if needed
tmp_upload_dir = None

# SSL (if running HTTPS directly through Gunicorn)
# keyfile = "/path/to/ssl/private.key"
# certfile = "/path/to/ssl/certificate.crt"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Environment variables
raw_env = [
    'FLASK_ENV=production',
    'FLASK_CONFIG=production',
]

# Worker process management
def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info("Starting DoggoDaily backend server")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    server.log.info("Reloading DoggoDaily backend server")

def when_ready(server):
    """Called just after the server is started."""
    server.log.info("DoggoDaily backend server is ready. Listening on: %s", server.address)

def worker_int(worker):
    """Called just after a worker exited on SIGINT or SIGQUIT."""
    worker.log.info("Worker received INT or QUIT signal")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    worker.log.info("Worker spawned (pid: %s)", worker.pid)

def post_worker_init(worker):
    """Called just after a worker has initialized the application."""
    worker.log.info("Worker initialized (pid: %s)", worker.pid)

def worker_abort(worker):
    """Called when a worker received the SIGABRT signal."""
    worker.log.info("Worker received SIGABRT signal")
