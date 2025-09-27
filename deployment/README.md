# NavidDoggy DigitalOcean Deployment Guide

This guide will help you deploy NavidDoggy to a DigitalOcean Ubuntu droplet.

## Prerequisites

- DigitalOcean droplet with Ubuntu 20.04 or 22.04
- SSH access to your server
- Domain name (optional, but recommended)

## Step 1: Create DigitalOcean Droplet

1. Go to DigitalOcean and create a new droplet
2. Choose Ubuntu 20.04 or 22.04 LTS
3. Select at least **2GB RAM** (recommended: 4GB)
4. Choose your preferred region
5. Add your SSH key
6. Create the droplet

## Step 2: Initial Server Setup

SSH into your server and run the setup script:

```bash
# Connect to your server
ssh root@46.101.244.203

# Download the setup script
wget https://raw.githubusercontent.com/yourusername/naviddog/main/deployment/digitalocean-setup.sh

# Make it executable and run
chmod +x digitalocean-setup.sh
./digitalocean-setup.sh
```

## Step 3: Upload Your Project

Upload your project files to the server:

```bash
# Option 1: Using git (recommended)
cd /var/www
git clone https://github.com/yourusername/naviddog.git naviddog

# Option 2: Using SCP
scp -r /path/to/your/project root@46.101.244.203:/var/www/naviddog
```

## Step 4: Deploy the Application

```bash
cd /var/www/naviddog/deployment
chmod +x deploy-digitalocean.sh
./deploy-digitalocean.sh
```

## Step 5: Configure Environment Variables

Edit the production environment file:

```bash
nano /var/www/naviddog/backend/.env
```

Update these critical values:

```env
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
DOMAIN=your-domain.com
```

## Step 6: Set Up SSL (Recommended)

If you have a domain name:

```bash
# Configure DNS to point to your droplet IP
# Then run:
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 7: Configure Domain (Optional)

If using a domain name instead of IP:

1. Point your domain's A record to your droplet's IP
2. Update nginx configuration:

```bash
nano /etc/nginx/sites-available/naviddog
# Change server_name from IP to your domain
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoring and Maintenance

### Check Application Status
```bash
sudo systemctl status naviddog
sudo journalctl -u naviddog -f
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Update Application
```bash
cd /var/www/naviddog
git pull
sudo systemctl restart naviddog
```

### Backup Database
```bash
cp /var/www/naviddog/backend/data/production.db /backup/location/
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
sudo journalctl -u naviddog -n 50

# Check Python environment
sudo -u naviddog /var/www/naviddog/backend/venv/bin/python -c "import app; print('OK')"
```

### Nginx Errors
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R naviddog:www-data /var/www/naviddog
sudo chmod -R 755 /var/www/naviddog
```

### Database Issues
```bash
# Recreate database
cd /var/www/naviddog/backend
sudo -u naviddog ./venv/bin/python manage.py db upgrade
```

## Security Best Practices

1. **Regular Updates**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **Firewall Configuration**
   ```bash
   sudo ufw status
   sudo ufw allow from trusted.ip.address
   ```

3. **Backup Strategy**
   - Set up automatic database backups
   - Backup uploaded files regularly
   - Store backups off-site

4. **Monitoring**
   - Set up server monitoring (DigitalOcean Monitoring)
   - Configure log rotation
   - Monitor disk space and memory usage

## Directory Structure

```
/var/www/naviddog/
├── backend/
│   ├── app/
│   ├── venv/
│   ├── .env
│   └── wsgi.py
├── frontend/
│   └── dist/
├── deployment/
└── uploads/

/var/log/naviddog/
├── access.log
└── error.log
```

## Performance Optimization

1. **Enable Gzip** (already configured in nginx.conf)
2. **Configure Caching** for static assets
3. **Database Optimization** for larger datasets
4. **CDN Setup** for global content delivery

## Support

If you encounter issues:

1. Check the logs first
2. Verify all services are running
3. Test configurations
4. Review the troubleshooting section

For additional help, check the application documentation or create an issue in the repository.