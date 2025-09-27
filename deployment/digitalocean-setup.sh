#!/bin/bash
# DigitalOcean Ubuntu Server Setup for NavidDoggy
# Run this script on your fresh Ubuntu droplet

set -e

echo "🌊 Setting up DigitalOcean Ubuntu server for NavidDoggy..."

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
    print_error "Please run as root: sudo ./digitalocean-setup.sh"
    exit 1
fi

# Update system
print_status "Updating Ubuntu system..."
apt update && apt upgrade -y

# Install essential packages
print_status "Installing system dependencies..."
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    nginx \
    git \
    curl \
    wget \
    unzip \
    supervisor \
    sqlite3 \
    build-essential \
    libssl-dev \
    libffi-dev \
    libjpeg-dev \
    zlib1g-dev \
    software-properties-common \
    ufw \
    fail2ban \
    htop \
    tree

# Install Node.js 18 LTS
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Create application directories
print_status "Creating directories..."
mkdir -p /var/www/naviddog
mkdir -p /var/log/naviddog
mkdir -p /var/www/naviddog/uploads
mkdir -p /etc/naviddog

# Create naviddog user
print_status "Creating application user..."
useradd -r -s /bin/bash -d /var/www/naviddog -m naviddog || true
usermod -aG www-data naviddog

# Set permissions
chown -R naviddog:www-data /var/www/naviddog
chown -R naviddog:www-data /var/log/naviddog
chmod -R 755 /var/www/naviddog
chmod -R 755 /var/log/naviddog

# Configure firewall
print_status "Configuring firewall..."
ufw allow ssh
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# Configure fail2ban
print_status "Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Create swap file (if not exists)
if [ ! -f /swapfile ]; then
    print_status "Creating swap file..."
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
fi

# Install Certbot for SSL
print_status "Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx

print_success "✅ DigitalOcean server setup completed!"
print_status "📋 Summary:"
print_status "   - Python 3, Node.js 18, Nginx installed"
print_status "   - User 'naviddog' created"
print_status "   - Directories created in /var/www/naviddog/"
print_status "   - Firewall configured (SSH, HTTP, HTTPS)"
print_status "   - Fail2ban enabled"
print_status "   - Certbot installed for SSL"

print_warning "🎯 Next steps:"
print_warning "   1. Upload your project files to /var/www/naviddog/"
print_warning "   2. Run the deployment script"
print_warning "   3. Configure domain name and SSL"
print_warning "   4. Set up monitoring and backups"