/**
 * PSP Route Entity Tests
 */

import { PSPRoute } from './PSPRoute';

describe('PSPRoute', () => {
  const createProps = {
    routeId: 'route_1',
    organizationId: 'org_1',
    provider: 'stripe',
    priority: 1,
    apiKey: 'sk_test_123',
    publishableKey: 'pk_test_123',
    webhookSecret: 'whsec_123',
    testMode: true,
    merchantAccount: 'acct_123',
  };

  it('should create a PSPRoute with correct defaults', () => {
    const route = PSPRoute.create(createProps);

    expect(route.routeId).toBe('route_1');
    expect(route.organizationId).toBe('org_1');
    expect(route.provider).toBe('stripe');
    expect(route.priority).toBe(1);
    expect(route.isActive).toBe(true);
    expect(route.config.apiKey).toBe('sk_test_123');
    expect(route.config.publishableKey).toBe('pk_test_123');
    expect(route.config.webhookSecret).toBe('whsec_123');
    expect(route.config.testMode).toBe(true);
    expect(route.config.merchantAccount).toBe('acct_123');
  });

  it('should reconstitute from props', () => {
    const now = new Date();
    const route = PSPRoute.reconstitute({
      routeId: 'route_2',
      organizationId: 'org_2',
      provider: 'paypal',
      priority: 2,
      isActive: false,
      config: {
        apiKey: 'key',
        webhookSecret: 'secret',
        testMode: false,
      },
      createdAt: now,
      updatedAt: now,
    });

    expect(route.routeId).toBe('route_2');
    expect(route.provider).toBe('paypal');
    expect(route.isActive).toBe(false);
    expect(route.priority).toBe(2);
  });

  it('should activate and deactivate', () => {
    const route = PSPRoute.create(createProps);

    expect(route.isActive).toBe(true);
    route.deactivate();
    expect(route.isActive).toBe(false);
    route.activate();
    expect(route.isActive).toBe(true);
  });

  it('should update priority', () => {
    const route = PSPRoute.create(createProps);

    route.updatePriority(5);
    expect(route.priority).toBe(5);
  });

  it('should reject invalid priority', () => {
    const route = PSPRoute.create(createProps);

    expect(() => route.updatePriority(0)).toThrow('Priority must be >= 1');
    expect(() => route.updatePriority(-1)).toThrow('Priority must be >= 1');
  });

  it('should update config', () => {
    const route = PSPRoute.create(createProps);

    route.updateConfig({ apiKey: 'new_key', testMode: false });
    expect(route.config.apiKey).toBe('new_key');
    expect(route.config.testMode).toBe(false);
    expect(route.config.webhookSecret).toBe('whsec_123'); // unchanged
  });

  it('should check currency support', () => {
    const route = PSPRoute.create(createProps);
    expect(route.supportsCurrency('USD')).toBe(true); // no caps = all currencies

    const routeWithCaps = PSPRoute.reconstitute({
      routeId: 'route_3',
      organizationId: 'org_1',
      provider: 'klarna',
      priority: 1,
      isActive: true,
      config: { apiKey: 'key', webhookSecret: 'secret', testMode: true },
      capabilities: {
        supportsAuthCapture: true,
        supportsPartialCapture: true,
        supportsPartialRefund: true,
        supportsVoid: true,
        requiresRedirect: true,
        supportsTokenization: false,
        supportsWebhooks: true,
        supportedCurrencies: ['USD', 'EUR'],
        supportedCountries: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(routeWithCaps.supportsCurrency('USD')).toBe(true);
    expect(routeWithCaps.supportsCurrency('EUR')).toBe(true);
    expect(routeWithCaps.supportsCurrency('JPY')).toBe(false);
  });

  it('should check amount support', () => {
    const route = PSPRoute.reconstitute({
      routeId: 'route_4',
      organizationId: 'org_1',
      provider: 'affirm',
      priority: 1,
      isActive: true,
      config: { apiKey: 'key', webhookSecret: 'secret', testMode: true },
      capabilities: {
        supportsAuthCapture: true,
        supportsPartialCapture: false,
        supportsPartialRefund: true,
        supportsVoid: true,
        requiresRedirect: true,
        supportsTokenization: false,
        supportsWebhooks: true,
        supportedCurrencies: ['USD'],
        supportedCountries: ['US'],
        minAmount: 50,
        maxAmount: 30000,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(route.supportsAmount(100)).toBe(true);
    expect(route.supportsAmount(25)).toBe(false); // below min
    expect(route.supportsAmount(50000)).toBe(false); // above max
  });

  it('should redact secrets in toJSON', () => {
    const route = PSPRoute.create(createProps);
    const json = route.toJSON() as Record<string, unknown>;
    const config = json.config as Record<string, unknown>;

    expect(config.apiKey).toBe('[REDACTED]');
    expect(config.webhookSecret).toBe('[REDACTED]');
    expect(config.publishableKey).toBe('pk_test_123'); // not redacted
  });
});
