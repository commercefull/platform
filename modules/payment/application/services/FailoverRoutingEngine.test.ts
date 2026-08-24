/**
 * Failover Routing Engine Tests
 */

import { FailoverRoutingEngine } from './FailoverRoutingEngine';
import {
  PSPAdapter, PSPCapabilities, PSPConfig, WebhookEvent,
  PaymentRequest, PaymentResponse, CaptureRequest, CaptureResponse,
  VoidRequest, VoidResponse, RefundRequest, RefundResponse, HealthCheckResult,
} from './GatewayAdapter';

class MockPSPAdapter implements PSPAdapter {
  readonly provider: string;
  readonly capabilities: PSPCapabilities;
  public shouldFail = false;
  public shouldThrow = false;
  public latencyMs = 10;
  public healthResult: HealthCheckResult = { healthy: true };

  constructor(provider: string, caps?: Partial<PSPCapabilities>) {
    this.provider = provider;
    this.capabilities = {
      supportsAuthCapture: true,
      supportsPartialCapture: true,
      supportsPartialRefund: true,
      supportsVoid: true,
      requiresRedirect: false,
      supportsTokenization: true,
      supportsWebhooks: true,
      supportedCurrencies: [],
      supportedCountries: [],
      ...caps,
    };
  }

  verifySignature(): boolean { return true; }
  normalize(): WebhookEvent | null { return null; }

  async initiatePayment(request: PaymentRequest, _config: PSPConfig): Promise<PaymentResponse> {
    if (this.shouldThrow) throw new Error(`${this.provider} network error`);
    await new Promise(r => setTimeout(r, this.latencyMs));
    if (this.shouldFail) {
      return {
        success: false,
        externalTransactionId: '',
        status: 'failed',
        gatewayResponse: {},
        errorCode: 'stripe_error',
        errorMessage: `${this.provider} payment failed`,
      };
    }
    return {
      success: true,
      externalTransactionId: `${this.provider}_tx_${request.orderId}`,
      status: 'authorized',
      gatewayResponse: { provider: this.provider },
    };
  }

  async capturePayment(req: CaptureRequest, _config: PSPConfig): Promise<CaptureResponse> {
    return { success: true, externalTransactionId: req.externalTransactionId, gatewayResponse: {} };
  }

  async voidPayment(req: VoidRequest, _config: PSPConfig): Promise<VoidResponse> {
    return { success: true, externalTransactionId: req.externalTransactionId, gatewayResponse: {} };
  }

  async refundPayment(_req: RefundRequest, _config: PSPConfig): Promise<RefundResponse> {
    return { success: true, externalRefundId: 'refund_1', gatewayResponse: {} };
  }

  async checkHealth(_config: PSPConfig): Promise<HealthCheckResult> {
    return this.healthResult;
  }
}

const mockConfig: PSPConfig = {
  apiKey: 'test_key',
  webhookSecret: 'test_secret',
  testMode: true,
};

describe('FailoverRoutingEngine', () => {
  let engine: FailoverRoutingEngine;
  let primary: MockPSPAdapter;
  let secondary: MockPSPAdapter;

  beforeEach(() => {
    primary = new MockPSPAdapter('primary');
    secondary = new MockPSPAdapter('secondary');
    engine = new FailoverRoutingEngine({
      maxRetriesPerProvider: 1,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      circuitBreakerThreshold: 3,
      circuitBreakerResetMs: 1000,
      healthCheckIntervalMs: 0,
    });
  });

  const paymentRequest: PaymentRequest = {
    orderId: 'order_1',
    amount: 100,
    currency: 'USD',
  };

  it('should route to the highest priority provider', async () => {
    engine.registerRoutes([
      { provider: 'primary', adapter: primary, config: mockConfig, priority: 1 },
      { provider: 'secondary', adapter: secondary, config: mockConfig, priority: 2 },
    ]);

    const result = await engine.routePayment(paymentRequest);

    expect(result.response.success).toBe(true);
    expect(result.provider).toBe('primary');
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].provider).toBe('primary');
  });

  it('should failover to secondary when primary fails', async () => {
    primary.shouldFail = true;
    engine.registerRoutes([
      { provider: 'primary', adapter: primary, config: mockConfig, priority: 1 },
      { provider: 'secondary', adapter: secondary, config: mockConfig, priority: 2 },
    ]);

    const result = await engine.routePayment(paymentRequest);

    expect(result.response.success).toBe(true);
    expect(result.provider).toBe('secondary');
    expect(result.attempts.length).toBeGreaterThan(1);
  });

  it('should retry on retryable errors before failing over', async () => {
    primary.shouldFail = true;
    engine.registerRoutes([
      { provider: 'primary', adapter: primary, config: mockConfig, priority: 1 },
      { provider: 'secondary', adapter: secondary, config: mockConfig, priority: 2 },
    ]);

    const result = await engine.routePayment(paymentRequest);

    // Primary should have been tried twice (1 retry), then failover to secondary
    const primaryAttempts = result.attempts.filter(a => a.provider === 'primary');
    expect(primaryAttempts).toHaveLength(2);
    expect(primaryAttempts[0].retried).toBe(false);
    expect(primaryAttempts[1].retried).toBe(true);
  });

  it('should failover when primary throws an exception', async () => {
    primary.shouldThrow = true;
    engine.registerRoutes([
      { provider: 'primary', adapter: primary, config: mockConfig, priority: 1 },
      { provider: 'secondary', adapter: secondary, config: mockConfig, priority: 2 },
    ]);

    const result = await engine.routePayment(paymentRequest);

    expect(result.response.success).toBe(true);
    expect(result.provider).toBe('secondary');
  });

  it('should return failure when all providers fail', async () => {
    primary.shouldFail = true;
    secondary.shouldFail = true;
    engine.registerRoutes([
      { provider: 'primary', adapter: primary, config: mockConfig, priority: 1 },
      { provider: 'secondary', adapter: secondary, config: mockConfig, priority: 2 },
    ]);

    const result = await engine.routePayment(paymentRequest);

    expect(result.response.success).toBe(false);
    expect(result.provider).toBe('none');
    expect(result.attempts.length).toBeGreaterThan(0);
  });

  it('should trip circuit breaker after threshold failures', async () => {
    primary.shouldThrow = true;
    engine.registerRoutes([
      { provider: 'primary', adapter: primary, config: mockConfig, priority: 1 },
      { provider: 'secondary', adapter: secondary, config: mockConfig, priority: 2 },
    ]);

    // First call: failover to secondary (records 1 failure for primary)
    await engine.routePayment(paymentRequest);
    // Second call: failover again (records 2nd failure)
    await engine.routePayment(paymentRequest);
    // Third call: failover again (records 3rd failure — trips circuit breaker)
    await engine.routePayment(paymentRequest);

    const health = engine.getProviderHealth();
    const primaryHealth = health.find(h => h.provider === 'primary');
    expect(primaryHealth?.tripped).toBe(true);

    // Fourth call: primary should be skipped (circuit breaker tripped)
    primary.shouldThrow = false;
    const result = await engine.routePayment(paymentRequest);
    expect(result.provider).toBe('secondary');
  });

  it('should reset circuit breaker manually', async () => {
    primary.shouldThrow = true;
    engine.registerRoutes([
      { provider: 'primary', adapter: primary, config: mockConfig, priority: 1 },
      { provider: 'secondary', adapter: secondary, config: mockConfig, priority: 2 },
    ]);

    // Trip the circuit breaker
    await engine.routePayment(paymentRequest);
    await engine.routePayment(paymentRequest);
    await engine.routePayment(paymentRequest);

    expect(engine.getProviderHealth().find(h => h.provider === 'primary')?.tripped).toBe(true);

    engine.resetCircuitBreaker('primary');
    expect(engine.getProviderHealth().find(h => h.provider === 'primary')?.tripped).toBe(false);
  });

  it('should throw when no routes are registered', async () => {
    await expect(engine.routePayment(paymentRequest)).rejects.toThrow('No gateway routes registered');
  });

  it('should throw when all providers have tripped circuit breakers', async () => {
    primary.shouldThrow = true;
    secondary.shouldThrow = true;
    engine.registerRoutes([
      { provider: 'primary', adapter: primary, config: mockConfig, priority: 1 },
      { provider: 'secondary', adapter: secondary, config: mockConfig, priority: 2 },
    ]);

    // Trip both circuit breakers (2 calls with maxRetriesPerProvider=1 = 4 failures each)
    for (let i = 0; i < 2; i++) {
      try {
        await engine.routePayment(paymentRequest);
      } catch {
        // Expected — all providers failing
      }
    }

    // Both should be tripped now
    const health = engine.getProviderHealth();
    expect(health.every(h => h.tripped)).toBe(true);

    await expect(engine.routePayment(paymentRequest)).rejects.toThrow('All payment providers are unavailable');
  });

  it('should run health checks and update circuit breaker state', async () => {
    primary.healthResult = { healthy: false };
    engine.registerRoutes([
      { provider: 'primary', adapter: primary, config: mockConfig, priority: 1 },
    ]);

    await engine.runHealthChecks();

    const health = engine.getProviderHealth().find(h => h.provider === 'primary');
    expect(health?.healthy).toBe(false);
  });
});
