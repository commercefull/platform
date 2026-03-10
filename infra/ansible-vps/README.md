# CommerceFull — Ansible VPS Infrastructure

Hardened Ansible infrastructure for deploying CommerceFull to a single VPS.

## Stack

| Component    | Version | Notes                              |
| ------------ | ------- | ---------------------------------- |
| Ubuntu       | 22.04+  | Fresh VPS with SSH access          |
| Node.js      | 22      | Via NodeSource repo                |
| PostgreSQL   | 18      | Via PGDG repo, scram-sha-256 auth  |
| Nginx        | Latest  | TLS 1.2/1.3, HSTS, rate limiting  |
| PM2          | Latest  | Process manager, auto-restart      |
| Yarn         | Latest  | Package manager                    |
| UFW          | -       | Firewall: SSH + HTTP + HTTPS only  |

## Architecture

```
Internet → Nginx (443/SSL) → Node.js (:3000 via PM2) → PostgreSQL (localhost)
                ↓
         Static files served from /home/ubuntu/app/public/
```

### Directory Layout on VPS

```
/home/ubuntu/
├── app → deployments/releases/20250101_120000/  (symlink)
├── deployments/
│   ├── releases/
│   │   ├── 20250101_120000/   ← release directories
│   │   └── 20250101_140000/
│   └── shared/
│       ├── .env               ← persistent environment config
│       ├── logs/              ← shared log directory
│       └── uploads/           ← shared upload directory
└── logs → deployments/shared/logs/  (symlink)
```

## Quick Start

### Prerequisites

- **Local**: Ansible 2.12+, SSH key pair
- **VPS**: Ubuntu 22.04+, SSH access with sudo

### 1. Configure

```bash
cd infra/ansible-vps

# Create inventory with your server IP
cp inventory.ini.example inventory.ini
# Edit: replace YOUR_SERVER_IP and key path

# Review variables
vim group_vars/all.yml
# Edit: domain_name, repo_url, repo_branch
```

### 2. Setup Server

```bash
# Full server setup (installs everything)
./deploy.sh setup

# Create database
./deploy.sh db:setup -e "db_password=your-secure-password"

# SSH to server and create the shared .env
ssh ubuntu@your-server
nano ~/deployments/shared/.env
# Add: DATABASE_URL, NODE_ENV, SESSION_SECRET, etc.
```

### 3. Deploy

```bash
# Zero-downtime deploy
./deploy.sh deploy

# Deploy with migrations
./deploy.sh deploy:migrate
```

## Commands

All operations use `./deploy.sh` or direct `ansible-playbook` calls:

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `./deploy.sh setup`   | Full server setup                          |
| `./deploy.sh deploy`  | Zero-downtime deployment                   |
| `./deploy.sh deploy:migrate` | Deploy + run DB migrations          |
| `./deploy.sh rollback`| Rollback to previous release               |
| `./deploy.sh backup`  | Backup DB + files to local machine         |
| `./deploy.sh restore` | Restore DB and/or files from backup        |
| `./deploy.sh update`  | System apt upgrade + reboot if needed      |
| `./deploy.sh restart` | Restart PM2 + Nginx                        |
| `./deploy.sh db:setup`| One-time database & user creation          |

### Direct Ansible Examples

```bash
# Deploy a specific branch
ansible-playbook playbooks/deploy.yml -e "repo_branch=develop"

# Backup database only
ansible-playbook playbooks/backup.yml --tags backup-db

# Rollback to a specific release
ansible-playbook playbooks/rollback.yml -e "target_release=20250101_120000"

# Restore from local backup file
ansible-playbook playbooks/restore.yml \
  -e "restore_db_file=backups/2025-01-01/commercefull-db_2025-01-01_1130.sql.gz" \
  -e "restore_files=false"

# Skip reboot during update
ansible-playbook playbooks/update.yml --skip-tags reboot
```

## File Structure

```
ansible-vps/
├── ansible.cfg              # Ansible config (yaml output, fact caching)
├── deploy.sh                # Convenience wrapper script
├── inventory.ini.example    # Inventory template
├── group_vars/
│   ├── all.yml              # Global variables (tracked)
│   └── vps.yml              # Host-specific overrides
├── playbooks/
│   ├── site.yml             # Full server setup
│   ├── deploy.yml           # Zero-downtime deployment
│   ├── db-setup.yml         # Database creation
│   ├── rollback.yml         # Release rollback
│   ├── backup.yml           # DB + file backup
│   ├── restore.yml          # DB + file restore
│   ├── update.yml           # System update + reboot
│   └── restart.yml          # Service restart
└── roles/
    ├── common/              # Base system, SSH hardening
    ├── nodejs/              # Node.js 22, PM2, Yarn
    ├── postgresql/          # PostgreSQL 18, security config
    ├── nginx/               # Nginx, full config template, SSL
    ├── firewall/            # UFW firewall rules
    ├── db-setup/            # One-time DB + user creation
    ├── deploy/              # Zero-downtime deploy pipeline
    │   └── tasks/
    │       ├── setup_dirs.yml
    │       ├── clone.yml
    │       ├── shared.yml
    │       ├── build.yml
    │       ├── migrate.yml
    │       ├── swap.yml     # Atomic symlink swap
    │       ├── restart.yml
    │       ├── health.yml
    │       └── cleanup.yml
    ├── rollback/            # Release rollback with confirmation
    ├── backup/              # DB dump + file archive + local fetch
    └── restore/             # Upload + restore + restart
```

## Security Hardening

### SSH
- Password authentication **disabled**
- Root login **disabled**
- Empty passwords **disabled**
- Max auth tries: **3**

### PostgreSQL
- Listens on **127.0.0.1 only** (no external access)
- Password encryption: **scram-sha-256**
- Default trust rules **removed**
- App user has minimal required privileges

### Nginx
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- HSTS with 2-year max-age, includeSubDomains, preload
- TLS 1.2 + 1.3 only, modern cipher suite
- Rate limiting on admin endpoints
- Hidden files denied
- `server_tokens off`

### Firewall (UFW)
- Default: **deny all incoming**, allow all outgoing
- Allowed: SSH, HTTP (80), HTTPS (443)
- Logging enabled

## Deployment Flow

The deploy role performs these steps in order:

1. **setup_dirs** — Create `releases/`, `shared/` directories; generate timestamp
2. **clone** — Shallow git clone into new release directory; save RELEASE.json
3. **shared** — Copy `.env`, symlink `uploads/` and `logs/`
4. **build** — `yarn install` + `yarn prd:build` + `yarn css:build`
5. **migrate** — `yarn db:migrate` (only if `-e "run_migrations=true"`)
6. **swap** — Atomic symlink swap: `~/app` → new release
7. **restart** — PM2 restart with `--update-env`, save process list
8. **health** — Wait for port + HTTP health check
9. **cleanup** — Remove old releases (keep last 5)

## Backup & Restore

### Backup

Backups are fetched to your **local machine** and cleaned from the server:

```bash
./deploy.sh backup                              # Full backup
./deploy.sh backup --tags backup-db             # Database only
./deploy.sh backup --tags backup-files          # Files only
```

Local backups are stored in `backups/YYYY-MM-DD/` with 30-day retention.

### Restore

Restores upload from your local machine to the server:

```bash
# Restore database
./deploy.sh restore -e "restore_db_file=backups/2025-01-01/db.sql.gz" -e "restore_files=false"

# Restore files
./deploy.sh restore -e "restore_files_file=backups/2025-01-01/files.tar.gz" -e "restore_database=false"
```

Restore stops the app, drops/recreates the DB, restores, re-grants permissions, and restarts.

## Ansible Vault

For sensitive values (db_password, API keys):

```bash
# Encrypt a password
ansible-vault encrypt_string 'my-secret-password' --name 'db_password'

# Add to group_vars/vault.yml (gitignored)
# Reference in playbooks: {{ db_password }}

# Run with vault
ansible-playbook playbooks/deploy.yml --ask-vault-pass
# Or with password file
ansible-playbook playbooks/deploy.yml --vault-password-file .vault_pass
```

## Troubleshooting

```bash
# Check PM2 status
ssh ubuntu@server "pm2 list"

# View app logs
ssh ubuntu@server "pm2 logs"

# Check nginx config
ssh ubuntu@server "sudo nginx -t"

# Check PostgreSQL
ssh ubuntu@server "sudo -u postgres psql -l"

# View current release
ssh ubuntu@server "readlink ~/app"

# List all releases
ssh ubuntu@server "ls -la ~/deployments/releases/"
```
