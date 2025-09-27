#!/bin/bash

# Production Deployment Script for https://www.doggodaiily.com/
# This script deploys the DoggoDaily application to production

set -e  # Exit on any error

echo "🚀 Starting deployment to https://www.doggodaiily.com/"

# Configuration
DOMAIN="www.doggodaiily.com"
BACKUP_DIR="/var/backups/doggodaiily"
APP_DIR="/var/www/doggodaiily"
LOG_DIR="/var/log/doggodaiily"

# Create necessary directories
echo "📁 Creating directories..."
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p $APP_DIR
sudo mkdir -p $LOG_DIR
sudo mkdir -p $APP_DIR/uploads
sudo mkdir -p $APP_DIR/data

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR
sudo chmod -R 777 $APP_DIR/uploads

# Backup existing database
echo "💾 Creating database backup..."
if [ -f "$APP_DIR/data/production.db" ]; then
    sudo cp $APP_DIR/data/production.db $BACKUP_DIR/production_$(date +%Y%m%d_%H%M%S).db
    echo "✅ Database backed up"
fi

# Deploy backend
echo "🔧 Deploying backend..."

# Copy backend files to production directory
sudo cp -r backend/* $APP_DIR/backend/

# Copy environment file
if [ -f "backend/env.production.doggodaiily.com" ]; then
    sudo cp backend/env.production.doggodaiily.com $APP_DIR/backend/.env
    echo "✅ Environment file copied"
fi

# Create virtual environment in backend directory
cd $APP_DIR/backend
sudo python3 -m venv venv
sudo chown -R www-data:www-data venv

# Install Python dependencies
echo "📦 Installing Python dependencies..."
sudo -u www-data ./venv/bin/pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
sudo -u www-data ./venv/bin/python manage.py db upgrade

# Deploy frontend
echo "🎨 Deploying frontend..."
cd /root/site/frontend

# Copy environment file
if [ -f "env.production.doggodaiily.com" ]; then
    cp env.production.doggodaiily.com .env
    echo "✅ Frontend environment file copied"
fi

# Install Node dependencies
echo "📦 Installing Node dependencies..."
npm install

# Build production bundle
echo "🏗️ Building production bundle..."
npm run build

# Copy built files to web directory
echo "📋 Copying built files..."
sudo cp -r dist/* /usr/share/nginx/html/

# Copy nginx configuration
echo "⚙️ Configuring nginx..."
if [ -f "/root/site/frontend/nginx.production.doggodaiily.com.conf" ]; then
    sudo cp /root/site/frontend/nginx.production.doggodaiily.com.conf /etc/nginx/sites-available/doggodaiily.com
    sudo ln -sf /etc/nginx/sites-available/doggodaiily.com /etc/nginx/sites-enabled/
    echo "✅ Nginx configuration updated"
fi

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Copy systemd service file
echo "⚙️ Configuring systemd service..."
if [ -f "/root/site/doggodaiily-backend.service" ]; then
    sudo cp /root/site/doggodaiily-backend.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable doggodaiily-backend
    echo "✅ Systemd service configured"
fi

# Restart services
echo "🔄 Restarting services..."
sudo systemctl restart nginx
sudo systemctl restart doggodaiily-backend

# Check service status
echo "📊 Checking service status..."
sudo systemctl status nginx --no-pager -l
sudo systemctl status doggodaiily-backend --no-pager -l

# Test the deployment
echo "🧪 Testing deployment..."
sleep 5
if curl -f -s "https://$DOMAIN/health" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# SSL Certificate check
echo "🔒 Checking SSL certificate..."
if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "✅ SSL certificate is valid"
else
    echo "⚠️ SSL certificate may need renewal"
fi

echo "🎉 Deployment completed successfully!"
echo "🌐 Application is now live at: https://$DOMAIN"
echo "📊 Monitor logs at: $LOG_DIR"

# Display useful information
echo ""
echo "📋 Useful commands:"
echo "  View logs: sudo tail -f $LOG_DIR/app.log"
echo "  Restart backend: sudo systemctl restart doggodaiily-backend"
echo "  Restart nginx: sudo systemctl restart nginx"
echo "  Check status: sudo systemctl status doggodaiily-backend"
echo ""
echo "🔧 Configuration files:"
echo "  Backend config: $APP_DIR/.env"
echo "  Frontend config: /usr/share/nginx/html/.env"
echo "  Nginx config: /etc/nginx/sites-available/doggodaiily.com"
