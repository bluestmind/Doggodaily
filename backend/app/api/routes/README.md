# API Routes Structure

This directory contains the modular API routes for the DoggoDaily application. The routes have been split into logical modules for better maintainability and organization.

## Route Modules

### 1. `auth_routes.py`
**Authentication and Authorization**
- User login/logout
- Admin login
- Token refresh
- User registration
- Password management (change, reset, forgot)
- Email verification
- Two-factor authentication (2FA)

**Endpoints:**
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/refresh` - Refresh tokens
- `POST /api/auth/logout` - Logout current session
- `POST /api/auth/logout-all` - Logout all sessions
- `GET /api/auth/sessions` - Get user sessions
- `DELETE /api/auth/sessions/<id>` - End specific session
- `POST /api/auth/register` - User registration
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/setup-2fa` - Setup 2FA
- `POST /api/auth/verify-2fa` - Verify 2FA
- `POST /api/auth/disable-2fa` - Disable 2FA

### 2. `user_routes.py`
**User Management**
- User profile management
- User CRUD operations (admin only)
- User statistics

**Endpoints:**
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `GET /api/users/<id>` - Get user by ID (admin)
- `GET /api/users/` - Get all users (admin)
- `PUT /api/users/<id>` - Update user (admin)
- `DELETE /api/users/<id>` - Delete user (admin)
- `POST /api/users/<id>/toggle-status` - Toggle user status (admin)
- `GET /api/users/statistics` - Get user statistics (admin)

### 3. `story_routes.py`
**Story Management**
- Story CRUD operations
- Story publishing workflow
- Story statistics

**Endpoints:**
- `GET /api/stories/` - Get all published stories
- `GET /api/stories/<id>` - Get story by ID
- `POST /api/stories/` - Create story
- `PUT /api/stories/<id>` - Update story
- `DELETE /api/stories/<id>` - Delete story
- `GET /api/stories/my-stories` - Get user's stories
- `GET /api/stories/statistics` - Get story statistics (admin)

### 4. `gallery_routes.py`
**Gallery Management**
- Gallery item CRUD operations
- Gallery statistics

**Endpoints:**
- `GET /api/gallery/` - Get all gallery items
- `GET /api/gallery/<id>` - Get gallery item by ID
- `POST /api/gallery/` - Create gallery item (admin)
- `PUT /api/gallery/<id>` - Update gallery item (admin)
- `DELETE /api/gallery/<id>` - Delete gallery item (admin)
- `GET /api/gallery/statistics` - Get gallery statistics (admin)

### 5. `tour_routes.py`
**Tour Management**
- Tour CRUD operations
- Tour statistics

**Endpoints:**
- `GET /api/tours/` - Get all active tours
- `GET /api/tours/<id>` - Get tour by ID
- `POST /api/tours/` - Create tour (admin)
- `PUT /api/tours/<id>` - Update tour (admin)
- `DELETE /api/tours/<id>` - Delete tour (admin)
- `GET /api/tours/statistics` - Get tour statistics (admin)

### 6. `admin_routes.py`
**Admin Dashboard and Management**
- Dashboard data
- System statistics
- Security events monitoring
- System health

**Endpoints:**
- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/statistics` - Get system statistics
- `GET /api/admin/security-events` - Get security events
- `GET /api/admin/health` - Get system health

### 7. `security_routes.py`
**Security Management**
- User security information
- Security events
- Account management

**Endpoints:**
- `GET /api/security/info` - Get user security info
- `GET /api/security/events` - Get user security events
- `POST /api/security/unlock-account/<id>` - Unlock account (admin)
- `GET /api/security/statistics` - Get security statistics (admin)

### 8. `analytics_routes.py`
**Analytics and Reporting**
- User analytics
- Content analytics
- Security analytics
- Performance analytics

**Endpoints:**
- `GET /api/analytics/users` - Get user analytics (admin)
- `GET /api/analytics/content` - Get content analytics (admin)
- `GET /api/analytics/security` - Get security analytics (admin)
- `GET /api/analytics/performance` - Get performance analytics (admin)

### 9. `communication_routes.py`
**Communication Management**
- Bulk email sending
- User notifications
- Communication statistics

**Endpoints:**
- `POST /api/communications/bulk-email` - Send bulk email (admin)
- `POST /api/communications/notify-user/<id>` - Notify specific user (admin)
- `GET /api/communications/statistics` - Get communication statistics (admin)

### 10. `system_routes.py`
**System Management**
- System information
- Application configuration
- Database information
- Logs information
- System health

**Endpoints:**
- `GET /api/system/info` - Get system information (admin)
- `GET /api/system/config` - Get app configuration (admin)
- `GET /api/system/database` - Get database information (admin)
- `GET /api/system/logs` - Get logs information (admin)
- `GET /api/system/health` - Get system health (public)

## Benefits of Modular Structure

1. **Maintainability**: Each module focuses on a specific domain
2. **Scalability**: Easy to add new routes without affecting existing ones
3. **Organization**: Clear separation of concerns
4. **Testing**: Easier to test individual modules
5. **Documentation**: Self-documenting structure
6. **Team Collaboration**: Multiple developers can work on different modules

## Adding New Routes

To add new routes:

1. Create a new route file in the appropriate module
2. Import the blueprint from the module
3. Add your route functions
4. Register the blueprint in `__init__.py` if it's a new module

## Security Features

All routes include:
- JWT authentication where required
- Admin permission checks
- Input validation
- Error handling
- Security logging
- Rate limiting 