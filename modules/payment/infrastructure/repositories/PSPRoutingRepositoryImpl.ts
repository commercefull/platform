/**
 * PSP Routing Repository Implementation
 *
 * Persists PSPRoute aggregates on the `paymentGateway` table via PaymentRepo.
 * Fields with no dedicated column (priority, capabilities, merchantAccount,
 * extra) are stored in the gateway's `metadata` JSONB column.
 */

import type { PaymentGateway } from '../../../../libs/db/types';
import { PSPRoutingRepository } from '../../domain/repositories/PSPRoutingRepository';
import { PSPRoute, PSPRouteConfig } from '../../domain/entities/PSPRoute';
import { PaymentRepo } from './paymentRepo';

type GatewayRepoSlice = Pick<
  PaymentRepo,
  'findAllGateways' | 'findGatewayById' | 'createGateway' | 'updateGateway' | 'deleteGateway'
>;

interface GatewayMetadata {
  priority?: number;
  capabilities?: PSPRouteConfig['capabilities'];
  merchantAccount?: string;
  extra?: Record<string, unknown>;
}

function toRoute(row: PaymentGateway): PSPRoute {
  const metadata = (row.metadata ?? {}) as GatewayMetadata;
  const capabilities = metadata.capabilities;
  return PSPRoute.reconstitute({
    routeId: row.paymentGatewayId,
    organizationId: row.organizationId,
    provider: row.provider,
    priority: metadata.priority ?? (row.isDefault ? 0 : 1),
    isActive: row.isActive,
    config: {
      apiKey: row.apiKey ?? '',
      publishableKey: row.publicKey ?? undefined,
      webhookSecret: row.webhookSecret ?? '',
      testMode: row.isTestMode,
      merchantAccount: metadata.merchantAccount,
      extra: metadata.extra,
    },
    capabilities: capabilities
      ? {
          ...capabilities,
          supportedCurrencies: capabilities.supportedCurrencies ?? row.supportedCurrencies ?? [],
          supportedCountries: capabilities.supportedCountries ?? [],
        }
      : row.supportedCurrencies
        ? {
            supportsAuthCapture: true,
            supportsPartialCapture: true,
            supportsPartialRefund: true,
            supportsVoid: true,
            requiresRedirect: false,
            supportsTokenization: true,
            supportsWebhooks: true,
            supportedCurrencies: row.supportedCurrencies,
            supportedCountries: [],
          }
        : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toMetadata(route: PSPRoute): GatewayMetadata {
  return {
    priority: route.priority,
    capabilities: route.capabilities,
    merchantAccount: route.config.merchantAccount,
    extra: route.config.extra,
  };
}

export class PSPRoutingRepositoryImpl implements PSPRoutingRepository {
  constructor(private readonly gateways: GatewayRepoSlice) {}

  async findActiveRoutes(organizationId: string): Promise<PSPRoute[]> {
    const rows = await this.gateways.findAllGateways(organizationId);
    return rows.filter(r => r.isActive).map(toRoute).sort((a, b) => a.priority - b.priority);
  }

  async findAllRoutes(organizationId: string): Promise<PSPRoute[]> {
    const rows = await this.gateways.findAllGateways(organizationId);
    return rows.map(toRoute).sort((a, b) => a.priority - b.priority);
  }

  async findRouteById(routeId: string): Promise<PSPRoute | null> {
    const row = await this.gateways.findGatewayById(routeId);
    return row ? toRoute(row) : null;
  }

  async createRoute(route: PSPRoute): Promise<PSPRoute> {
    const row = await this.gateways.createGateway({
      organizationId: route.organizationId,
      name: route.provider,
      provider: route.provider,
      isActive: route.isActive,
      isDefault: route.priority === 0,
      isTestMode: route.config.testMode,
      apiKey: route.config.apiKey,
      apiSecret: null,
      publicKey: route.config.publishableKey ?? null,
      webhookSecret: route.config.webhookSecret,
      apiEndpoint: null,
      supportedPaymentMethods: 'card',
      supportedCurrencies: route.capabilities?.supportedCurrencies ?? null,
      processingFees: null,
      checkoutSettings: null,
      metadata: toMetadata(route),
    });
    return toRoute(row);
  }

  async updateRoute(routeId: string, updates: Partial<PSPRoute>): Promise<PSPRoute | null> {
    const existing = await this.gateways.findGatewayById(routeId);
    if (!existing) return null;

    const existingRoute = toRoute(existing);
    const merged: PSPRouteConfig = {
      routeId: existingRoute.routeId,
      organizationId: existingRoute.organizationId,
      provider: updates.provider ?? existingRoute.provider,
      priority: updates.priority ?? existingRoute.priority,
      isActive: updates.isActive ?? existingRoute.isActive,
      config: updates.config ?? existingRoute.config,
      capabilities: updates.capabilities ?? existingRoute.capabilities,
      createdAt: existingRoute.createdAt,
      updatedAt: existingRoute.updatedAt,
    };

    const row = await this.gateways.updateGateway(routeId, {
      provider: merged.provider,
      isActive: merged.isActive,
      isDefault: merged.priority === 0,
      isTestMode: merged.config.testMode,
      apiKey: merged.config.apiKey,
      publicKey: merged.config.publishableKey ?? null,
      webhookSecret: merged.config.webhookSecret,
      supportedCurrencies: merged.capabilities?.supportedCurrencies ?? null,
      metadata: toMetadata(PSPRoute.reconstitute(merged)),
    });
    return row ? toRoute(row) : null;
  }

  async deleteRoute(routeId: string): Promise<boolean> {
    return this.gateways.deleteGateway(routeId);
  }

  async activateRoute(routeId: string): Promise<PSPRoute | null> {
    const row = await this.gateways.updateGateway(routeId, { isActive: true });
    return row ? toRoute(row) : null;
  }

  async deactivateRoute(routeId: string): Promise<PSPRoute | null> {
    const row = await this.gateways.updateGateway(routeId, { isActive: false });
    return row ? toRoute(row) : null;
  }
}
