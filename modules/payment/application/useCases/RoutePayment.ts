import { PSPRoutingRepository } from '../../domain/repositories/PSPRoutingRepository';
import { FailoverRoutingEngine, GatewayRoute } from '../services/FailoverRoutingEngine';
import { getPSPAdapter } from '../services/GatewayAdapterRegistry';
import type { PSPConfig, PaymentRequest } from '../services/GatewayAdapter';
import { eventBus } from '../../../../libs/events/eventBus';
import { NoProvidersAvailableError, AllProvidersExhaustedError } from '../../domain/errors/PaymentErrors';
import { logger } from '../../../../libs/logger';

export class RoutePaymentCommand {
  constructor(
    public readonly organizationId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly customerId: string | undefined,
    public readonly customerEmail: string | undefined,
    public readonly customerIp: string | undefined,
    public readonly paymentMethodToken: string | undefined,
    public readonly description: string | undefined,
    public readonly returnUrl: string | undefined,
    public readonly cancelUrl: string | undefined,
    public readonly metadata: Record<string, unknown> | undefined,
  ) {}
}

export interface RoutePaymentResponse {
  success: boolean;
  provider: string;
  externalTransactionId: string;
  status: string;
  redirectUrl: string | undefined;
  attempts: Array<{
    provider: string;
    success: boolean;
    errorCode: string | undefined;
    errorMessage: string | undefined;
    latencyMs: number;
  }>;
}


export class RoutePaymentUseCase {
  constructor(private readonly routingRepository: PSPRoutingRepository) {}

  async execute(command: RoutePaymentCommand): Promise<RoutePaymentResponse> {
    const routes = await this.routingRepository.findActiveRoutes(command.organizationId);

    if (routes.length === 0) {
      throw new NoProvidersAvailableError();
    }

    // Build gateway routes for the failover engine
    const gatewayRoutes: GatewayRoute[] = [];
    for (const route of routes) {
      const adapter = getPSPAdapter(route.provider);
      if (!adapter) {
        logger.warn(`No PSP adapter found for provider ${route.provider}, skipping`);
        continue;
      }

      // Check currency support
      if (!route.supportsCurrency(command.currency)) {
        logger.warn(`Provider ${route.provider} does not support currency ${command.currency}, skipping`);
        continue;
      }

      // Check amount support
      if (!route.supportsAmount(command.amount)) {
        logger.warn(`Provider ${route.provider} does not support amount ${command.amount}, skipping`);
        continue;
      }

      const config: PSPConfig = {
        apiKey: route.config.apiKey,
        publishableKey: route.config.publishableKey,
        webhookSecret: route.config.webhookSecret,
        testMode: route.config.testMode,
        merchantAccount: route.config.merchantAccount,
        extra: route.config.extra,
      };

      gatewayRoutes.push({
        provider: route.provider,
        adapter,
        config,
        priority: route.priority,
      });
    }

    if (gatewayRoutes.length === 0) {
      throw new NoProvidersAvailableError();
    }

    const engine = new FailoverRoutingEngine({
      maxRetriesPerProvider: 2,
      retryBaseDelayMs: 500,
      retryMaxDelayMs: 5000,
      circuitBreakerThreshold: 3,
      circuitBreakerResetMs: 60_000,
      healthCheckIntervalMs: 0,
    });
    engine.registerRoutes(gatewayRoutes);

    const paymentRequest: PaymentRequest = {
      orderId: command.orderId,
      amount: command.amount,
      currency: command.currency,
      customerId: command.customerId,
      customerEmail: command.customerEmail,
      customerIp: command.customerIp,
      paymentMethodToken: command.paymentMethodToken,
      description: command.description,
      returnUrl: command.returnUrl,
      cancelUrl: command.cancelUrl,
      metadata: command.metadata,
    };

    const result = await engine.routePayment(paymentRequest);

    eventBus.emit('payment.routed', {
      orderId: command.orderId,
      provider: result.provider,
      success: result.response.success,
      attempts: result.attempts.length,
    });

    if (!result.response.success) {
      throw new AllProvidersExhaustedError();
    }

    return {
      success: result.response.success,
      provider: result.provider,
      externalTransactionId: result.response.externalTransactionId,
      status: result.response.status,
      redirectUrl: result.response.redirectUrl,
      attempts: result.attempts.map(a => ({
        provider: a.provider,
        success: a.success,
        errorCode: a.errorCode,
        errorMessage: a.errorMessage,
        latencyMs: a.latencyMs,
      })),
    };
  }
}

// ============================================================================
// Get Provider Health
// ============================================================================

