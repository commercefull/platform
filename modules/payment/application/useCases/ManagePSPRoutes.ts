import { generateUUID } from '../../../../libs/uuid';
import { PSPRoutingRepository } from '../../domain/repositories/PSPRoutingRepository';
import { PSPRoute } from '../../domain/entities/PSPRoute';
import { getPSPAdapter } from '../../infrastructu../../infrastructure/services/GatewayAdapterRegistry';
import { eventBus } from '../../../../libs/events/eventBus';
import { ProviderNotSupportedError } from '../../domain/errors/PaymentErrors';

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
    if (
      command.apiKey ||
      command.publishableKey ||
      command.webhookSecret ||
      command.testMode !== undefined ||
      command.merchantAccount ||
      command.extra
    ) {
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

