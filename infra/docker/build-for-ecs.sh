#!/bin/bash
# Build Docker image for ECS deployment using the infra/docker Dockerfile

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get project root (assuming this script is in infra/docker/)
PROJECT_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
INFRA_DOCKER_DIR="$(cd "$(dirname "$0")" && pwd)"

# Get AWS account and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/commercefull"

print_info "Building Docker image for ECS deployment..."
print_info "Project root: $PROJECT_ROOT"
print_info "Infra docker dir: $INFRA_DOCKER_DIR"
print_info "ECR URI: $ECR_URI"

# Authenticate with ECR
print_info "Authenticating with ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build the image using the infra/docker Dockerfile
print_info "Building Docker image..."
docker build \
    --file "$INFRA_DOCKER_DIR/Dockerfile" \
    --tag "$ECR_URI:latest" \
    --tag "$ECR_URI:$(date +%Y%m%d-%H%M%S)" \
    "$PROJECT_ROOT"

# Push to ECR
print_info "Pushing image to ECR..."
docker push "$ECR_URI:latest"

print_success "Docker image built and pushed successfully!"
print_info "Image: $ECR_URI:latest"
print_info ""
print_info "You can now deploy using the ECS CDK:"
print_info "cd infra/ecs-aws && ./deploy.sh --environment prod"
