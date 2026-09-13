/**
 * PM2 Process Configuration for CommerceFull
 * Used by Ansible VPS deployment (infra/vps/roles/deploy/tasks/restart.yml)
 *
 * Usage:
 *   pm2 start pm2.config.js
 *   pm2 restart pm2.config.js --update-env
 *   pm2 save
 */

module.exports = {
  apps: [
    {
      name: 'commercefull',
      script: './app.mjs',
      node_args: '--env-file=.env',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      env_staging: {
        NODE_ENV: 'staging',
      },
      env_development: {
        NODE_ENV: 'development',
      },
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: false,
      // Restart policy
      max_restarts: 10,
      min_uptime: '10s',
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Watch (disabled in production — Ansible handles restarts)
      watch: false,
    },
  ],
};
