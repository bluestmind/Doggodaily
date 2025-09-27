#!/bin/bash
# Installation script to prepare the server for NavidDoggy deployment

set -e

echo "🔧 Preparing server for NavidDoggy deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing system dependencies..."
sudo apt install -y \
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
    zlib1g-dev

# Install Node.js (latest LTS)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (optional, for Node.js process management)
sudo npm install -g pm2

# Create application user if not exists
echo "👤 Setting up application user..."
if ! id "www-data" &>/dev/null; then
    sudo useradd -r -s /bin/bash -d /var/www www-data
fi

# Create directories
echo "📁 Creating application directories..."
sudo mkdir -p /var/www/naviddog
sudo mkdir -p /var/log/naviddog
sudo mkdir -p /var/www/naviddog/uploads

# Set permissions
sudo chown -R www-data:www-data /var/www/naviddog
sudo chown -R www-data:www-data /var/log/naviddog
sudo chmod -R 755 /var/www/naviddog
sudo chmod -R 755 /var/log/naviddog

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Install Python packages globally that might be needed
echo "🐍 Installing global Python packages..."
sudo pip3 install --upgrade pip

echo "✅ Server preparation completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Upload your NavidDoggy project to /var/www/naviddog/"
echo "2. Run the deployment script"
echo "3. Configure your domain and SSL certificates"
echo ""
echo "📍 Key directories:"
echo "   - Application: /var/www/naviddog/"
echo "   - Logs: /var/log/naviddog/"
echo "   - Uploads: /var/www/naviddog/uploads/"