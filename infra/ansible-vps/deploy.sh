#!/bin/bash
# ===========================================
# CommerceFull - Ansible Deployment Wrapper
# ===========================================
# Quick shortcuts for common operations.
# All commands run from the infra/ansible-vps directory.
#
# Usage:
#   ./deploy.sh setup            # Full server setup
#   ./deploy.sh deploy           # Zero-downtime deploy
#   ./deploy.sh deploy:migrate   # Deploy + run migrations
#   ./deploy.sh rollback         # Rollback to previous release
#   ./deploy.sh backup           # Backup DB + files
#   ./deploy.sh restore          # Restore from backup
#   ./deploy.sh update           # System update + reboot
#   ./deploy.sh restart          # Restart PM2 + Nginx
#   ./deploy.sh db:setup         # One-time database setup
# ===========================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { echo "[$(date +'%H:%M:%S')] $*"; }

# Validate prerequisites
if ! command -v ansible-playbook &> /dev/null; then
    echo "ERROR: ansible-playbook not found. Install Ansible first."
    exit 1
fi

if [[ ! -f "$SCRIPT_DIR/inventory.ini" ]]; then
    echo "ERROR: inventory.ini not found. Copy inventory.ini.example and configure it."
    exit 1
fi

run_playbook() {
    local playbook="$1"
    shift
    log "Running: ansible-playbook playbooks/$playbook $*"
    cd "$SCRIPT_DIR"
    ansible-playbook "playbooks/$playbook" "$@"
}

case "${1:-help}" in
    setup)
        run_playbook site.yml "${@:2}"
        ;;
    deploy)
        run_playbook deploy.yml "${@:2}"
        ;;
    deploy:migrate)
        run_playbook deploy.yml -e "run_migrations=true" "${@:2}"
        ;;
    rollback)
        run_playbook rollback.yml "${@:2}"
        ;;
    backup)
        run_playbook backup.yml "${@:2}"
        ;;
    restore)
        run_playbook restore.yml "${@:2}"
        ;;
    update)
        run_playbook update.yml "${@:2}"
        ;;
    restart)
        run_playbook restart.yml "${@:2}"
        ;;
    db:setup)
        run_playbook db-setup.yml "${@:2}"
        ;;
    help|--help|-h)
        cat << 'EOF'
CommerceFull Ansible VPS Deployment

Usage: ./deploy.sh <command> [ansible-options...]

Commands:
  setup            Full server setup (common, nodejs, postgres, nginx, firewall)
  deploy           Zero-downtime deployment
  deploy:migrate   Deploy with database migrations
  rollback         Rollback to previous release
  backup           Backup database and files to local machine
  restore          Restore database and/or files from backup
  update           System update and reboot
  restart          Restart PM2 and Nginx
  db:setup         One-time database & user creation

Examples:
  ./deploy.sh setup
  ./deploy.sh deploy -e "repo_branch=develop"
  ./deploy.sh deploy:migrate
  ./deploy.sh rollback -e "auto_confirm=true"
  ./deploy.sh backup --tags backup-db
  ./deploy.sh restore -e "restore_db_file=backups/2025-01-01/db.sql.gz"
  ./deploy.sh db:setup -e "db_password=secret"

All extra arguments are passed directly to ansible-playbook.
EOF
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run './deploy.sh help' for usage."
        exit 1
        ;;
esac
