import { emitMock, createPSPRoutingRepository, createPSPRoute } from '../../tests/testUtils';
import {
  ManagePSPRoutesUseCase,
  CreatePSPRouteCommand,
  UpdatePSPRouteCommand,
} from './ManagePSPRoutes';
import { ProviderNotSupportedError } from '../../domain/errors/PaymentErrors';
import type { PSPRoute } from '../../domain/entities/PSPRoute';

describe('ManagePSPRoutesUseCase', () => {
  let useCase: ManagePSPRoutesUseCase;
  let routingRepo: ReturnType<typeof createPSPRoutingRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    routingRepo = createPSPRoutingRepository();
    useCase = new ManagePSPRoutesUseCase(routingRepo);
  });

  it('should create a route and emit payment.psp_route.created', async () => {
    routingRepo.createRoute.mockImplementation(async route => route);

    const result = await useCase.create(
      new CreatePSPRouteCommand('org-1', 'stripe', 1, 'sk_test_123', 'pk_test', 'whsec_123', true, undefined, undefined),
    );

    expect(result.routeId).toBe('payment-uuid-123');
    expect(result.provider).toBe('stripe');
    expect(routingRepo.createRoute).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-1' }));
    expect(emitMock).toHaveBeenCalledWith('payment.psp_route.created', {
      routeId: 'payment-uuid-123',
      provider: 'stripe',
      organizationId: 'org-1',
    });
  });

  it('should throw ProviderNotSupportedError for an unknown provider', async () => {
    await expect(
      useCase.create(
        new CreatePSPRouteCommand('org-1', 'unknown-psp', 1, 'key', undefined, 'secret', true, undefined, undefined),
      ),
    ).rejects.toThrow(ProviderNotSupportedError);
    expect(routingRepo.createRoute).not.toHaveBeenCalled();
  });

  it('should apply updates to the existing route and emit payment.psp_route.updated', async () => {
    const existing = createPSPRoute({ priority: 1 });
    routingRepo.findRouteById.mockResolvedValue(existing);
    routingRepo.updateRoute.mockImplementation(async (_id, route) => route as PSPRoute);

    const result = await useCase.update(
      new UpdatePSPRouteCommand('route-1', 5, 'sk_new', undefined, undefined, false, undefined, undefined, undefined),
    );

    expect(result?.priority).toBe(5);
    expect(result?.config.apiKey).toBe('sk_new');
    expect(result?.config.testMode).toBe(false);
    expect(routingRepo.updateRoute).toHaveBeenCalledWith('route-1', existing);
    expect(emitMock).toHaveBeenCalledWith('payment.psp_route.updated', {
      routeId: 'route-1',
      provider: 'stripe',
    });
  });

  it('should deactivate the route when isActive is false', async () => {
    const existing = createPSPRoute();
    routingRepo.findRouteById.mockResolvedValue(existing);
    routingRepo.updateRoute.mockImplementation(async (_id, route) => route as PSPRoute);

    const result = await useCase.update(
      new UpdatePSPRouteCommand('route-1', undefined, undefined, undefined, undefined, undefined, undefined, undefined, false),
    );

    expect(result?.isActive).toBe(false);
  });

  it('should return null when updating a missing route', async () => {
    routingRepo.findRouteById.mockResolvedValue(null);

    const result = await useCase.update(
      new UpdatePSPRouteCommand('missing', 5, undefined, undefined, undefined, undefined, undefined, undefined, undefined),
    );

    expect(result).toBeNull();
    expect(routingRepo.updateRoute).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should emit payment.psp_route.deleted only when the route existed', async () => {
    routingRepo.deleteRoute.mockResolvedValue(true);

    const result = await useCase.delete('route-1');

    expect(result).toBe(true);
    expect(emitMock).toHaveBeenCalledWith('payment.psp_route.deleted', { routeId: 'route-1' });
  });

  it('should not emit when deleting a missing route', async () => {
    routingRepo.deleteRoute.mockResolvedValue(false);

    const result = await useCase.delete('missing');

    expect(result).toBe(false);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should list all routes for the organization', async () => {
    routingRepo.findAllRoutes.mockResolvedValue([createPSPRoute()]);

    const result = await useCase.list('org-1');

    expect(result).toHaveLength(1);
    expect(routingRepo.findAllRoutes).toHaveBeenCalledWith('org-1');
  });

  it('should get, activate, and deactivate routes by ID', async () => {
    const route = createPSPRoute();
    routingRepo.findRouteById.mockResolvedValue(route);
    routingRepo.activateRoute.mockResolvedValue(route);
    routingRepo.deactivateRoute.mockResolvedValue(route);

    expect(await useCase.get('route-1')).toBe(route);
    expect(await useCase.activate('route-1')).toBe(route);
    expect(await useCase.deactivate('route-1')).toBe(route);
    expect(routingRepo.activateRoute).toHaveBeenCalledWith('route-1');
    expect(routingRepo.deactivateRoute).toHaveBeenCalledWith('route-1');
  });
});
