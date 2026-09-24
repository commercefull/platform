import { createPSPRoute, createPSPRoutingRepository, emitMock } from '../../tests/testUtils';
import { RoutePaymentUseCase, RoutePaymentCommand } from './RoutePayment';
import { PSPRoute, PSPRouteConfig } from '../../domain/entities/PSPRoute';
import { NoProvidersAvailableError, AllProvidersExhaustedError } from '../../domain/errors/PaymentErrors';
import type { PSPAdapter } from '../../infrastructure/services/GatewayAdapter';
import { getPSPAdapter } from '../../infrastructure/services/GatewayAdapterRegistry';

jest.mock('../../infrastructure/services/GatewayAdapterRegistry', () => ({
  getPSPAdapter: jest.fn(),
}));

const getPSPAdapterMock = jest.mocked(getPSPAdapter);

const command = new RoutePaymentCommand(
  'org-1',
  'order-1',
  5000,
  'USD',
  'cust-1',
  'c@x.com',
  '1.2.3.4',
  'tok_1',
  'test payment',
  undefined,
  undefined,
  undefined,
);

describe('RoutePaymentUseCase', () => {
  let routingRepo: ReturnType<typeof createPSPRoutingRepository>;
  let routingEngine: { routePayment: jest.Mock };
  const adapter = { provider: 'stripe' } as unknown as PSPAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    routingRepo = createPSPRoutingRepository();
    routingEngine = { routePayment: jest.fn() };
    getPSPAdapterMock.mockReturnValue(adapter);
  });

  it('should throw NoProvidersAvailableError when the organization has no active routes', async () => {
    routingRepo.findActiveRoutes.mockResolvedValue([]);

    await expect(new RoutePaymentUseCase(routingRepo, routingEngine).execute(command)).rejects.toThrow(
      NoProvidersAvailableError,
    );
    expect(routingEngine.routePayment).not.toHaveBeenCalled();
  });

  it('should throw NoProvidersAvailableError when every route is filtered out', async () => {
    const withCaps = (routeId: string, caps: { supportedCurrencies: string[]; minAmountCents?: number }): PSPRoute =>
      PSPRoute.reconstitute({
        routeId,
        organizationId: 'org-1',
        provider: 'stripe',
        priority: 1,
        isActive: true,
        config: { apiKey: 'sk', webhookSecret: 'wh', testMode: true },
        capabilities: {
          supportsAuthCapture: true,
          supportsPartialCapture: false,
          supportsPartialRefund: false,
          supportsVoid: false,
          requiresRedirect: false,
          supportsTokenization: false,
          supportsWebhooks: true,
          supportedCountries: [],
          ...caps,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    routingRepo.findActiveRoutes.mockResolvedValue([
      createPSPRoute({ routeId: 'r1', provider: 'unknown-psp' }),
      withCaps('r2', { supportedCurrencies: ['EUR'] }),
      withCaps('r3', { supportedCurrencies: ['USD'], minAmountCents: 100000 }),
    ]);
    getPSPAdapterMock.mockImplementation(provider => (provider === 'stripe' ? adapter : null));

    await expect(new RoutePaymentUseCase(routingRepo, routingEngine).execute(command)).rejects.toThrow(
      NoProvidersAvailableError,
    );
    expect(routingEngine.routePayment).not.toHaveBeenCalled();
  });

  it('should throw AllProvidersExhaustedError when the engine fails on all routes', async () => {
    routingRepo.findActiveRoutes.mockResolvedValue([createPSPRoute()]);
    routingEngine.routePayment.mockResolvedValue({
      provider: 'stripe',
      response: { success: false },
      attempts: [{ provider: 'stripe', success: false, errorCode: 'card_declined', errorMessage: 'declined', latencyMs: 10 }],
    });

    await expect(new RoutePaymentUseCase(routingRepo, routingEngine).execute(command)).rejects.toThrow(
      AllProvidersExhaustedError,
    );
    expect(emitMock).toHaveBeenCalledWith('payment.routed', expect.objectContaining({ provider: 'stripe', success: false }));
  });

  it('should return the routed response and emit payment.routed on success', async () => {
    routingRepo.findActiveRoutes.mockResolvedValue([createPSPRoute()]);
    routingEngine.routePayment.mockResolvedValue({
      provider: 'stripe',
      response: { success: true, externalTransactionId: 'ch_1', status: 'succeeded', redirectUrl: undefined },
      attempts: [{ provider: 'stripe', success: true, errorCode: undefined, errorMessage: undefined, latencyMs: 42 }],
    });

    const result = await new RoutePaymentUseCase(routingRepo, routingEngine).execute(command);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('stripe');
    expect(result.externalTransactionId).toBe('ch_1');
    expect(result.attempts).toHaveLength(1);
    expect(routingEngine.routePayment).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-1', amountCents: 5000, currency: 'USD' }),
      [expect.objectContaining({ provider: 'stripe', priority: 1 })],
    );
    expect(emitMock).toHaveBeenCalledWith('payment.routed', expect.objectContaining({ orderId: 'order-1', success: true }));
  });
});
