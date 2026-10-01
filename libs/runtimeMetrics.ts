import { monitorEventLoopDelay } from 'perf_hooks';

const durationBuckets = [25, 50, 100, 250, 500, 1_000, 2_500, 5_000];
const requests = new Map<string, number>();
const durations = new Map<string, number[]>();
const durationSums = new Map<string, number>();
const cacheOperations = new Map<string, number>();
const scheduledJobs = new Map<string, { success: number; failure: number; durationMs: number }>();
const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
eventLoopDelay.enable();

const surfaceForPath = (path: string): string => {
  if (path === '/health' || path === '/live' || path === '/ready' || path === '/metrics') return 'operational';
  if (path.startsWith('/customer')) return 'customer';
  if (path.startsWith('/business')) return 'business';
  if (path.startsWith('/admin')) return 'admin';
  return 'storefront';
};

const statusClass = (status: number): string => `${Math.floor(status / 100)}xx`;
const labels = (method: string, surface: string, status: string): string => `method="${method}",surface="${surface}",status="${status}"`;

export function observeHttpRequest(method: string, path: string, status: number, durationMs: number): void {
  const key = labels(method, surfaceForPath(path), statusClass(status));
  requests.set(key, (requests.get(key) ?? 0) + 1);
  const values = durations.get(key) ?? durationBuckets.map(() => 0);
  durationBuckets.forEach((bucket, index) => {
    if (durationMs <= bucket) values[index]++;
  });
  durations.set(key, values);
  durationSums.set(key, (durationSums.get(key) ?? 0) + durationMs);
}

export function observeCache(backend: 'memory' | 'redis', outcome: 'hit' | 'miss' | 'error'): void {
  const key = `backend="${backend}",outcome="${outcome}"`;
  cacheOperations.set(key, (cacheOperations.get(key) ?? 0) + 1);
}

export function observeScheduledJob(jobId: string, success: boolean, durationMs: number): void {
  const current = scheduledJobs.get(jobId) ?? { success: 0, failure: 0, durationMs: 0 };
  current[success ? 'success' : 'failure']++;
  current.durationMs += durationMs;
  scheduledJobs.set(jobId, current);
}

export function resetRuntimeMetrics(): void {
  requests.clear();
  durations.clear();
  durationSums.clear();
  cacheOperations.clear();
  scheduledJobs.clear();
  eventLoopDelay.reset();
}

export function renderRuntimeMetrics(pool: { total: number; idle: number; waiting: number }): string {
  const lines = [
    '# TYPE commercefull_http_requests_total counter',
    ...[...requests.entries()].map(([key, value]) => `commercefull_http_requests_total{${key}} ${value}`),
    '# TYPE commercefull_http_request_duration_milliseconds histogram',
  ];
  for (const [key, values] of durations) {
    durationBuckets.forEach((bucket, index) =>
      lines.push(`commercefull_http_request_duration_milliseconds_bucket{${key},le="${bucket}"} ${values[index]}`),
    );
    const count = requests.get(key) ?? 0;
    lines.push(
      `commercefull_http_request_duration_milliseconds_bucket{${key},le="+Inf"} ${count}`,
      `commercefull_http_request_duration_milliseconds_sum{${key}} ${durationSums.get(key) ?? 0}`,
      `commercefull_http_request_duration_milliseconds_count{${key}} ${count}`,
    );
  }
  lines.push('# TYPE commercefull_cache_operations_total counter');
  for (const [key, value] of cacheOperations) lines.push(`commercefull_cache_operations_total{${key}} ${value}`);
  lines.push('# TYPE commercefull_scheduled_job_runs_total counter');
  for (const [jobId, values] of scheduledJobs) {
    lines.push(
      `commercefull_scheduled_job_runs_total{job="${jobId}",outcome="success"} ${values.success}`,
      `commercefull_scheduled_job_runs_total{job="${jobId}",outcome="failure"} ${values.failure}`,
      `commercefull_scheduled_job_duration_milliseconds_sum{job="${jobId}"} ${values.durationMs}`,
      `commercefull_scheduled_job_duration_milliseconds_count{job="${jobId}"} ${values.success + values.failure}`,
    );
  }
  const memory = process.memoryUsage();
  lines.push(
    '# TYPE commercefull_db_pool_total gauge',
    `commercefull_db_pool_total ${pool.total}`,
    '# TYPE commercefull_db_pool_idle gauge',
    `commercefull_db_pool_idle ${pool.idle}`,
    '# TYPE commercefull_db_pool_waiting gauge',
    `commercefull_db_pool_waiting ${pool.waiting}`,
    '# TYPE commercefull_process_resident_memory_bytes gauge',
    `commercefull_process_resident_memory_bytes ${memory.rss}`,
    '# TYPE commercefull_process_heap_used_bytes gauge',
    `commercefull_process_heap_used_bytes ${memory.heapUsed}`,
    '# TYPE commercefull_event_loop_delay_mean_milliseconds gauge',
    `commercefull_event_loop_delay_mean_milliseconds ${Number.isNaN(eventLoopDelay.mean) ? 0 : eventLoopDelay.mean / 1e6}`,
    '# TYPE commercefull_event_loop_delay_max_milliseconds gauge',
    `commercefull_event_loop_delay_max_milliseconds ${eventLoopDelay.max / 1e6}`,
  );
  return lines.join('\n') + '\n';
}
