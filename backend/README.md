# DoggoDaily Backend API

A comprehensive Flask REST API for the DoggoDaily dog community platform.

## Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **User Management**: Registration, login, profile management, admin controls
- **Stories**: Create, read, update, delete dog stories with likes and comments
- **Gallery**: Upload and manage photos/videos with metadata
- **Tours**: Manage dog-friendly tours and bookings
- **Analytics**: Track site usage and generate reports (admin only)
- **Security**: Comprehensive logging and monitoring
- **File Uploads**: Image and video upload with thumbnail generation

## Tech Stack

- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (development), PostgreSQL/MySQL (production)
- **Authentication**: Flask-JWT-Extended
- **Validation**: Marshmallow schemas
- **File Handling**: PIL/Pillow for image processing
- **Migrations**: Flask-Migrate
- **CORS**: Flask-CORS for frontend integration

## Quick Start

### 1. Environment Setup

```bash
# Clone and navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```env
# Flask Configuration
FLASK_APP=manage.py
FLASK_ENV=development
FLASK_DEBUG=True

# Security Keys
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production

# Database
DATABASE_URL=sqlite:///doggo_daily.db

# CORS Origins
CORS_ORIGINS=http://localhost:3000

# Email Configuration (optional for development)
MAIL_SERVER=localhost
MAIL_PORT=25
MAIL_USE_TLS=False
MAIL_USERNAME=
MAIL_PASSWORD=
```

### 3. Database Setup

```bash
# Initialize database with sample data
python init_db.py
```

This creates:
- Admin user: `admin@doggodaily.com` / `AdminPass123!`
- 5 regular users: `sophie@example.com` / `UserPass123!` (etc.)
- Sample stories, gallery items, tours, and analytics data

### 4. Run the Server

```bash
# Start the development server
python manage.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login user |
| POST | `/logout` | Logout user |
| POST | `/refresh` | Refresh access token |
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update user profile |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password with token |

### Stories (`/api/stories/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List stories (with pagination/filters) |
| POST | `/` | Create new story |
| GET | `/{id}` | Get single story |
| PUT | `/{id}` | Update story |
| DELETE | `/{id}` | Delete story |
| POST | `/{id}/like` | Like/unlike story |
| GET | `/{id}/comments` | Get story comments |
| POST | `/{id}/comments` | Add comment |

### Gallery (`/api/gallery/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List gallery items |
| POST | `/upload` | Upload media file |
| GET | `/{id}` | Get gallery item |
| PUT | `/{id}` | Update gallery item |
| DELETE | `/{id}` | Delete gallery item |

### Tours (`/api/tours/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List tours |
| POST | `/` | Create tour (admin) |
| GET | `/{id}` | Get tour details |
| PUT | `/{id}` | Update tour (admin) |
| POST | `/{id}/book` | Book tour |
| GET | `/{id}/bookings` | Get tour bookings (admin) |

### Users (`/api/users/`) - Admin Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all users |
| POST | `/` | Create user |
| GET | `/{id}` | Get user |
| PUT | `/{id}` | Update user |
| DELETE | `/{id}` | Delete user |
| POST | `/bulk` | Bulk user actions |

### Analytics (`/api/analytics/`) - Admin Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/overview` | Get analytics overview |
| GET | `/traffic` | Get traffic data |
| GET | `/users` | Get user analytics |
| GET | `/content` | Get content analytics |

## Request/Response Format

### Successful Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "pages": 10,
    "per_page": 10,
    "total": 95,
    "has_next": true,
    "has_prev": false
  }
}
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

Tokens expire after 1 hour. Use the refresh token to get a new access token:

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Authorization: Bearer <refresh-token>"
```

## File Uploads

For file uploads, use multipart/form-data:

```bash
curl -X POST http://localhost:5000/api/gallery/upload \
  -H "Authorization: Bearer <token>" \
  -F "media=@photo.jpg" \
  -F "title=My Dog Photo" \
  -F "category=pets"
```

Supported formats: JPG, PNG, GIF, MP4, MOV, AVI, WEBM
Max file size: 50MB

## Database Models

### User
- Authentication and profile information
- Roles: 'user' or 'admin'
- Email verification and password reset

### Story
- User-generated content with rich text
- Categories, tags, thumbnails
- Like and comment system
- Publishing workflow

### GalleryItem
- Image and video uploads
- Metadata: location, photographer, tags
- Thumbnail generation
- Download tracking

### Tour
- Tour information and scheduling
- Booking management
- Capacity tracking
- Guide information

### Analytics
- Daily metrics tracking
- Multiple metric types
- Date-based aggregation

## Development

### Adding New Endpoints

1. Create route in `app/api/routes.py`
2. Add validation schema in `app/api/schemas.py`
3. Update models if needed in `app/models.py`
4. Test with provided sample data

### Database Migrations

```bash
# Create migration
flask db migrate -m "Description"

# Apply migration
flask db upgrade
```

### Testing

```bash
# Run basic health check
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sophie@example.com","password":"UserPass123!"}'
```

## Deployment

### Production Environment Variables

```env
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=postgresql://user:pass@localhost/doggo_daily
SECRET_KEY=secure-random-key
JWT_SECRET_KEY=secure-jwt-key
CORS_ORIGINS=https://your-domain.com
```

### Database Setup

For production, use PostgreSQL or MySQL:

```bash
# PostgreSQL
pip install psycopg2
export DATABASE_URL=postgresql://user:pass@localhost/doggo_daily

# MySQL
pip install pymysql
export DATABASE_URL=mysql://user:pass@localhost/doggo_daily
```

### WSGI Server

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 manage:app
```

## API Integration

The backend is designed to work seamlessly with the React frontend. The API endpoints exactly match the service calls in:

- `frontend/src/services/authService.js`
- `frontend/src/services/storiesService.js`
- `frontend/src/services/galleryService.js`
- `frontend/src/services/toursService.js`
- `frontend/src/services/analyticsService.js`

## Support

For issues or questions:
1. Check the logs in the console
2. Verify environment variables
3. Ensure database is properly initialized
4. Check CORS settings for frontend integration

The API provides comprehensive error messages and logging to help with debugging. 