#!/bin/bash

# DoggoDaily Backend Deployment Script
# This script sets up the production environment for DoggoDaily backend

set -e  # Exit on any error

# Configuration
APP_NAME="doggodaily"
APP_USER="www-data"
APP_GROUP="www-data"
APP_DIR="/var/www/doggodaily"
BACKEND_DIR="$APP_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"
LOG_DIR="/var/log/doggodaily"
RUN_DIR="/var/run/doggodaily"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Please run this script as root (use sudo)"
    fi
}

# Install system dependencies
install_system_deps() {
    log "Installing system dependencies..."
    
    apt update
    apt install -y \
        python3 \
        python3-pip \
        python3-venv \
        python3-dev \
        nginx \
        postgresql \
        postgresql-contrib \
        redis-server \
        build-essential \
        libssl-dev \
        libffi-dev \
        libjpeg-dev \
        libpng-dev \
        libpq-dev \
        curl \
        git \
        supervisor
        
    log "System dependencies installed"
}

# Create application user and directories
setup_directories() {
    log "Setting up directories and permissions..."
    
    # Create application directories
    mkdir -p $APP_DIR
    mkdir -p $BACKEND_DIR
    mkdir -p $LOG_DIR
    mkdir -p $RUN_DIR
    mkdir -p "$BACKEND_DIR/uploads"
    mkdir -p "$BACKEND_DIR/data"
    
    # Set ownership
    chown -R $APP_USER:$APP_GROUP $APP_DIR
    chown -R $APP_USER:$APP_GROUP $LOG_DIR
    chown -R $APP_USER:$APP_GROUP $RUN_DIR
    
    # Set permissions
    chmod 755 $APP_DIR
    chmod 750 $LOG_DIR
    chmod 750 $RUN_DIR
    chmod 755 "$BACKEND_DIR/uploads"
    
    log "Directories created and permissions set"
}

# Setup Python virtual environment
setup_python_env() {
    log "Setting up Python virtual environment..."
    
    cd $BACKEND_DIR
    
    # Create virtual environment
    sudo -u $APP_USER python3 -m venv $VENV_DIR
    
    # Activate virtual environment and install dependencies
    sudo -u $APP_USER $VENV_DIR/bin/pip install --upgrade pip
    sudo -u $APP_USER $VENV_DIR/bin/pip install -r requirements.txt
    sudo -u $APP_USER $VENV_DIR/bin/pip install -r requirements-prod.txt
    
    log "Python environment setup complete"
}

# Setup database
setup_database() {
    log "Setting up database..."
    
    # Create PostgreSQL database and user (optional)
    read -p "Do you want to setup PostgreSQL database? [y/N]: " setup_pg
    if [[ $setup_pg =~ ^[Yy]$ ]]; then
        sudo -u postgres createdb doggodaily_prod || warn "Database might already exist"
        sudo -u postgres createuser doggodaily || warn "User might already exist"
        
        echo "Please set a password for the database user:"
        sudo -u postgres psql -c "ALTER USER doggodaily PASSWORD 'your_secure_password';"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE doggodaily_prod TO doggodaily;"
        
        log "PostgreSQL database setup complete"
    fi
    
    # Initialize database
    cd $BACKEND_DIR
    sudo -u $APP_USER $VENV_DIR/bin/flask db upgrade || warn "Database migration might have failed"
    
    log "Database setup complete"
}

# Setup environment file
setup_environment() {
    log "Setting up environment configuration..."
    
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        warn "No .env file found. Please create one based on env.production.example"
        cp "$BACKEND_DIR/env.production.example" "$BACKEND_DIR/.env"
        chown $APP_USER:$APP_GROUP "$BACKEND_DIR/.env"
        chmod 600 "$BACKEND_DIR/.env"
        
        echo "Please edit $BACKEND_DIR/.env with your production settings"
        echo "Press Enter when done..."
        read
    fi
    
    log "Environment configuration ready"
}

# Setup systemd service
setup_systemd() {
    log "Setting up systemd service..."
    
    # Copy service file
    cp "$BACKEND_DIR/doggodaily.service" "/etc/systemd/system/"
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable doggodaily
    
    log "Systemd service configured"
}

# Setup Nginx
setup_nginx() {
    log "Setting up Nginx..."
    
    # Copy Nginx configuration
    cp "$BACKEND_DIR/nginx.doggodaily.conf" "/etc/nginx/sites-available/doggodaily"
    
    # Enable site
    ln -sf "/etc/nginx/sites-available/doggodaily" "/etc/nginx/sites-enabled/"
    
    # Remove default site
    rm -f "/etc/nginx/sites-enabled/default"
    
    # Test Nginx configuration
    nginx -t || error "Nginx configuration test failed"
    
    log "Nginx configured"
}

# Setup SSL (Let's Encrypt)
setup_ssl() {
    read -p "Do you want to setup SSL with Let's Encrypt? [y/N]: " setup_ssl
    if [[ $setup_ssl =~ ^[Yy]$ ]]; then
        log "Setting up SSL with Let's Encrypt..."
        
        # Install certbot
        apt install -y certbot python3-certbot-nginx
        
        # Get certificate
        read -p "Enter your domain name: " domain_name
        certbot --nginx -d $domain_name
        
        log "SSL setup complete"
    fi
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start and enable Redis
    systemctl start redis-server
    systemctl enable redis-server
    
    # Start DoggoDaily backend
    systemctl start doggodaily
    
    # Restart Nginx
    systemctl restart nginx
    
    log "Services started"
}

# Main deployment function
deploy() {
    log "Starting DoggoDaily backend deployment..."
    
    check_root
    install_system_deps
    setup_directories
    setup_python_env
    setup_database
    setup_environment
    setup_systemd
    setup_nginx
    setup_ssl
    start_services
    
    log "Deployment complete!"
    log "Your DoggoDaily backend is now running with Gunicorn"
    log "Check status with: systemctl status doggodaily"
    log "View logs with: journalctl -u doggodaily -f"
}

# Help function
show_help() {
    echo "DoggoDaily Backend Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy     Full deployment setup"
    echo "  start      Start the application"
    echo "  stop       Stop the application"
    echo "  restart    Restart the application"
    echo "  status     Show application status"
    echo "  logs       Show application logs"
    echo "  help       Show this help"
}

# Command handling
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    start)
        systemctl start doggodaily
        systemctl start nginx
        log "Services started"
        ;;
    stop)
        systemctl stop doggodaily
        log "Application stopped"
        ;;
    restart)
        systemctl restart doggodaily
        systemctl reload nginx
        log "Application restarted"
        ;;
    status)
        systemctl status doggodaily
        ;;
    logs)
        journalctl -u doggodaily -f
        ;;
    help)
        show_help
        ;;
    *)
        error "Unknown command: $1. Use 'help' for available commands."
        ;;
esac
