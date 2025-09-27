# Frontend Environment Configuration for https://www.doggodaiily.com/
# Copy this file to .env and update the values as needed

# API Configuration
VITE_API_URL=https://www.doggodaiily.com/api

# Application Configuration
VITE_APP_NAME=DoggoDaily
VITE_APP_VERSION=2.0.0
VITE_APP_DESCRIPTION=The ultimate platform for dog lovers and their stories

# Domain Configuration
VITE_DOMAIN=https://www.doggodaiily.com
VITE_DOMAIN_WITHOUT_WWW=https://doggodaiily.com

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Analytics Configuration (if using)
VITE_GOOGLE_ANALYTICS_ID=your-google-analytics-id

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE_MODE=false

# Development Configuration (for local development)
# VITE_API_URL=http://localhost:5000/api
# VITE_DOMAIN=http://localhost:3000
