#!/bin/bash
# Deployment script for NavidDoggy on Ubuntu/Debian server

set -e  # Exit on any error

echo "🚀 Starting NavidDoggy deployment..."

# Configuration
APP_DIR="/var/www/naviddog"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_DIR="/var/log/naviddog"
UPLOADS_DIR="/var/www/naviddog/uploads"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

print_status "Installing system dependencies..."
apt update
apt install -y python3 python3-pip python3-venv nginx supervisor git curl nodejs npm

print_status "Creating application directories..."
mkdir -p $APP_DIR
mkdir -p $LOG_DIR
mkdir -p $UPLOADS_DIR

print_status "Setting up user permissions..."
chown -R www-data:www-data $APP_DIR
chown -R www-data:www-data $LOG_DIR
chown -R www-data:www-data $UPLOADS_DIR

print_status "Installing Python dependencies..."
cd $BACKEND_DIR
sudo -u www-data python3 -m venv venv
sudo -u www-data $BACKEND_DIR/venv/bin/pip install -r requirements.txt
sudo -u www-data $BACKEND_DIR/venv/bin/pip install gunicorn

print_status "Setting up database..."
sudo -u www-data mkdir -p $BACKEND_DIR/data
cd $BACKEND_DIR
sudo -u www-data $BACKEND_DIR/venv/bin/python manage.py db upgrade || true

print_status "Building frontend..."
cd $FRONTEND_DIR
npm install
npm run build

print_status "Setting up Nginx..."
cp /tmp/naviddog-deployment/nginx.conf /etc/nginx/sites-available/naviddog
ln -sf /etc/nginx/sites-available/naviddog /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

print_status "Setting up systemd service..."
cp /tmp/naviddog-deployment/naviddog.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable naviddog

print_status "Starting services..."
systemctl restart naviddog
systemctl restart nginx

print_success "Deployment completed!"
print_status "Checking service status..."
systemctl status naviddog --no-pager
systemctl status nginx --no-pager

print_success "✅ NavidDoggy is now running!"
print_status "🌐 Visit: http://46.101.244.203"
print_status "📊 Backend API: http://46.101.244.203/api/"
print_status "📁 Logs: $LOG_DIR"

print_warning "⚠️  Remember to:"
print_warning "   1. Configure your .env file in $BACKEND_DIR/.env"
print_warning "   2. Set up SSL certificates for HTTPS"
print_warning "   3. Configure firewall (ufw allow 80, ufw allow 443)"
print_warning "   4. Set up automatic backups"