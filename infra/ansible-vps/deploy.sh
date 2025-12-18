#!/bin/bash
# CommerceFull Ansible Deployment Script
# Automates the deployment process for VPS infrastructure

set -euo pipefail

# Script configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANSIBLE_DIR="$(cd "$SCRIPT_DIR" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Default values
ENVIRONMENT="${ENVIRONMENT:-prod}"
INVENTORY_FILE="${INVENTORY_FILE:-inventory.ini}"
PLAYBOOK="${PLAYBOOK:-playbooks/deploy.yml}"
TAGS="${TAGS:-all}"
SKIP_TAGS="${SKIP_TAGS:-}"
VERBOSE="${VERBOSE:-false}"
DRY_RUN="${DRY_RUN:-false}"
CHECK_MODE="${CHECK_MODE:-false}"

# Logging functions
log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*" >&2; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }
log_warn() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $*" >&2; }

# Usage function
usage() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS]

Deploy CommerceFull to VPS using Ansible

OPTIONS:
    -e, --environment ENV    Deployment environment (dev|staging|prod) [default: prod]
    -i, --inventory FILE     Inventory file [default: inventory.ini]
    -p, --playbook FILE      Playbook file [default: playbooks/deploy.yml]
    -t, --tags TAGS          Run only tasks with these tags [default: all]
    --skip-tags TAGS         Skip tasks with these tags
    -v, --verbose            Enable verbose output
    --dry-run                Show what would be done without making changes
    --check                  Run in check mode (dry run)
    --diff                   Show differences
    -h, --help               Show this help message

EXAMPLES:
    # Deploy to production
    $SCRIPT_NAME --environment prod

    # Deploy only database
    $SCRIPT_NAME --tags database

    # Dry run deployment
    $SCRIPT_NAME --dry-run --verbose

    # Check mode with diff
    $SCRIPT_NAME --check --diff

ENVIRONMENT VARIABLES:
    ANSIBLE_CONFIG        Path to ansible.cfg [default: ./ansible.cfg]
    ANSIBLE_INVENTORY     Path to inventory file
    ANSIBLE_VAULT_PASSWORD_FILE  Path to vault password file

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
            -i|--inventory)
                INVENTORY_FILE="$2"
                shift 2
                ;;
            -p|--playbook)
                PLAYBOOK="$2"
                shift 2
                ;;
            -t|--tags)
                TAGS="$2"
                shift 2
                ;;
            --skip-tags)
                SKIP_TAGS="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --check)
                CHECK_MODE=true
                shift
                ;;
            --diff)
                DIFF=true
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

    # Check if we're in the ansible directory
    if [[ ! -f "$ANSIBLE_DIR/ansible.cfg" ]]; then
        log_error "Not in Ansible directory. Please run from the ansible-vps directory."
        exit 1
    fi

    # Check Ansible installation
    if ! command -v ansible-playbook &> /dev/null; then
        log_error "Ansible not found. Please install Ansible."
        exit 1
    fi

    # Check inventory file
    if [[ ! -f "$ANSIBLE_DIR/$INVENTORY_FILE" ]]; then
        log_error "Inventory file not found: $ANSIBLE_DIR/$INVENTORY_FILE"
        if [[ "$INVENTORY_FILE" == "inventory.ini" ]]; then
            log_error "Please copy inventory.ini.example to inventory.ini and configure it."
        fi
        exit 1
    fi

    # Check playbook file
    if [[ ! -f "$ANSIBLE_DIR/$PLAYBOOK" ]]; then
        log_error "Playbook file not found: $ANSIBLE_DIR/$PLAYBOOK"
        exit 1
    fi

    # Check group_vars
    if [[ ! -f "$ANSIBLE_DIR/group_vars/all.yml" ]]; then
        log_error "Group variables not found: $ANSIBLE_DIR/group_vars/all.yml"
        log_error "Please copy group_vars/all.yml.example to group_vars/all.yml and configure it."
        exit 1
    fi

    log_info "Environment validation passed."
}

# Build Ansible command
build_ansible_command() {
    local cmd=("ansible-playbook")

    # Add playbook
    cmd+=("$PLAYBOOK")

    # Add inventory
    cmd+=("-i" "$INVENTORY_FILE")

    # Add tags
    if [[ "$TAGS" != "all" ]]; then
        cmd+=("--tags" "$TAGS")
    fi

    # Add skip tags
    if [[ -n "$SKIP_TAGS" ]]; then
        cmd+=("--skip-tags" "$SKIP_TAGS")
    fi

    # Add verbosity
    if [[ "$VERBOSE" == "true" ]]; then
        cmd+=("-vvv")
    fi

    # Add dry run
    if [[ "$DRY_RUN" == "true" ]]; then
        cmd+=("--check" "--diff")
    fi

    # Add check mode
    if [[ "$CHECK_MODE" == "true" ]]; then
        cmd+=("--check")
    fi

    # Add diff
    if [[ "$DIFF" == "true" ]]; then
        cmd+=("--diff")
    fi

    echo "${cmd[@]}"
}

# Run deployment
run_deployment() {
    log_info "Starting CommerceFull deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Inventory: $INVENTORY_FILE"
    log_info "Playbook: $PLAYBOOK"
    log_info "Tags: $TAGS"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN MODE - No changes will be made"
    fi

    local ansible_cmd
    ansible_cmd=$(build_ansible_command)

    log_info "Running: $ansible_cmd"

    # Change to ansible directory
    cd "$ANSIBLE_DIR"

    # Run Ansible
    if ! $ansible_cmd; then
        log_error "Deployment failed!"
        exit 1
    fi

    log_info "Deployment completed successfully!"
}

# Post-deployment tasks
post_deployment() {
    log_info "Running post-deployment tasks..."

    # Print deployment summary
    cat << EOF

🎉 CommerceFull deployment completed successfully!

Next steps:
1. Update your DNS to point your domain to the VPS IP address
2. Verify the application is running: https://yourdomain.com/health
3. Configure monitoring and alerts
4. Set up regular backups
5. Review security settings

Useful commands:
- View application logs: sudo journalctl -u $APP_NAME -f
- Restart application: sudo systemctl restart $APP_NAME
- Check database: sudo -u postgres psql -d $DB_NAME

For troubleshooting, check the Ansible log file: ./ansible.log

EOF
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Script failed with exit code $exit_code"
        log_error "Check the Ansible log file for details: $ANSIBLE_DIR/ansible.log"
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
