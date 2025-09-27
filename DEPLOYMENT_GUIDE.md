# 🚀 DoggoDaily Production Deployment Guide

## Prerequisites
- Production server with root/SSH access
- Domain `www.doggodaiily.com` pointing to your server IP
- SSL certificate (Let's Encrypt recommended)

## Step 1: Upload Files to Production Server

### Upload via SCP/SFTP:
```bash
# Upload entire project to server
scp -r . root@46.101.244.203:/root/site/

# Or upload specific directories
scp -r frontend/dist root@46.101.244.203:/var/www/doggodaiily/frontend/
scp -r backend root@46.101.244.203:/var/www/doggodaiily/backend/
```

### Upload via Git:
```bash
# On production server
cd /root/site
git clone <your-repo-url>
cd NavidDoggy
```

## Step 2: Run Production Deployment

### On Production Server:
```bash
cd /root/site/NavidDoggy
chmod +x deploy.production.sh
./deploy.production.sh
```

## Step 3: Configure Domain and SSL

### DNS Configuration:
- Point `www.doggodaiily.com` to your server IP: `46.101.244.203`
- Point `doggodaiily.com` to your server IP: `46.101.244.203`

### SSL Certificate (Let's Encrypt):
```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d www.doggodaiily.com -d doggodaiily.com
```

## Step 4: Verify Deployment

### Test URLs:
- Frontend: https://www.doggodaiily.com/
- Backend API: https://www.doggodaiily.com/api/health
- Admin Panel: https://www.doggodaiily.com/admin

### Admin Credentials:
- Super Admin: `supernajji@doggodaily.com` / `SuperNajji123!`
- Admin: `admin@doggodaily.com` / `Admin123!`
- Moderator: `moderator@doggodaily.com` / `Moderator123!`

## Step 5: Production Checklist

- [ ] Frontend built and uploaded
- [ ] Backend deployed with Gunicorn
- [ ] Nginx configured with SSL
- [ ] Database initialized
- [ ] Admin users created
- [ ] Domain pointing to server
- [ ] SSL certificate installed
- [ ] Firewall configured (ports 80, 443)
- [ ] Backup system in place

## Troubleshooting

### Check Service Status:
```bash
sudo systemctl status nginx
sudo systemctl status doggodaiily-backend
```

### Check Logs:
```bash
sudo journalctl -u doggodaiily-backend -f
sudo tail -f /var/log/nginx/error.log
```

### Test API:
```bash
curl -I https://www.doggodaiily.com/api/health
```

## Security Notes

- Change default admin passwords
- Configure firewall (UFW)
- Enable automatic security updates
- Set up monitoring and alerts
- Regular backups
