export type HealthStatus = 'ok' | 'unavailable';
export type HealthCheckStatus = 'ok' | 'failed' | 'starting' | 'draining' | 'not_required';

export interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  checks: {
    startup: HealthCheckStatus;
    database?: HealthCheckStatus;
    redis?: HealthCheckStatus;
  };
}

interface HealthDependencies {
  checkDatabase: () => Promise<void>;
  checkRedis: () => Promise<void>;
  requiresRedis: boolean;
  timeoutMs?: number;
}

const withTimeout = (check: () => Promise<void>, timeoutMs: number): Promise<void> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Health check timed out')), timeoutMs);
    check().then(
      () => {
        clearTimeout(timeout);
        resolve();
      },
      error => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });

export function createHealthService(dependencies: HealthDependencies) {
  let started = false;
  let draining = false;

  return {
    markStarted(): void {
      started = true;
    },
    startDraining(): void {
      draining = true;
    },
    liveness(): HealthReport {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        checks: { startup: draining ? 'draining' : started ? 'ok' : 'starting' },
      };
    },
    async readiness(): Promise<HealthReport> {
      const startup = draining ? 'draining' : started ? 'ok' : 'starting';
      if (startup !== 'ok') {
        return { status: 'unavailable', timestamp: new Date().toISOString(), checks: { startup } };
      }

      const checks: HealthReport['checks'] = { startup, redis: dependencies.requiresRedis ? 'failed' : 'not_required' };
      const timeoutMs = dependencies.timeoutMs ?? 2_000;
      const results = await Promise.allSettled([
        withTimeout(dependencies.checkDatabase, timeoutMs),
        dependencies.requiresRedis ? withTimeout(dependencies.checkRedis, timeoutMs) : Promise.resolve(),
      ]);
      checks.database = results[0].status === 'fulfilled' ? 'ok' : 'failed';
      if (dependencies.requiresRedis) checks.redis = results[1].status === 'fulfilled' ? 'ok' : 'failed';
      const status = checks.database === 'ok' && checks.redis !== 'failed' ? 'ok' : 'unavailable';
      return { status, timestamp: new Date().toISOString(), checks };
    },
  };
}

export type HealthService = ReturnType<typeof createHealthService>;
