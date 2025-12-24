# Commercefull - E-Commerce Platform

- **Mission statement:** Creating tailor made commerce solutions
- **Vision statement:** Empowering businesses to thrive in the digital marketplace through simple innovative and user-centric solutions
- **Value statement:** Simplicity, scalability, adaptability and agility when it truly matters

## Quick Start with Docker 🐳

### Production-Ready Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd commercefull/platform

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration (database, secrets, etc.)
# IMPORTANT: Generate strong random values for SESSION_SECRET, JWT secrets

# Deploy with Docker
./scripts/docker-deploy.sh

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose exec app yarn db:migrate

# Seed initial data (optional)
docker-compose exec app yarn db:seed
```

**Access the application:**
- **Admin Panel:** http://localhost:3000/admin
- **Storefront:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

### Development Setup

```bash
# Install dependencies
yarn install

# Copy environment file
cp .env.example .env

# Start PostgreSQL (Docker)
yarn db

# Run database migrations
yarn db:migrate

# Create initial admin user
yarn job:new:admin

# Start development server
yarn dev
```

## Docker Commands

```bash
# View service status
docker-compose ps

# View application logs
docker-compose logs -f app

# Access application container
docker-compose exec app sh

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Environment Configuration

Key environment variables (see `.env.example`):

```bash
# Application
PORT=3000
NODE_ENV=production
BASE_URL=http://localhost:3000

# Database
POSTGRES_HOST=postgres
POSTGRES_USER=commercefull
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=commercefull

# Security (Generate strong random values!)
SESSION_SECRET=<64-char-hex>
CUSTOMER_JWT_SECRET=<secure-secret>
MERCHANT_JWT_SECRET=<secure-secret>
COOKIE_SECRET=<secure-secret>
```

## Project Structure

```
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Development services
├── docker-compose.prod.yml    # Production overrides
├── scripts/
│   └── docker-deploy.sh       # Production deployment script
├── web/                       # Frontend applications
│   ├── admin/                # Admin panel (EJS templates)
│   ├── storefront/           # Customer-facing store
│   └── merchant/             # Merchant dashboard
├── modules/                   # Business logic modules
├── libs/                      # Shared utilities
└── migrations/               # Database migrations
```

## Features

- **Multi-tenant E-commerce Platform**
- **Admin Panel** with comprehensive management tools
- **Customer Storefront** with modern UI
- **Merchant Dashboard** for business management
- **B2B Capabilities** with company accounts
- **Payment Processing** (Stripe integration)
- **Order Management** with fulfillment tracking
- **Inventory Management** with stock tracking
- **Analytics & Reporting** with real-time insights
- **Multi-channel Sales** support
- **GDPR Compliance** features

## Technology Stack

- **Backend:** Node.js, TypeScript, Express.js
- **Database:** PostgreSQL
- **Cache:** Redis (optional)
- **Frontend:** EJS templates, Tailwind CSS
- **Payments:** Stripe
- **Email:** Mailjet
- **Deployment:** Docker, Docker Compose

## Development

```bash
# Install dependencies
yarn install

# Development server with hot reload
yarn dev

# Build for production
yarn prd:build

# Run tests
yarn test

# Database operations
yarn db:migrate
yarn db:seed
yarn db:rollback
```

## Documentation

- [Docker Setup Guide](./docs/DOCKER_SETUP.md)
- [API Documentation](./docs/)
- [Deployment Guides](./infra/)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

Apache-2.0
