import { observeCache, observeHttpRequest, observeScheduledJob, renderRuntimeMetrics, resetRuntimeMetrics } from './runtimeMetrics';

describe('runtimeMetrics', () => {
  beforeEach(() => resetRuntimeMetrics());

  it('should aggregate requests using bounded surface labels', () => {
    observeHttpRequest('GET', '/customer/products/abc', 200, 42);
    observeHttpRequest('GET', '/customer/products/xyz', 404, 75);
    observeCache('redis', 'hit');
    observeScheduledJob('inventory-cleanup', true, 12);

    const metrics = renderRuntimeMetrics({ total: 4, idle: 2, waiting: 1 });
    expect(metrics).toContain('commercefull_http_requests_total{method="GET",surface="customer",status="2xx"} 1');
    expect(metrics).toContain('commercefull_http_requests_total{method="GET",surface="customer",status="4xx"} 1');
    expect(metrics).toContain('commercefull_db_pool_waiting 1');
    expect(metrics).toContain('commercefull_cache_operations_total{backend="redis",outcome="hit"} 1');
    expect(metrics).toContain('commercefull_scheduled_job_runs_total{job="inventory-cleanup",outcome="success"} 1');
    expect(metrics).not.toContain('/customer/products/abc');
  });
});
