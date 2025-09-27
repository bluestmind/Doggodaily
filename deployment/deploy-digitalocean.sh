#!/bin/bash
# Deploy NavidDoggy to DigitalOcean Ubuntu Server
# Run this after uploading your project files

set -e

# Configuration
APP_USER="naviddog"
APP_DIR="/var/www/naviddog"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_DIR="/var/log/naviddog"
DOMAIN="46.101.244.203"  # Change this to your domain

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root: sudo ./deploy-digitalocean.sh"
    exit 1
fi

print_status "🚀 Deploying NavidDoggy to DigitalOcean..."

# Verify directories exist
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory $APP_DIR not found!"
    print_error "Please upload your project files first."
    exit 1
fi

# Set correct ownership
print_status "Setting file permissions..."
chown -R $APP_USER:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Setup Python virtual environment
print_status "Setting up Python virtual environment..."
cd $BACKEND_DIR
sudo -u $APP_USER python3 -m venv venv
sudo -u $APP_USER $BACKEND_DIR/venv/bin/pip install --upgrade pip

# Install Python dependencies
print_status "Installing Python dependencies..."
sudo -u $APP_USER $BACKEND_DIR/venv/bin/pip install -r requirements.txt
sudo -u $APP_USER $BACKEND_DIR/venv/bin/pip install gunicorn

# Setup database
print_status "Setting up database..."
sudo -u $APP_USER mkdir -p $BACKEND_DIR/data
cd $BACKEND_DIR

# Create .env file if it doesn't exist
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_status "Creating .env file..."
    sudo -u $APP_USER cp env.production.template .env
    print_warning "⚠️  Please edit $BACKEND_DIR/.env with your production values!"
fi

# Run database migrations
print_status "Running database migrations..."
sudo -u $APP_USER $BACKEND_DIR/venv/bin/python manage.py db upgrade || true

# Build React frontend
print_status "Building React frontend..."
cd $FRONTEND_DIR
npm install
npm run build

# Copy built files to nginx directory
print_status "Setting up frontend files..."
rm -rf /var/www/html/*
cp -r $FRONTEND_DIR/dist/* /var/www/html/
chown -R www-data:www-data /var/www/html

# Setup Nginx configuration
print_status "Configuring Nginx..."
cp $APP_DIR/deployment/nginx.conf /etc/nginx/sites-available/naviddog

# Update domain in nginx config
sed -i "s/46\.101\.244\.203/$DOMAIN/g" /etc/nginx/sites-available/naviddog

# Enable site
ln -sf /etc/nginx/sites-available/naviddog /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Setup systemd service
print_status "Setting up systemd service..."
cp $APP_DIR/deployment/naviddog.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable naviddog

# Start services
print_status "Starting services..."
systemctl restart naviddog
systemctl restart nginx

# Check service status
print_status "Checking service status..."
sleep 3

if systemctl is-active --quiet naviddog; then
    print_success "✅ NavidDoggy service is running"
else
    print_error "❌ NavidDoggy service failed to start"
    systemctl status naviddog --no-pager
fi

if systemctl is-active --quiet nginx; then
    print_success "✅ Nginx is running"
else
    print_error "❌ Nginx failed to start"
    systemctl status nginx --no-pager
fi

print_success "🎉 Deployment completed!"
print_status "🌐 Your site is available at: http://$DOMAIN"
print_status "📊 API endpoint: http://$DOMAIN/api/"
print_status "📁 Logs: $LOG_DIR"

print_warning "🔒 Security recommendations:"
print_warning "   1. Set up SSL certificate: sudo certbot --nginx -d $DOMAIN"
print_warning "   2. Review and update .env file with secure values"
print_warning "   3. Set up regular backups"
print_warning "   4. Configure monitoring"

print_status "📋 Useful commands:"
print_status "   - Check app logs: sudo journalctl -u naviddog -f"
print_status "   - Restart app: sudo systemctl restart naviddog"
print_status "   - Check nginx logs: sudo tail -f /var/log/nginx/error.log"
print_status "   - Update app: git pull && sudo systemctl restart naviddog"