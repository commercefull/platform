import { PSPRoutingRepository } from '../../domain/repositories/PSPRoutingRepository';
import { getPSPAdapter } from '../services/GatewayAdapterRegistry';
import type { PSPConfig } from '../services/GatewayAdapter';

export class GetProviderHealthUseCase {
  constructor(private readonly routingRepository: PSPRoutingRepository) {}

  async execute(organizationId: string): Promise<
    Array<{
      provider: string;
      routeId: string;
      priority: number;
      isActive: boolean;
      healthy: boolean;
    }>
  > {
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
