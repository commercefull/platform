/**
 * Failover Routing Engine
 *
 * Routes payment requests across multiple PSPs with:
 * - Priority-based ordering
 * - Health check circuit breaking
 * - Retry with exponential backoff
 * - Automatic failover to next provider on failure
 *
 * https://docs.klarna.com/api/  — pattern: try primary, failover to secondary
 */

import { logger } from '../../../../libs/logger';
import {
  PSPAdapter, PSPConfig, PaymentRequest, PaymentResponse,
  HealthCheckResult,
} from './GatewayAdapter';
import { NoPaymentGatewayConfiguredError, PaymentValidationError } from '../../domain/errors/PaymentErrors';

export interface GatewayRoute {
  provider: string;
  adapter: PSPAdapter;
  config: PSPConfig;
  priority: number;
  /** Weight for load balancing among same-priority routes (default 1) */
  weight?: number;
}

export interface RoutingResult {
  response: PaymentResponse;
  provider: string;
  attempts: AttemptRecord[];
}

export interface AttemptRecord {
  provider: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  latencyMs: number;
  retried: boolean;
}

export interface FailoverRoutingConfig {
  /** Max retry attempts per provider before failing over */
  maxRetriesPerProvider: number;
  /** Base delay for exponential backoff (ms) */
  retryBaseDelayMs: number;
  /** Max delay for exponential backoff (ms) */
  retryMaxDelayMs: number;
  /** Circuit breaker: failures before marking provider unhealthy */
  circuitBreakerThreshold: number;
  /** Circuit breaker: reset timeout (ms) */
  circuitBreakerResetMs: number;
  /** Health check interval (ms) — 0 disables periodic checks */
  healthCheckIntervalMs: number;
}

const DEFAULT_ROUTING_CONFIG: FailoverRoutingConfig = {
  maxRetriesPerProvider: 2,
  retryBaseDelayMs: 500,
  retryMaxDelayMs: 5000,
  circuitBreakerThreshold: 3,
  circuitBreakerResetMs: 60_000,
  healthCheckIntervalMs: 30_000,
};

interface CircuitBreakerState {
  failures: number;
  lastFailureAt: number;
  tripped: boolean;
  lastHealthCheck?: HealthCheckResult;
}

export class FailoverRoutingEngine {
  private routes: GatewayRoute[] = [];
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private readonly config: FailoverRoutingConfig;

  constructor(config?: Partial<FailoverRoutingConfig>) {
    this.config = { ...DEFAULT_ROUTING_CONFIG, ...config };
  }

  /**
   * Register gateway routes. Routes are ordered by priority (lower = higher priority).
   */
  registerRoutes(routes: GatewayRoute[]): void {
    this.routes = [...routes].sort((a, b) => a.priority - b.priority);
    for (const route of routes) {
      if (!this.circuitBreakers.has(route.provider)) {
        this.circuitBreakers.set(route.provider, { failures: 0, lastFailureAt: 0, tripped: false });
      }
    }
  }

  /**
   * Start periodic health checks for all registered providers.
   */
  startHealthChecks(): void {
    if (this.healthCheckTimer || this.config.healthCheckIntervalMs === 0) return;

    this.healthCheckTimer = setInterval(() => {
      void this.runHealthChecks();
    }, this.config.healthCheckIntervalMs);

    this.healthCheckTimer.unref();
  }

  /**
   * Stop periodic health checks.
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Run health checks on all providers and update circuit breaker states.
   */
  async runHealthChecks(): Promise<void> {
    for (const route of this.routes) {
      try {
        const result = await route.adapter.checkHealth(route.config);
        const state = this.circuitBreakers.get(route.provider);
        if (state) {
          state.lastHealthCheck = result;
          if (result.healthy && state.tripped) {
            state.tripped = false;
            state.failures = 0;
            logger.info(`Circuit breaker reset for ${route.provider}`, { provider: route.provider });
          } else if (!result.healthy) {
            state.failures++;
            if (state.failures >= this.config.circuitBreakerThreshold) {
              state.tripped = true;
              logger.warning(`Circuit breaker tripped for ${route.provider}`, {
                provider: route.provider,
                failures: state.failures,
              });
            }
          }
        }
      } catch (err) {
        logger.warning(`Health check failed for ${route.provider}`, {
          provider: route.provider,
          error: err instanceof Error ? err.message : 'unknown',
        });
      }
    }
  }

  /**
   * Route a payment request through the failover chain.
   * Tries providers in priority order, with retries per provider before failing over.
   */
  async routePayment(request: PaymentRequest): Promise<RoutingResult> {
    if (this.routes.length === 0) {
      throw new PaymentValidationError('No gateway routes registered');
    }

    const attempts: AttemptRecord[] = [];
    const availableRoutes = this.getAvailableRoutes();

    if (availableRoutes.length === 0) {
      throw new NoPaymentGatewayConfiguredError();
    }

    for (const route of availableRoutes) {
      const maxAttempts = this.config.maxRetriesPerProvider + 1;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const start = Date.now();
        const isRetry = attempt > 0;

        try {
          if (isRetry) {
            const delay = this.calculateBackoff(attempt);
            await this.sleep(delay);
          }

          const response = await route.adapter.initiatePayment(request, route.config);
          const latencyMs = Date.now() - start;

          attempts.push({
            provider: route.provider,
            success: response.success,
            errorCode: response.errorCode,
            errorMessage: response.errorMessage,
            latencyMs,
            retried: isRetry,
          });

          if (response.success) {
            this.recordSuccess(route.provider);
            return { response, provider: route.provider, attempts };
          }

          // Non-success response — check if we should retry or failover
          if (this.isRetryableError(response.errorCode)) {
            this.recordFailure(route.provider);
            continue;
          }

          // Non-retryable error — failover to next provider
          this.recordFailure(route.provider);
          break;
        } catch (err) {
          const latencyMs = Date.now() - start;
          attempts.push({
            provider: route.provider,
            success: false,
            errorCode: 'exception',
            errorMessage: err instanceof Error ? err.message : 'unknown error',
            latencyMs,
            retried: isRetry,
          });

          this.recordFailure(route.provider);
          logger.warning(`Payment attempt failed for ${route.provider}`, {
            provider: route.provider,
            attempt: attempt + 1,
            error: err instanceof Error ? err.message : 'unknown',
          });
        }
      }
    }

    // All providers exhausted
    const lastAttempt = attempts[attempts.length - 1];
    return {
      response: {
        success: false,
        externalTransactionId: '',
        status: 'failed',
        gatewayResponse: {},
        errorCode: lastAttempt?.errorCode || 'all_providers_exhausted',
        errorMessage: lastAttempt?.errorMessage || 'All payment providers failed',
      },
      provider: 'none',
      attempts,
    };
  }

  /**
   * Get the current health status of all providers.
   */
  getProviderHealth(): Array<{
    provider: string;
    healthy: boolean;
    tripped: boolean;
    failures: number;
    lastHealthCheck?: HealthCheckResult;
  }> {
    return this.routes.map(route => {
      const state = this.circuitBreakers.get(route.provider);
      const lastCheck = state?.lastHealthCheck;
      const isHealthy = !state?.tripped && (lastCheck ? lastCheck.healthy : true);
      return {
        provider: route.provider,
        healthy: isHealthy,
        tripped: state?.tripped ?? false,
        failures: state?.failures ?? 0,
        lastHealthCheck: lastCheck,
      };
    });
  }

  /**
   * Manually reset a provider's circuit breaker.
   */
  resetCircuitBreaker(provider: string): void {
    const state = this.circuitBreakers.get(provider);
    if (state) {
      state.tripped = false;
      state.failures = 0;
      logger.info(`Circuit breaker manually reset for ${provider}`);
    }
  }

  // --- Private helpers ---

  private getAvailableRoutes(): GatewayRoute[] {
    const now = Date.now();
    return this.routes.filter(route => {
      const state = this.circuitBreakers.get(route.provider);
      if (!state) return true;
      if (state.tripped) {
        // Check if circuit breaker should auto-reset
        if (now - state.lastFailureAt > this.config.circuitBreakerResetMs) {
          state.tripped = false;
          state.failures = 0;
          logger.info(`Circuit breaker auto-reset for ${route.provider}`);
          return true;
        }
        return false;
      }
      return true;
    });
  }

  private recordSuccess(provider: string): void {
    const state = this.circuitBreakers.get(provider);
    if (state) {
      state.failures = 0;
    }
  }

  private recordFailure(provider: string): void {
    const state = this.circuitBreakers.get(provider);
    if (state) {
      state.failures++;
      state.lastFailureAt = Date.now();
      if (state.failures >= this.config.circuitBreakerThreshold) {
        state.tripped = true;
        logger.warning(`Circuit breaker tripped for ${provider}`, {
          provider,
          failures: state.failures,
        });
      }
    }
  }

  private isRetryableError(errorCode?: string): boolean {
    if (!errorCode) return false;
    const retryableCodes = [
      'rate_limit', 'rate_limited', 'temporarily_unavailable',
      'network_error', 'timeout', 'service_unavailable',
      'stripe_error', 'paypal_error', 'klarna_error', 'affirm_error',
    ];
    return retryableCodes.includes(errorCode.toLowerCase());
  }

  private calculateBackoff(attempt: number): number {
    const delay = this.config.retryBaseDelayMs * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3 * delay;
    return Math.min(delay + jitter, this.config.retryMaxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
