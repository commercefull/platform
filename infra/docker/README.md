# CommerceFull Docker Setup

This directory contains the Docker configuration for deploying CommerceFull in production.

## Files

- `Dockerfile` - Multi-stage production build
- `docker-compose.yml` - Development services
- `docker-compose.prod.yml` - Production overrides
- `deploy.sh` - Production deployment script
- `init-postgres.sql` - PostgreSQL initialization
- `.env.prod.example` - Production environment template
- `build-for-ecs.sh` - **ECS integration script**

## AWS ECS Integration

This Docker setup is fully compatible with the AWS ECS deployment in `../ecs-aws/`. The `build-for-ecs.sh` script automatically builds and pushes images to ECR for ECS deployment.

### Using with ECS

```bash
# From infra/docker directory
./build-for-ecs.sh

# Then deploy via ECS CDK
cd ../ecs-aws
./deploy.sh --environment prod
```

### What the Integration Does

1. **Builds** the optimized Docker image using the infra/docker Dockerfile
2. **Authenticates** with AWS ECR
3. **Tags and pushes** the image to ECR
4. **ECS CDK** then deploys using this image

### Benefits

- **Consistent builds** between local Docker and ECS deployments
- **Optimized images** with multi-stage builds and security hardening
- **Same Dockerfile** for both development and production
- **Automated ECR push** with proper tagging

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 3000, 5432, 6379 available

### 1. Environment Setup

```bash
# Navigate to the infra/docker directory
cd infra/docker

# Copy environment template
cp .env.prod.example ../../../.env.prod

# Edit the production environment file
# IMPORTANT: Generate strong secrets for all *_SECRET variables
nano ../../../.env.prod
```

### 2. Deploy

```bash
# From the infra/docker directory
./deploy.sh

# Or manually:
cd ../..  # Go to project root
docker-compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.prod.yml up -d --build
docker-compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.prod.yml exec app yarn db:migrate
```

### 3. Access

- **Application:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Health Check:** http://localhost:3000/health
- **Database:** localhost:5432
- **Redis:** localhost:6379

## Production Deployment

### Environment Variables

Copy `.env.prod.example` to `.env.prod` and configure:

```bash
# Application
PORT=3000
NODE_ENV=production
BASE_URL=https://yourdomain.com

# Database
POSTGRES_HOST=postgres
POSTGRES_USER=commercefull_prod
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=commercefull_prod

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=<secure-password>

# Secrets (generate with: openssl rand -hex 32)
SESSION_SECRET=<64-char-hex>
CUSTOMER_JWT_SECRET=<secure-secret>
MERCHANT_JWT_SECRET=<secure-secret>
COOKIE_SECRET=<secure-secret>
```

### SSL/HTTPS

For production, configure SSL termination:

```bash
# Using nginx reverse proxy
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Development Usage

For development with live reload:

```bash
# Use docker-compose.yml only (no prod overrides)
cd ../../  # Project root
docker-compose -f infra/docker/docker-compose.yml up -d
```

## Management Commands

```bash
# View service status
./infra/docker/deploy.sh status

# View application logs
./infra/docker/deploy.sh logs

# Restart services
./infra/docker/deploy.sh restart

# Stop services
./infra/docker/deploy.sh stop

# Clean up (removes containers, volumes, images)
./infra/docker/deploy.sh cleanup
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `docker-compose.yml`
2. **Memory issues**: Increase Docker memory allocation
3. **Build failures**: Clear cache with `docker system prune`
4. **Database connection**: Check POSTGRES_HOST=postgres in .env

### Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Check database
docker-compose exec postgres pg_isready -U commercefull

# Check Redis
docker-compose exec redis redis-cli ping
```

### Logs

```bash
# Application logs
docker-compose -f infra/docker/docker-compose.yml logs -f app

# All services
docker-compose -f infra/docker/docker-compose.yml logs -f
```

## Security Considerations

- Generate unique secrets for production
- Use strong passwords for database and Redis
- Configure proper firewall rules
- Keep Docker and base images updated
- Use Docker secrets for sensitive data in production
- Enable audit logging if required

## Performance Tuning

### Application
- Resource limits set in `docker-compose.prod.yml`
- Compression enabled for responses
- Static asset caching (1 year)
- Health checks prevent serving unhealthy instances

### Database
- Connection pooling configured
- Persistent volumes for data durability
- UTF-8 encoding for internationalization

### Cache
- Redis memory limits prevent OOM
- Append-only file for persistence
- LRU eviction policy configured

## Backup & Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U commercefull commercefull > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U commercefull commercefull < backup.sql
```

### Volumes

Persistent data is stored in named volumes:
- `postgres_data` / `postgres_prod_data`
- `redis_data` / `redis_prod_data`

To backup volumes, use Docker volume commands or third-party tools.
