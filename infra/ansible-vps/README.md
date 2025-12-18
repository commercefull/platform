# Ansible VPS Deployment

Deploy CommerceFull platform to a VPS using Ansible for configuration management.

## Overview

This deployment strategy uses Ansible to provision and configure a VPS with:
- Ubuntu 22.04 LTS
- Node.js 18+
- PostgreSQL 18+
- Nginx reverse proxy
- SSL certificates (Let's Encrypt)
- Systemd services
- Log rotation
- Firewall configuration

## Prerequisites

### Local Machine
- Ansible 2.10+
- Python 3.8+
- SSH client
- Git

### VPS Requirements
- Ubuntu 22.04 LTS (fresh install)
- 2GB RAM minimum, 4GB recommended
- 2 CPU cores minimum
- 20GB storage minimum
- Root or sudo access
- SSH access enabled

### DNS
- Domain name pointing to VPS IP
- Ability to modify DNS records

## Quick Start

### 1. Prepare VPS
```bash
# On your VPS (as root)
apt update && apt upgrade -y
apt install -y python3 python3-pip openssh-server
# Create a non-root user
adduser deploy
usermod -aG sudo deploy
# Configure SSH key authentication
mkdir -p /home/deploy/.ssh
# Copy your public key to /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
```

### 2. Clone and Configure
```bash
# On your local machine
git clone <repository-url> commercefull
cd commercefull/infra/ansible-vps

# Copy and edit inventory
cp inventory.ini.example inventory.ini
vim inventory.ini

# Copy and edit variables
cp group_vars/all.yml.example group_vars/all.yml
vim group_vars/all.yml
```

### 3. Deploy
```bash
# Run deployment
ansible-playbook -i inventory.ini deploy.yml

# Or use the convenience script
./deploy.sh
```

## Configuration

### Inventory File (`inventory.ini`)

```ini
[commercefull]
your-vps-hostname ansible_host=YOUR_VPS_IP

[commercefull:vars]
ansible_user=deploy
ansible_ssh_private_key_file=~/.ssh/your-key
ansible_python_interpreter=/usr/bin/python3
```

### Variables (`group_vars/all.yml`)

```yaml
# Application
app_name: commercefull
app_domain: yourdomain.com
app_port: 3000

# Database
db_name: commercefull_prod
db_user: commercefull_user
db_password: "{{ vault_db_password }}"  # Use Ansible Vault

# SSL
ssl_email: admin@yourdomain.com

# Node.js
node_version: 18

# System
timezone: UTC
```

## Architecture

```
Internet
    ↓
[Nginx (SSL Termination)]
    ↓
[Node.js App (Port 3000)]
    ↓
[PostgreSQL (Local)]
```

## File Structure

```
ansible-vps/
├── README.md
├── deploy.sh                 # Convenience deployment script
├── inventory.ini.example     # Inventory template
├── group_vars/
│   └── all.yml.example       # Variables template
├── roles/
│   ├── common/              # System setup
│   ├── nodejs/              # Node.js installation
│   ├── postgresql/           # Database setup
│   ├── nginx/               # Web server config
│   ├── ssl/                 # SSL certificate setup
│   ├── app/                 # Application deployment
│   └── monitoring/          # Monitoring setup
├── templates/
│   ├── nginx.conf.j2        # Nginx configuration
│   ├── systemd.service.j2   # Systemd service
│   └── environment.j2       # Environment variables
├── deploy.yml               # Main playbook
├── requirements.yml         # Ansible Galaxy requirements
└── ansible.cfg              # Ansible configuration
```

## Detailed Setup

### 1. Domain Configuration

Before deployment, ensure your domain points to the VPS IP:

```bash
# Example DNS records
@     A     YOUR_VPS_IP
www   CNAME @
```

### 2. SSL Certificate Setup

The playbook automatically configures Let's Encrypt SSL certificates:

```yaml
# In group_vars/all.yml
ssl_email: admin@yourdomain.com
ssl_domains:
  - yourdomain.com
  - www.yourdomain.com
```

### 3. Database Configuration

PostgreSQL is configured with:
- Dedicated database user
- Password authentication
- Connection pooling (PgBouncer)
- Automated backups

**Note:** PostgreSQL 18 requires PostgreSQL's official repository as it's not yet available in Ubuntu 22.04 default repositories.

### 4. Application Deployment

The Node.js application is deployed as a systemd service:
- Automatic restarts on failure
- Log rotation
- Environment-specific configuration
- Process monitoring

## Maintenance

### Updates
```bash
# Update application
ansible-playbook -i inventory.ini deploy.yml --tags app

# Update system packages
ansible-playbook -i inventory.ini deploy.yml --tags system

# Renew SSL certificates
ansible-playbook -i inventory.ini deploy.yml --tags ssl
```

### Backups
```bash
# Manual database backup
ansible-playbook -i inventory.ini deploy.yml --tags backup

# View logs
ansible-playbook -i inventory.ini deploy.yml --tags logs
```

### Monitoring
```bash
# Check service status
ansible-playbook -i inventory.ini deploy.yml --tags status

# Restart services
ansible-playbook -i inventory.ini deploy.yml --tags restart
```

## Security

### Firewall
- UFW configured with minimal open ports
- SSH restricted to key-based authentication
- Fail2ban for brute force protection

### SSL/TLS
- A+ SSL rating with Let's Encrypt
- Automatic certificate renewal
- HSTS headers configured

### Database
- PostgreSQL running on local socket only
- Strong passwords required
- Connection encryption enabled

## Troubleshooting

### Common Issues

#### SSH Connection Failed
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/your-key
chmod 644 ~/.ssh/your-key.pub

# Test connection
ssh -i ~/.ssh/your-key deploy@YOUR_VPS_IP
```

#### SSL Certificate Issues
```bash
# Check certificate status
ansible-playbook -i inventory.ini deploy.yml --tags ssl-check

# Manual renewal
certbot renew --dry-run
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d commercefull_prod
```

#### Application Not Starting
```bash
# Check application logs
sudo journalctl -u commercefull -f

# Check Node.js process
sudo systemctl status commercefull
```

## Scaling

### Vertical Scaling
- Increase VPS resources (CPU, RAM)
- Update Ansible variables
- Redeploy configuration

### Horizontal Scaling
For multiple servers, consider:
- Load balancer (Nginx upstream)
- Shared database
- Session storage (Redis)
- File storage (S3-compatible)

## Cost Estimate

### Monthly Costs (USD)
- VPS: $12-24 (2GB RAM, 2 CPUs)
- Domain: $10-15/year
- SSL: Free (Let's Encrypt)
- **Total: ~$12-24/month**

### Scaling Costs
- 4GB RAM VPS: $24-48/month
- 8GB RAM VPS: $48-96/month
- Multiple servers: 2x-4x base cost

## Migration

### From Development to Production
```bash
# 1. Update environment variables
cp .env.production.example .env.production

# 2. Run deployment
cd infra/ansible-vps
ansible-playbook -i inventory.ini deploy.yml

# 3. Test application
curl https://yourdomain.com/health

# 4. Migrate database (if needed)
pg_dump local_db | ssh deploy@server "pg_restore -d commercefull_prod"
```

### Rollback
```bash
# Rollback application
ansible-playbook -i inventory.ini rollback.yml

# Rollback database
ansible-playbook -i inventory.ini deploy.yml --tags db-restore
```

This deployment strategy provides full control, cost-effectiveness, and is ideal for small to medium applications.
