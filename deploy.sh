#!/bin/bash

# NavidDoggy Deployment Script
# This script automates the deployment process for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are installed"
}

# Check if .env files exist
check_env_files() {
    log_info "Checking environment files..."
    
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "Please edit .env file with your configuration before continuing"
            read -p "Press Enter to continue after editing .env file..."
        else
            log_error ".env.example not found. Cannot create .env file."
            exit 1
        fi
    fi
    
    if [ ! -f "backend/.env" ]; then
        log_warning "backend/.env file not found. Creating from template..."
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            log_warning "Please edit backend/.env file with your configuration"
        fi
    fi
    
    if [ ! -f "frontend/.env" ]; then
        log_warning "frontend/.env file not found. Creating from template..."
        if [ -f "frontend/.env.example" ]; then
            cp frontend/.env.example frontend/.env
            log_warning "Please edit frontend/.env file with your configuration"
        fi
    fi
    
    log_success "Environment files checked"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p backend/logs
    mkdir -p backend/uploads/{gallery,stories,tours,avatars}
    mkdir -p ssl
    
    log_success "Directories created"
}

# Generate SSL certificates (self-signed for development)
generate_ssl() {
    if [ ! -f "ssl/nginx.crt" ] || [ ! -f "ssl/nginx.key" ]; then
        log_info "Generating self-signed SSL certificates..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/nginx.key \
            -out ssl/nginx.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        log_success "SSL certificates generated"
    else
        log_info "SSL certificates already exist"
    fi
}

# Build and start services
deploy_services() {
    log_info "Building and starting services..."
    
    # Pull latest images
    docker-compose pull
    
    # Build custom images
    docker-compose build --no-cache
    
    # Start services
    docker-compose up -d
    
    log_success "Services started"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations
    docker-compose exec backend python -c "
from app import create_app, db
from app.models import User
import os

app = create_app('production')
with app.app_context():
    db.create_all()
    
    # Create admin user if it doesn't exist
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@doggo.com')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    
    if not User.query.filter_by(email=admin_email).first():
        admin = User(
            name='Admin',
            email=admin_email,
            admin_level='super_admin',
            email_verified=True
        )
        admin.set_password(admin_password)
        db.session.add(admin)
        db.session.commit()
        print(f'Admin user created: {admin_email}')
    else:
        print('Admin user already exists')
"
    
    log_success "Database migrations completed"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Check backend health
    for i in {1..30}; do
        if curl -f http://localhost:5000/health &> /dev/null; then
            log_success "Backend is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Backend health check failed"
            return 1
        fi
        sleep 2
    done
    
    # Check frontend health
    for i in {1..30}; do
        if curl -f http://localhost:80/health &> /dev/null; then
            log_success "Frontend is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Frontend health check failed"
            return 1
        fi
        sleep 2
    done
    
    log_success "All services are healthy"
}

# Display deployment info
show_deployment_info() {
    log_success "Deployment completed successfully!"
    echo ""
    echo "🎉 NavidDoggy is now running!"
    echo ""
    echo "📋 Service URLs:"
    echo "   Frontend: http://localhost (or https://localhost for SSL)"
    echo "   Backend API: http://localhost:5000"
    echo "   Admin Panel: http://localhost/admin"
    echo ""
    echo "🔑 Default Admin Credentials:"
    echo "   Email: admin@doggo.com"
    echo "   Password: admin123"
    echo "   (Please change these in production!)"
    echo ""
    echo "📊 Monitoring:"
    echo "   Backend Health: http://localhost:5000/health"
    echo "   Frontend Health: http://localhost/health"
    echo ""
    echo "🐳 Docker Commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart services: docker-compose restart"
    echo ""
}

# Main deployment process
main() {
    log_info "Starting NavidDoggy deployment..."
    
    check_docker
    check_env_files
    create_directories
    
    # Ask if user wants SSL
    read -p "Generate SSL certificates for HTTPS? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        generate_ssl
    fi
    
    deploy_services
    run_migrations
    health_check
    show_deployment_info
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "update")
        log_info "Updating services..."
        docker-compose pull
        docker-compose up -d --build
        health_check
        log_success "Update completed"
        ;;
    "backup")
        log_info "Creating database backup..."
        docker-compose exec postgres pg_dump -U postgres doggo_daily > "backup_$(date +%Y%m%d_%H%M%S).sql"
        log_success "Database backup created"
        ;;
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "stop")
        log_info "Stopping services..."
        docker-compose down
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting services..."
        docker-compose restart
        log_success "Services restarted"
        ;;
    "clean")
        log_warning "This will remove all containers, images, and volumes. Are you sure?"
        read -p "Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            docker-compose down -v --rmi all
            docker system prune -f
            log_success "Cleanup completed"
        else
            log_info "Cleanup cancelled"
        fi
        ;;
    *)
        echo "Usage: $0 {deploy|update|backup|logs|stop|restart|clean}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment (default)"
        echo "  update  - Update and restart services"
        echo "  backup  - Create database backup"
        echo "  logs    - View service logs"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  clean   - Remove all containers and images"
        exit 1
        ;;
esac