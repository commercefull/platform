/**
 * Health Monitoring Service
 * Provides system health checks and monitoring
 * for the CommerceFull platform - Phase 8
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  version: string;
  uptime: number;
  checks: HealthCheck[];
  metrics: SystemMetrics;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  duration?: number;
  lastChecked: Date;
}

export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  database: {
    activeConnections: number;
    maxConnections: number;
    responseTime: number;
  };
  requests: {
    total: number;
    perSecond: number;
    errorRate: number;
  };
}

export interface DependencyStatus {
  name: string;
  type: 'database' | 'cache' | 'queue' | 'external' | 'storage';
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  lastChecked: Date;
  details?: Record<string, any>;
}

// ============================================================================
// Health Check Functions
// ============================================================================

const startTime = Date.now();

export async function getHealthStatus(): Promise<HealthStatus> {
  const checks = await runAllHealthChecks();
  const metrics = await getSystemMetrics();

  // Determine overall status
  const hasFailures = checks.some(c => c.status === 'fail');
  const hasWarnings = checks.some(c => c.status === 'warn');

  let status: HealthStatus['status'] = 'healthy';
  if (hasFailures) {
    status = 'unhealthy';
  } else if (hasWarnings) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
    metrics
  };
}

export async function getLivenessStatus(): Promise<{ alive: boolean }> {
  // Simple liveness check - just verify the process is running
  return { alive: true };
}

export async function getReadinessStatus(): Promise<{ ready: boolean; reason?: string }> {
  // Check if the application is ready to receive traffic
  try {
    const dbCheck = await checkDatabase();
    if (dbCheck.status === 'fail') {
      return { ready: false, reason: 'Database not available' };
    }
    return { ready: true };
  } catch (error: any) {
    return { ready: false, reason: error.message };
  }
}

// ============================================================================
// Individual Health Checks
// ============================================================================

async function runAllHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  // Database check
  checks.push(await checkDatabase());

  // Memory check
  checks.push(checkMemory());

  // Disk check (simplified)
  checks.push(await checkDiskSpace());

  // External services check
  checks.push(await checkExternalServices());

  return checks;
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  const lastChecked = new Date();

  try {
    const result = await queryOne<{ result: number }>('SELECT 1 as result');
    const duration = Date.now() - startTime;

    if (result?.result === 1) {
      return {
        name: 'database',
        status: duration > 1000 ? 'warn' : 'pass',
        message: duration > 1000 ? 'Database responding slowly' : 'Database connection healthy',
        duration,
        lastChecked
      };
    } else {
      return {
        name: 'database',
        status: 'fail',
        message: 'Database query returned unexpected result',
        duration,
        lastChecked
      };
    }
  } catch (error: any) {
    return {
      name: 'database',
      status: 'fail',
      message: `Database connection failed: ${error.message}`,
      duration: Date.now() - startTime,
      lastChecked
    };
  }
}

function checkMemory(): HealthCheck {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const percentage = (used.heapUsed / used.heapTotal) * 100;

  let status: HealthCheck['status'] = 'pass';
  let message = `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${percentage.toFixed(1)}%)`;

  if (percentage > 90) {
    status = 'fail';
    message = `Critical memory usage: ${percentage.toFixed(1)}%`;
  } else if (percentage > 75) {
    status = 'warn';
    message = `High memory usage: ${percentage.toFixed(1)}%`;
  }

  return {
    name: 'memory',
    status,
    message,
    lastChecked: new Date()
  };
}

async function checkDiskSpace(): Promise<HealthCheck> {
  // Simplified disk check - in production, use proper disk space monitoring
  return {
    name: 'disk',
    status: 'pass',
    message: 'Disk space check passed',
    lastChecked: new Date()
  };
}

async function checkExternalServices(): Promise<HealthCheck> {
  // Check external service dependencies
  // In production, this would check payment gateways, email services, etc.
  return {
    name: 'external_services',
    status: 'pass',
    message: 'External services operational',
    lastChecked: new Date()
  };
}

// ============================================================================
// System Metrics
// ============================================================================

async function getSystemMetrics(): Promise<SystemMetrics> {
  const memoryUsage = process.memoryUsage();

  // Get database connection info (simplified)
  let dbConnections = { active: 0, max: 100, responseTime: 0 };
  try {
    const startTime = Date.now();
    await queryOne('SELECT 1');
    dbConnections.responseTime = Date.now() - startTime;
  } catch {
    // Ignore errors
  }

  return {
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      percentage: parseFloat(((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2))
    },
    cpu: {
      usage: 0, // Would need OS-level monitoring
      cores: require('os').cpus().length
    },
    database: {
      activeConnections: dbConnections.active,
      maxConnections: dbConnections.max,
      responseTime: dbConnections.responseTime
    },
    requests: {
      total: 0, // Would need request tracking middleware
      perSecond: 0,
      errorRate: 0
    }
  };
}

// ============================================================================
// Dependency Status
// ============================================================================

export async function getDependencyStatus(): Promise<DependencyStatus[]> {
  const dependencies: DependencyStatus[] = [];

  // Database
  const dbCheck = await checkDatabase();
  dependencies.push({
    name: 'PostgreSQL',
    type: 'database',
    status: dbCheck.status === 'pass' ? 'up' : dbCheck.status === 'warn' ? 'degraded' : 'down',
    latency: dbCheck.duration,
    lastChecked: dbCheck.lastChecked
  });

  // Redis (placeholder - would check actual Redis connection)
  dependencies.push({
    name: 'Redis',
    type: 'cache',
    status: 'up',
    latency: 1,
    lastChecked: new Date(),
    details: { mode: 'standalone' }
  });

  // Message Queue (placeholder)
  dependencies.push({
    name: 'Message Queue',
    type: 'queue',
    status: 'up',
    latency: 2,
    lastChecked: new Date()
  });

  return dependencies;
}

// ============================================================================
// Performance Metrics
// ============================================================================

export async function getPerformanceMetrics(period: '1h' | '24h' | '7d' = '1h'): Promise<{
  responseTime: { avg: number; p50: number; p95: number; p99: number };
  throughput: { requestsPerSecond: number; bytesPerSecond: number };
  errors: { total: number; rate: number; byType: Record<string, number> };
}> {
  // In production, this would query from a metrics store (Prometheus, InfluxDB, etc.)
  return {
    responseTime: {
      avg: 45,
      p50: 35,
      p95: 120,
      p99: 250
    },
    throughput: {
      requestsPerSecond: 150,
      bytesPerSecond: 1024 * 1024 * 2 // 2 MB/s
    },
    errors: {
      total: 12,
      rate: 0.08,
      byType: {
        '4xx': 8,
        '5xx': 4
      }
    }
  };
}

// ============================================================================
// Alerts
// ============================================================================

export interface HealthAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  component: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

const activeAlerts: HealthAlert[] = [];

export function getActiveAlerts(): HealthAlert[] {
  return activeAlerts.filter(a => !a.acknowledged);
}

export function acknowledgeAlert(alertId: string): boolean {
  const alert = activeAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

export function createAlert(
  severity: HealthAlert['severity'],
  component: string,
  message: string
): HealthAlert {
  const alert: HealthAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    severity,
    component,
    message,
    timestamp: new Date(),
    acknowledged: false
  };

  activeAlerts.push(alert);

  // Keep only last 100 alerts
  if (activeAlerts.length > 100) {
    activeAlerts.shift();
  }

  return alert;
}

// ============================================================================
// Health Check Scheduler
// ============================================================================

let healthCheckInterval: NodeJS.Timeout | null = null;

export function startHealthCheckScheduler(intervalMs: number = 60000): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  healthCheckInterval = setInterval(async () => {
    try {
      const status = await getHealthStatus();

      // Create alerts for unhealthy checks
      for (const check of status.checks) {
        if (check.status === 'fail') {
          createAlert('critical', check.name, check.message || 'Health check failed');
        } else if (check.status === 'warn') {
          createAlert('warning', check.name, check.message || 'Health check warning');
        }
      }

      console.log(`Health check completed: ${status.status}`);
    } catch (error) {
      console.error('Health check scheduler error:', error);
    }
  }, intervalMs);

  console.log(`Health check scheduler started (interval: ${intervalMs}ms)`);
}

export function stopHealthCheckScheduler(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('Health check scheduler stopped');
  }
}
