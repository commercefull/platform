#!/bin/bash

# CommerceFull Docker Production Deployment Script
# This script helps deploy the application in production using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required files exist
check_requirements() {
    print_info "Checking requirements..."

    # Change to project root to check for files
    cd "$(dirname "$0")/../.." || exit 1

    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please copy .env.example to .env and configure it."
        exit 1
    fi

    if [ ! -f "infra/docker/docker-compose.yml" ]; then
        print_error "infra/docker/docker-compose.yml not found."
        exit 1
    fi

    if [ ! -f "infra/docker/docker-compose.prod.yml" ]; then
        print_error "infra/docker/docker-compose.prod.yml not found."
        exit 1
    fi

    print_success "Requirements check passed."
}

# Build and deploy
deploy() {
    print_info "Starting production deployment..."

    # Change to project root directory for docker operations
    cd "$(dirname "$0")/../.." || exit 1

    # Stop existing containers
    print_info "Stopping existing containers..."
    docker-compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.prod.yml down || true

    # Build and start services
    print_info "Building and starting services..."
    docker-compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.prod.yml up -d --build

    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 30

    # Check service health
    check_health

    # Run database migrations
    print_info "Running database migrations..."
    docker-compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.prod.yml exec -T app yarn db:migrate

    print_success "Deployment completed successfully!"
    print_info "Application should be available at: http://localhost:3000"
}

# Check service health
check_health() {
    print_info "Checking application health..."

    # Wait for app to be ready
    max_attempts=30
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
            print_success "Application is healthy!"
            return 0
        fi

        print_warning "Waiting for application to be ready... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    print_error "Application failed to start properly. Check logs with: docker-compose logs app"
    exit 1
}

# Show logs
show_logs() {
    print_info "Showing application logs..."
    cd "$(dirname "$0")/../.." || exit 1
    docker-compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.prod.yml logs -f app
}

# Show status
show_status() {
    print_info "Service status:"
    cd "$(dirname "$0")/../.." || exit 1
    docker-compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.prod.yml ps
}

# Stop services
stop_services() {
    print_info "Stopping services..."
    cd "$(dirname "$0")/../.." || exit 1
    docker-compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.prod.yml down
    print_success "Services stopped."
}

# Clean up
cleanup() {
    print_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "Cleaning up..."
        cd "$(dirname "$0")/../.." || exit 1
        docker-compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.prod.yml down -v --rmi all
        print_success "Cleanup completed."
    else
        print_info "Cleanup cancelled."
    fi
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        check_requirements
        deploy
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "cleanup")
        cleanup
        ;;
    "restart")
        cd "$(dirname "$0")/../.." || exit 1
        stop_services
        deploy
        ;;
    *)
        echo "Usage: $0 {deploy|logs|status|stop|cleanup|restart}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Build and deploy application (default)"
        echo "  logs     - Show application logs"
        echo "  status   - Show service status"
        echo "  stop     - Stop all services"
        echo "  cleanup  - Remove all containers, volumes, and images"
        echo "  restart  - Restart all services"
        exit 1
        ;;
esac
