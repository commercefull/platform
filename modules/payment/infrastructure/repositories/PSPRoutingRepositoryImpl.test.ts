import { PSPRoutingRepositoryImpl } from './PSPRoutingRepositoryImpl';
import { PSPRoute } from '../../domain/entities/PSPRoute';
import type { PaymentGateway } from '../../../../libs/db/types';

const row = (overrides: Partial<PaymentGateway> = {}): PaymentGateway => ({
  paymentGatewayId: 'g1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  organizationId: 'org1',
  name: 'stripe',
  provider: 'stripe',
  isActive: true,
  isDefault: false,
  isTestMode: true,
  apiKey: 'sk_test',
  apiSecret: null,
  publicKey: 'pk_test',
  webhookSecret: 'whsec',
  apiEndpoint: null,
  supportedPaymentMethods: 'card',
  supportedCurrencies: ['USD'],
  processingFees: null,
  checkoutSettings: null,
  metadata: null,
  deletedAt: null,
  ...overrides,
});

const makeRepo = () => ({
  findAllGateways: jest.fn(),
  findGatewayById: jest.fn(),
  createGateway: jest.fn(),
  updateGateway: jest.fn(),
  deleteGateway: jest.fn(),
});

const route = (overrides: Partial<Parameters<typeof PSPRoute.reconstitute>[0]> = {}) =>
  PSPRoute.reconstitute({
    routeId: 'r1',
    organizationId: 'org1',
    provider: 'stripe',
    priority: 2,
    isActive: true,
    config: { apiKey: 'sk_test', publishableKey: 'pk_test', webhookSecret: 'whsec', testMode: true },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

describe('PSPRoutingRepositoryImpl', () => {
  let repo: ReturnType<typeof makeRepo>;
  let impl: PSPRoutingRepositoryImpl;

  beforeEach(() => {
    repo = makeRepo();
    impl = new PSPRoutingRepositoryImpl(repo);
  });

  it('should return only active routes sorted by priority', async () => {
    repo.findAllGateways.mockResolvedValue([
      row({ paymentGatewayId: 'g2', metadata: { priority: 5 } }),
      row({ paymentGatewayId: 'g1', isActive: false, metadata: { priority: 1 } }),
      row({ paymentGatewayId: 'g3', metadata: { priority: 2 } }),
    ]);

    const routes = await impl.findActiveRoutes('org1');

    expect(routes.map(r => r.routeId)).toEqual(['g3', 'g2']);
  });

  it('should return all routes sorted by priority', async () => {
    repo.findAllGateways.mockResolvedValue([
      row({ paymentGatewayId: 'g2', metadata: { priority: 5 } }),
      row({ paymentGatewayId: 'g1', metadata: { priority: 1 } }),
    ]);
    const routes = await impl.findAllRoutes('org1');
    expect(routes.map(r => r.routeId)).toEqual(['g1', 'g2']);
  });

  it('should map gateway rows to routes including config and metadata', async () => {
    repo.findGatewayById.mockResolvedValue(
      row({ metadata: { priority: 3, merchantAccount: 'acct1', extra: { region: 'eu' }, capabilities: { supportedCurrencies: ['EUR'], supportedCountries: [] } } }),
    );

    const found = await impl.findRouteById('g1');

    expect(found?.routeId).toBe('g1');
    expect(found?.priority).toBe(3);
    expect(found?.config).toMatchObject({ apiKey: 'sk_test', publishableKey: 'pk_test', webhookSecret: 'whsec', testMode: true, merchantAccount: 'acct1' });
    expect(found?.capabilities?.supportedCurrencies).toEqual(['EUR']);
  });

  it('should derive priority 0 for the default gateway when metadata lacks priority', async () => {
    repo.findGatewayById.mockResolvedValue(row({ isDefault: true }));
    const found = await impl.findRouteById('g1');
    expect(found?.priority).toBe(0);
  });

  it('should return null for a missing route', async () => {
    repo.findGatewayById.mockResolvedValue(null);
    expect(await impl.findRouteById('missing')).toBeNull();
  });

  it('should map a route to gateway params on create', async () => {
    const created = { ...row({ isDefault: false }), metadata: { priority: 2 } };
    repo.createGateway.mockResolvedValue(created);

    await impl.createRoute(route({ priority: 2 }));

    expect(repo.createGateway).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'stripe',
        name: 'stripe',
        isTestMode: true,
        apiKey: 'sk_test',
        publicKey: 'pk_test',
        webhookSecret: 'whsec',
        metadata: expect.objectContaining({ priority: 2 }),
      }),
    );
  });

  it('should merge partial updates onto the existing route', async () => {
    repo.findGatewayById.mockResolvedValue(row({ metadata: { priority: 2 } }));
    repo.updateGateway.mockResolvedValue(row({ isActive: false, metadata: { priority: 2 } }));

    const updated = await impl.updateRoute('g1', { isActive: false } as Partial<PSPRoute>);

    expect(repo.updateGateway).toHaveBeenCalledWith('g1', expect.objectContaining({ isActive: false, provider: 'stripe' }));
    expect(updated?.isActive).toBe(false);
  });

  it('should return null when updating a missing route', async () => {
    repo.findGatewayById.mockResolvedValue(null);
    expect(await impl.updateRoute('missing', { isActive: false } as Partial<PSPRoute>)).toBeNull();
    expect(repo.updateGateway).not.toHaveBeenCalled();
  });

  it('should activate and deactivate routes via gateway updates', async () => {
    repo.updateGateway.mockResolvedValue(row());
    await impl.activateRoute('g1');
    expect(repo.updateGateway).toHaveBeenCalledWith('g1', { isActive: true });
    await impl.deactivateRoute('g1');
    expect(repo.updateGateway).toHaveBeenCalledWith('g1', { isActive: false });
  });

  it('should delegate deletes to the gateway repo', async () => {
    repo.deleteGateway.mockResolvedValue(true);
    expect(await impl.deleteRoute('g1')).toBe(true);
    expect(repo.deleteGateway).toHaveBeenCalledWith('g1');
  });
});
