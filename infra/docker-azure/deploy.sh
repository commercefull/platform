#!/bin/bash
# CommerceFull Azure Terraform Deployment Script

set -euo pipefail

# Script configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Default values
ENVIRONMENT="${ENVIRONMENT:-prod}"
ACTION="${ACTION:-apply}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"
DESTROY="${DESTROY:-false}"
PLAN_ONLY="${PLAN_ONLY:-false}"

# Logging functions
log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*" >&2; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }
log_warn() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $*" >&2; }

# Usage function
usage() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS]

Deploy CommerceFull to Azure using Terraform

OPTIONS:
    -e, --environment ENV    Environment (dev|staging|prod) [default: prod]
    -a, --action ACTION      Terraform action (apply|plan|destroy) [default: apply]
    --auto-approve          Auto-approve Terraform changes
    --plan-only             Only show plan, don't apply
    --destroy               Destroy infrastructure
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    # Deploy to production
    $SCRIPT_NAME --environment prod

    # Plan deployment
    $SCRIPT_NAME --action plan --environment staging

    # Destroy infrastructure
    $SCRIPT_NAME --destroy --environment dev

    # Auto-approve production deployment
    $SCRIPT_NAME --environment prod --auto-approve

ENVIRONMENT VARIABLES:
    ARM_SUBSCRIPTION_ID     Azure Subscription ID
    ARM_TENANT_ID          Azure Tenant ID
    ARM_CLIENT_ID          Azure Client ID
    ARM_CLIENT_SECRET      Azure Client Secret

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
            --auto-approve)
                AUTO_APPROVE=true
                shift
                ;;
            --plan-only)
                PLAN_ONLY=true
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

    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform not found. Please install Terraform."
        exit 1
    fi

    # Check if az CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not found. Please install Azure CLI."
        exit 1
    fi

    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Run 'az login'"
        exit 1
    fi

    # Check terraform.tfvars
    if [[ ! -f "$TERRAFORM_DIR/terraform.tfvars" ]]; then
        log_error "terraform.tfvars not found. Please copy terraform.tfvars.example and configure it."
        exit 1
    fi

    log_info "Environment validation passed."
}

# Initialize Terraform
terraform_init() {
    log_info "Initializing Terraform..."

    cd "$TERRAFORM_DIR"

    if ! terraform init -upgrade; then
        log_error "Terraform init failed"
        exit 1
    fi

    log_info "Terraform initialized successfully."
}

# Run Terraform plan
terraform_plan() {
    log_info "Planning Terraform changes..."

    cd "$TERRAFORM_DIR"

    local plan_cmd=("terraform" "plan")

    if [[ "$DESTROY" == "true" ]]; then
        plan_cmd+=("-destroy")
    fi

    if [[ "$VERBOSE" == "true" ]]; then
        plan_cmd+=("-verbose")
    fi

    if ! "${plan_cmd[@]}"; then
        log_error "Terraform plan failed"
        exit 1
    fi

    log_info "Terraform plan completed."
}

# Apply Terraform changes
terraform_apply() {
    log_info "Applying Terraform changes..."

    cd "$TERRAFORM_DIR"

    local apply_cmd=("terraform" "apply")

    if [[ "$AUTO_APPROVE" == "true" ]]; then
        apply_cmd+=("-auto-approve")
    fi

    if [[ "$VERBOSE" == "true" ]]; then
        apply_cmd+=("-verbose")
    fi

    if ! "${apply_cmd[@]}"; then
        log_error "Terraform apply failed"
        exit 1
    fi

    log_info "Terraform apply completed."
}

# Destroy infrastructure
terraform_destroy() {
    log_warn "Destroying infrastructure..."

    cd "$TERRAFORM_DIR"

    if [[ "$AUTO_APPROVE" != "true" ]]; then
        log_warn "This will destroy all infrastructure!"
        read -p "Are you sure? Type 'yes' to continue: " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Destroy cancelled."
            exit 0
        fi
    fi

    if ! terraform destroy -auto-approve; then
        log_error "Terraform destroy failed"
        exit 1
    fi

    log_info "Infrastructure destroyed successfully."
}

# Build and push Docker image
build_and_push_image() {
    log_info "Building and pushing Docker image..."

    # Get container registry from terraform outputs
    cd "$TERRAFORM_DIR"

    # For now, assume ACR name - in production, get from terraform output
    local acr_name="commercefullacr"

    # Login to ACR
    az acr login --name "$acr_name"

    # Build image
    docker build -t "$acr_name.azurecr.io/commercefull:latest" "$PROJECT_ROOT"

    # Push image
    docker push "$acr_name.azurecr.io/commercefull:latest"

    log_info "Docker image built and pushed successfully."
}

# Run deployment
run_deployment() {
    case $ACTION in
        plan)
            terraform_init
            terraform_plan
            ;;
        apply)
            if [[ "$PLAN_ONLY" == "true" ]]; then
                terraform_init
                terraform_plan
            else
                terraform_init
                terraform_plan
                build_and_push_image
                terraform_apply
            fi
            ;;
        destroy)
            terraform_destroy
            ;;
        *)
            log_error "Unknown action: $ACTION"
            exit 1
            ;;
    esac
}

# Post-deployment tasks
post_deployment() {
    if [[ "$ACTION" == "apply" && "$PLAN_ONLY" != "true" ]]; then
        log_info "Running post-deployment tasks..."

        cd "$TERRAFORM_DIR"

        # Get outputs
        local container_app_url
        container_app_url=$(terraform output -raw container_app_url 2>/dev/null || echo "")

        local frontdoor_url
        frontdoor_url=$(terraform output -raw frontdoor_url 2>/dev/null || echo "")

        # Print deployment summary
        cat << EOF

🎉 CommerceFull Azure deployment completed successfully!

Deployment Details:
Environment: $ENVIRONMENT
Container App URL: ${container_app_url:-Not available}
Front Door URL: ${frontdoor_url:-Not available}

Next steps:
1. Update your DNS to point your domain to the Front Door endpoint
2. Configure your application environment variables
3. Set up monitoring and alerts
4. Test the application: curl https://yourdomain.com/health

Useful Azure commands:
- View container app: az containerapp show --name commercefull-app --resource-group commercefull-rg-prod
- View logs: az monitor app-insights query --app commercefull-appinsights-prod --analytics-query "requests | limit 10"
- Connect to database: az postgres flexible-server connect --name commercefull-db-prod

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
