/**
 * PSP Routing Use Cases
 *
 * - ManagePSPRoutes: CRUD operations for payment provider routes
 * - RoutePayment: Use the failover engine to route a payment across providers
 */

import { generateUUID } from '../../../../libs/uuid';
import { PSPRoutingRepository } from '../../domain/repositories/PSPRoutingRepository';
import { PSPRoute } from '../../domain/entities/PSPRoute';
import { FailoverRoutingEngine, GatewayRoute } from '../services/FailoverRoutingEngine';
import { getPSPAdapter } from '../services/GatewayAdapterRegistry';
import type { PSPConfig, PaymentRequest } from '../services/GatewayAdapter';
import { eventBus } from '../../../../libs/events/eventBus';
import {
  ProviderNotSupportedError,
  NoProvidersAvailableError,
  AllProvidersExhaustedError,
} from '../../domain/errors/PaymentErrors';
import { logger } from '../../../../libs/logger';

// ============================================================================
// Manage PSP Routes
// ============================================================================

export class CreatePSPRouteCommand {
  constructor(
    public readonly organizationId: string,
    public readonly provider: string,
    public readonly priority: number,
    public readonly apiKey: string,
    public readonly publishableKey: string | undefined,
    public readonly webhookSecret: string,
    public readonly testMode: boolean,
    public readonly merchantAccount: string | undefined,
    public readonly extra: Record<string, unknown> | undefined,
  ) {}
}

export class UpdatePSPRouteCommand {
  constructor(
    public readonly routeId: string,
    public readonly priority: number | undefined,
    public readonly apiKey: string | undefined,
    public readonly publishableKey: string | undefined,
    public readonly webhookSecret: string | undefined,
    public readonly testMode: boolean | undefined,
    public readonly merchantAccount: string | undefined,
    public readonly extra: Record<string, unknown> | undefined,
    public readonly isActive: boolean | undefined,
  ) {}
}

export class ManagePSPRoutesUseCase {
  constructor(private readonly routingRepository: PSPRoutingRepository) {}

  async create(command: CreatePSPRouteCommand): Promise<PSPRoute> {
    const adapter = getPSPAdapter(command.provider);
    if (!adapter) {
      throw new ProviderNotSupportedError(command.provider);
    }

    const route = PSPRoute.create({
      routeId: generateUUID(),
      organizationId: command.organizationId,
      provider: command.provider,
      priority: command.priority,
      apiKey: command.apiKey,
      publishableKey: command.publishableKey,
      webhookSecret: command.webhookSecret,
      testMode: command.testMode,
      merchantAccount: command.merchantAccount,
      extra: command.extra,
    });

    const saved = await this.routingRepository.createRoute(route);

    eventBus.emit('payment.psp_route.created', {
      routeId: saved.routeId,
      provider: saved.provider,
      organizationId: saved.organizationId,
    });

    return saved;
  }

  async update(command: UpdatePSPRouteCommand): Promise<PSPRoute | null> {
    const existing = await this.routingRepository.findRouteById(command.routeId);
    if (!existing) return null;

    if (command.priority !== undefined) existing.updatePriority(command.priority);
    if (command.isActive === true) existing.activate();
    if (command.isActive === false) existing.deactivate();
    if (command.apiKey || command.publishableKey || command.webhookSecret || command.testMode !== undefined || command.merchantAccount || command.extra) {
      existing.updateConfig({
        ...(command.apiKey && { apiKey: command.apiKey }),
        ...(command.publishableKey !== undefined && { publishableKey: command.publishableKey }),
        ...(command.webhookSecret && { webhookSecret: command.webhookSecret }),
        ...(command.testMode !== undefined && { testMode: command.testMode }),
        ...(command.merchantAccount !== undefined && { merchantAccount: command.merchantAccount }),
        ...(command.extra !== undefined && { extra: command.extra }),
      });
    }

    const updated = await this.routingRepository.updateRoute(command.routeId, existing);

    eventBus.emit('payment.psp_route.updated', {
      routeId: command.routeId,
      provider: existing.provider,
    });

    return updated;
  }

  async delete(routeId: string): Promise<boolean> {
    const deleted = await this.routingRepository.deleteRoute(routeId);
    if (deleted) {
      eventBus.emit('payment.psp_route.deleted', { routeId });
    }
    return deleted;
  }

  async list(organizationId: string): Promise<PSPRoute[]> {
    return this.routingRepository.findAllRoutes(organizationId);
  }

  async get(routeId: string): Promise<PSPRoute | null> {
    return this.routingRepository.findRouteById(routeId);
  }

  async activate(routeId: string): Promise<PSPRoute | null> {
    return this.routingRepository.activateRoute(routeId);
  }

  async deactivate(routeId: string): Promise<PSPRoute | null> {
    return this.routingRepository.deactivateRoute(routeId);
  }
}

// ============================================================================
// Route Payment via Failover Engine
// ============================================================================

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
        logger.warning(`No PSP adapter found for provider ${route.provider}, skipping`);
        continue;
      }

      // Check currency support
      if (!route.supportsCurrency(command.currency)) {
        logger.warning(`Provider ${route.provider} does not support currency ${command.currency}, skipping`);
        continue;
      }

      // Check amount support
      if (!route.supportsAmount(command.amount)) {
        logger.warning(`Provider ${route.provider} does not support amount ${command.amount}, skipping`);
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

export class GetProviderHealthUseCase {
  constructor(private readonly routingRepository: PSPRoutingRepository) {}

  async execute(organizationId: string): Promise<Array<{
    provider: string;
    routeId: string;
    priority: number;
    isActive: boolean;
    healthy: boolean;
  }>> {
    const routes = await this.routingRepository.findActiveRoutes(organizationId);
    const results: Array<{
      provider: string;
      routeId: string;
      priority: number;
      isActive: boolean;
      healthy: boolean;
    }> = [];

    for (const route of routes) {
      const adapter = getPSPAdapter(route.provider);
      if (!adapter) {
        results.push({
          provider: route.provider,
          routeId: route.routeId,
          priority: route.priority,
          isActive: route.isActive,
          healthy: false,
        });
        continue;
      }

      try {
        const config: PSPConfig = {
          apiKey: route.config.apiKey,
          publishableKey: route.config.publishableKey,
          webhookSecret: route.config.webhookSecret,
          testMode: route.config.testMode,
          merchantAccount: route.config.merchantAccount,
          extra: route.config.extra,
        };
        const health = await adapter.checkHealth(config);
        results.push({
          provider: route.provider,
          routeId: route.routeId,
          priority: route.priority,
          isActive: route.isActive,
          healthy: health.healthy,
        });
      } catch {
        results.push({
          provider: route.provider,
          routeId: route.routeId,
          priority: route.priority,
          isActive: route.isActive,
          healthy: false,
        });
      }
    }

    return results;
  }
}
