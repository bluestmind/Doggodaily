# Production Environment Configuration for https://www.doggodaiily.com/
# Copy this file to .env and update the values as needed

# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-super-secret-production-key-change-this-immediately
JWT_SECRET_KEY=your-jwt-secret-production-key-change-this-immediately

# Database Configuration
DATABASE_URL=sqlite:///data/production.db
# For PostgreSQL: DATABASE_URL=postgresql://username:password@localhost/doggodaily_prod

# Domain Configuration
FRONTEND_URL=https://www.doggodaiily.com
CORS_ORIGINS=https://www.doggodaiily.com,https://doggodaiily.com,http://46.101.244.203:3000,http://46.101.244.203:5000,http://localhost:3000

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://www.doggodaiily.com/api/auth/google/callback

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=noreply@doggodaiily.com
MAIL_SUPPRESS_SEND=False

# Security Configuration
FORCE_HTTPS=True
SESSION_COOKIE_SECURE=True
BCRYPT_LOG_ROUNDS=14
MAX_LOGIN_ATTEMPTS=3
ACCOUNT_LOCKOUT_DURATION=60

# File Upload Configuration
UPLOAD_FOLDER=/var/www/doggodaiily/uploads
MAX_CONTENT_LENGTH=52428800

# Logging Configuration
LOG_LEVEL=WARNING
LOG_FILE=/var/log/doggodaiily/app.log

# Rate Limiting
RATELIMIT_STORAGE_URL=memory://
RATELIMIT_DEFAULT=1000/day,100/hour

# Admin Configuration
ADMIN_EMAIL=admin@doggodaiily.com
ADMIN_NOTIFICATION_EMAIL=admin@doggodaiily.com

# Feature Flags
FEATURE_2FA_REQUIRED_FOR_ADMIN=True
FEATURE_EMAIL_VERIFICATION=True
FEATURE_GEOLOCATION_TRACKING=True
FEATURE_DEVICE_TRACKING=True

# Security Alerts
SECURITY_ALERT_EMAIL=security@doggodaiily.com
FAILED_LOGIN_ALERT_THRESHOLD=10
SUSPICIOUS_ACTIVITY_ALERT=True
