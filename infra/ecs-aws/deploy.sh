#!/bin/bash
# CommerceFull AWS CDK Deployment Script

set -euo pipefail

# Script configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CDK_DIR="$SCRIPT_DIR"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Default values
ENVIRONMENT="${ENVIRONMENT:-prod}"
ACTION="${ACTION:-deploy}"
CONTEXT="${CONTEXT:-CommerceFull-App}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"
DESTROY="${DESTROY:-false}"
DIFF_ONLY="${DIFF_ONLY:-false}"

# Logging functions
log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*" >&2; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }
log_warn() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $*" >&2; }

# Usage function
usage() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS]

Deploy CommerceFull to AWS using CDK

OPTIONS:
    -e, --environment ENV    Environment (dev|staging|prod) [default: prod]
    -a, --action ACTION      CDK action (deploy|destroy|diff|synth) [default: deploy]
    -c, --context CONTEXT    CDK context/stack name [default: CommerceFull-App]
    --auto-approve          Auto-approve CDK changes
    --diff-only             Only show diff, don't deploy
    --destroy               Destroy infrastructure
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    # Deploy to production
    $SCRIPT_NAME --environment prod

    # Show diff
    $SCRIPT_NAME --action diff --environment staging

    # Destroy infrastructure
    $SCRIPT_NAME --destroy --environment dev

    # Auto-approve production deployment
    $SCRIPT_NAME --environment prod --auto-approve

ENVIRONMENT VARIABLES:
    CDK_DEFAULT_ACCOUNT     AWS Account ID
    CDK_DEFAULT_REGION      AWS Region [default: us-east-1]
    CONTAINER_IMAGE         Docker image URL

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -a|--action)
                ACTION="$2"
                shift 2
                ;;
            -c|--context)
                CONTEXT="$2"
                shift 2
                ;;
            --auto-approve)
                AUTO_APPROVE=true
                shift
                ;;
            --diff-only)
                DIFF_ONLY=true
                shift
                ;;
            --destroy)
                DESTROY=true
                ACTION="destroy"
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    log_info "Validating deployment environment..."

    # Check if CDK is installed
    if ! command -v cdk &> /dev/null; then
        log_error "AWS CDK not found. Please install AWS CDK CLI."
        exit 1
    fi

    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure'"
        exit 1
    fi

    # Check if we're in the CDK directory
    if [[ ! -f "$CDK_DIR/package.json" ]]; then
        log_error "Not in CDK directory. Please run from the cdk directory."
        exit 1
    fi

    # Install dependencies if needed
    if [[ ! -d "$CDK_DIR/node_modules" ]]; then
        log_info "Installing dependencies..."
        cd "$CDK_DIR"
        npm install
    fi

    log_info "Environment validation passed."
}

# Build CDK project
build_cdk() {
    log_info "Building CDK project..."

    cd "$CDK_DIR"

    if ! npm run build; then
        log_error "CDK build failed"
        exit 1
    fi

    log_info "CDK build completed."
}

# Run CDK command
run_cdk_command() {
    local cdk_args=("$ACTION")

    # Add context/stack name
    cdk_args+=("$CONTEXT")

    # Add environment context
    cdk_args+=("--context" "environment=$ENVIRONMENT")

    # Add auto-approve for deploy
    if [[ "$ACTION" == "deploy" && "$AUTO_APPROVE" == "true" ]]; then
        cdk_args+=("--require-approval" "never")
    fi

    # Add verbose output
    if [[ "$VERBOSE" == "true" ]]; then
        cdk_args+=("--verbose")
    fi

    # Add domain name if provided
    if [[ -n "${DOMAIN_NAME:-}" ]]; then
        cdk_args+=("--context" "domainName=$DOMAIN_NAME")
    fi

    log_info "Running: cdk ${cdk_args[*]}"

    if ! cdk "${cdk_args[@]}"; then
        log_error "CDK command failed"
        exit 1
    fi
}

# Build and push Docker image
build_and_push_image() {
    log_info "Building and pushing Docker image using infra/docker setup..."

    # Use the infra/docker build script
    if [[ -f "$PROJECT_ROOT/infra/docker/build-for-ecs.sh" ]]; then
        "$PROJECT_ROOT/infra/docker/build-for-ecs.sh"
    else
        log_error "infra/docker/build-for-ecs.sh not found. Please ensure the Docker setup is complete."
        exit 1
    fi

    log_info "Docker image built and pushed successfully."
}

# Run deployment
run_deployment() {
    case $ACTION in
        deploy)
            build_cdk
            if [[ "$DIFF_ONLY" != "true" ]]; then
                build_and_push_image
            fi
            run_cdk_command
            ;;
        destroy)
            build_cdk
            run_cdk_command
            ;;
        diff|synth)
            build_cdk
            run_cdk_command
            ;;
        *)
            log_error "Unknown action: $ACTION"
            exit 1
            ;;
    esac
}

# Post-deployment tasks
post_deployment() {
    if [[ "$ACTION" == "deploy" && "$DIFF_ONLY" != "true" ]]; then
        log_info "Running post-deployment tasks..."

        # Get stack outputs
        local outputs
        outputs=$(cdk outputs "$CONTEXT" 2>/dev/null || echo "{}")

        # Extract useful information
        local cloudfront_url
        cloudfront_url=$(echo "$outputs" | grep -o '"CloudFrontURL":"[^"]*"' | cut -d'"' -f4 || echo "")

        local load_balancer_dns
        load_balancer_dns=$(echo "$outputs" | grep -o '"LoadBalancerDNS":"[^"]*"' | cut -d'"' -f4 || echo "")

        # Print deployment summary
        cat << EOF

🎉 CommerceFull AWS deployment completed successfully!

Deployment Details:
Environment: $ENVIRONMENT
CloudFront URL: ${cloudfront_url:-Not available}
Load Balancer DNS: ${load_balancer_dns:-Not available}

Next steps:
1. Update your DNS to point your domain to the CloudFront distribution
2. Configure your application environment variables in SSM Parameter Store
3. Set up monitoring and alerts in CloudWatch
4. Test the application: curl https://yourdomain.com/health

Useful AWS commands:
- View ECS service: aws ecs describe-services --cluster commercefull-cluster --services commercefull-service
- View CloudWatch logs: aws logs tail /ecs/commercefull-prod --follow
- Check load balancer: aws elbv2 describe-load-balancers --names commercefull-alb

For production deployments, consider:
- Setting up CloudWatch alarms for monitoring
- Configuring backup strategies for RDS
- Setting up auto-scaling based on traffic patterns
- Implementing WAF for security

EOF
    fi
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Script failed with exit code $exit_code"
    fi
}

# Main function
main() {
    parse_args "$@"
    validate_environment

    # Set up cleanup trap
    trap cleanup EXIT

    run_deployment
    post_deployment
}

# Run main function with all arguments
main "$@"
