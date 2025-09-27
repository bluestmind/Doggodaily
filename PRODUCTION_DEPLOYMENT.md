# DoggoDaily Production Deployment Guide

## 🌐 Production Domain: https://www.doggodaiily.com/

This guide covers the complete setup and deployment of the DoggoDaily application to the production domain `https://www.doggodaiily.com/`.

## 📋 Prerequisites

- Ubuntu/Debian server with root access
- Domain `doggodaiily.com` pointing to your server
- SSL certificate for the domain
- Python 3.8+ and Node.js 16+
- Nginx web server
- Gunicorn WSGI server

## 🔧 Configuration Updates Made

### Backend Configuration
- **File**: `backend/config.py`
  - Updated CORS origins to include `https://www.doggodaiily.com` and `https://doggodaiily.com`
  - Updated `FRONTEND_URL` to `https://www.doggodaiily.com`
  - Updated `GOOGLE_REDIRECT_URI` to `https://www.doggodaiily.com/api/auth/google/callback`

- **File**: `backend/config_production.py`
  - Updated CORS origins for production
  - Updated frontend URL and OAuth redirect URI

### Frontend Configuration
- **File**: `frontend/src/config/api.js`
  - Updated API base URL to `https://www.doggodaiily.com/api`

## 📁 New Files Created

### Environment Templates
- `backend/env.production.doggodaiily.com` - Backend environment configuration
- `frontend/env.production.doggodaiily.com` - Frontend environment configuration

### Nginx Configuration
- `frontend/nginx.production.doggodaiily.com.conf` - Production nginx configuration with SSL

### Deployment Files
- `deploy.production.sh` - Automated deployment script
- `doggodaiily-backend.service` - Systemd service file for backend

## 🚀 Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx python3 python3-pip python3-venv nodejs npm certbot python3-certbot-nginx

# Create application directory
sudo mkdir -p /var/www/doggodaiily
sudo mkdir -p /var/log/doggodaiily
sudo mkdir -p /var/backups/doggodaiily
```

### 2. SSL Certificate Setup

```bash
# Get SSL certificate using Let's Encrypt
sudo certbot --nginx -d doggodaiily.com -d www.doggodaiily.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Backend Deployment

```bash
# Copy backend files
sudo cp -r backend/* /var/www/doggodaiily/

# Create virtual environment
cd /var/www/doggodaiily
sudo python3 -m venv venv
sudo chown -R www-data:www-data venv

# Activate virtual environment and install dependencies
sudo -u www-data /var/www/doggodaiily/venv/bin/pip install -r requirements.txt

# Copy environment file
sudo cp env.production.doggodaiily.com .env
sudo chown www-data:www-data .env

# Initialize database
sudo -u www-data /var/www/doggodaiily/venv/bin/python manage.py db upgrade
```

### 4. Frontend Deployment

```bash
# Copy frontend files
sudo cp -r frontend/* /var/www/doggodaiily/frontend/

# Install dependencies and build
cd /var/www/doggodaiily/frontend
sudo npm install
sudo cp env.production.doggodaiily.com .env
sudo npm run build

# Copy built files to nginx directory
sudo cp -r dist/* /usr/share/nginx/html/
```

### 5. Nginx Configuration

```bash
# Copy nginx configuration
sudo cp /var/www/doggodaiily/frontend/nginx.production.doggodaiily.com.conf /etc/nginx/sites-available/doggodaiily.com

# Enable site
sudo ln -sf /etc/nginx/sites-available/doggodaiily.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 6. Backend Service Setup

```bash
# Copy systemd service file
sudo cp doggodaiily-backend.service /etc/systemd/system/

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable doggodaiily-backend
sudo systemctl start doggodaiily-backend
```

### 7. Automated Deployment

```bash
# Make deployment script executable
chmod +x deploy.production.sh

# Run deployment
./deploy.production.sh
```

## 🔒 Security Considerations

### SSL/TLS Configuration
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS headers enabled
- Perfect Forward Secrecy

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### Application Security
- Secure session cookies
- CSRF protection
- Rate limiting
- Input validation
- SQL injection prevention

## 📊 Monitoring and Maintenance

### Log Files
- Application logs: `/var/log/doggodaiily/app.log`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -u doggodaiily-backend`

### Health Checks
- Frontend: `https://www.doggodaiily.com/health`
- Backend: `https://www.doggodaiily.com/api/health`

### Backup Strategy
- Database backups: `/var/backups/doggodaiily/`
- Uploaded files: `/var/www/doggodaiily/uploads/`
- Configuration files: Version controlled

## 🔄 Updates and Maintenance

### Regular Updates
```bash
# Update application
git pull origin main
./deploy.production.sh

# Update system packages
sudo apt update && sudo apt upgrade -y

# Renew SSL certificate
sudo certbot renew
```

### Database Maintenance
```bash
# Backup database
sudo cp /var/www/doggodaiily/data/production.db /var/backups/doggodaiily/production_$(date +%Y%m%d_%H%M%S).db

# Run migrations
sudo -u www-data /var/www/doggodaiily/venv/bin/python manage.py db upgrade
```

## 🆘 Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

2. **Service Not Starting**
   ```bash
   sudo systemctl status doggodaiily-backend
   sudo journalctl -u doggodaiily-backend -f
   ```

3. **Nginx Configuration Errors**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **Database Connection Issues**
   ```bash
   sudo -u www-data /var/www/doggodaiily/venv/bin/python manage.py db current
   ```

### Performance Optimization

1. **Enable Gzip Compression** (already configured)
2. **Set up Redis for caching**
3. **Configure CDN for static assets**
4. **Monitor resource usage**

## 📞 Support

For issues related to the production deployment:
- Check logs: `/var/log/doggodaiily/`
- Monitor services: `sudo systemctl status doggodaiily-backend nginx`
- Test endpoints: `curl -I https://www.doggodaiily.com/health`

## 🎯 Production Checklist

- [ ] Domain DNS configured
- [ ] SSL certificate installed and auto-renewal set up
- [ ] Backend service running and enabled
- [ ] Nginx configured and running
- [ ] Database initialized and migrated
- [ ] Environment variables configured
- [ ] File permissions set correctly
- [ ] Backup strategy implemented
- [ ] Monitoring and logging configured
- [ ] Security headers enabled
- [ ] Health checks working
- [ ] Performance optimization applied

---

**Production URL**: https://www.doggodaiily.com/
**Admin Panel**: https://www.doggodaiily.com/admin
**API Documentation**: https://www.doggodaiily.com/api/docs
