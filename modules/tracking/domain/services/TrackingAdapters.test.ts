import { GTMServerAdapter } from './GTMServerAdapter';
import { MetaCAPIAdapter } from './MetaCAPIAdapter';
import { TrackingConfig, GTMConfig, MetaCAPIConfig } from '../entities/TrackingConfig';
import { TrackingEvent } from '../entities/TrackingEvent';

describe('GTMServerAdapter', () => {
  const adapter = new GTMServerAdapter();
  const gtmConfig: GTMConfig = {
    containerId: 'GTM-TEST',
    serverContainerUrl: 'https://gtm.test.example.com',
  };

  function makeConfig(overrides?: Partial<{ gtm: GTMConfig | null; metaCapi: MetaCAPIConfig | null; status: string }>): TrackingConfig {
    return TrackingConfig.reconstitute({
      configId: 'cfg-1',
      storeId: 'store-1',
      organizationId: 'org-1',
      status: (overrides?.status as 'active' | 'disabled') || 'active',
      gtm: overrides?.gtm !== undefined ? overrides.gtm : gtmConfig,
      metaCapi: overrides?.metaCapi !== undefined ? overrides.metaCapi : null,
      eventMappings: [],
      defaultConsentCategory: 'marketing',
      hashPii: true,
      serverSideEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  function makeEvent(overrides?: Partial<{ providers: string[]; consentGranted: boolean }>): TrackingEvent {
    return TrackingEvent.create({
      eventId: 'evt-1',
      storeId: 'store-1',
      sourceEvent: 'order.paid',
      targetEvent: 'Purchase',
      providers: (overrides?.providers as string[]) || ['gtm'],
      userData: { email: 'test@example.com', sessionId: 'sess-1' },
      ecommerceData: { transactionId: 'tx-1', value: 99.99, currency: 'USD' },
      customData: {},
      consentCategory: 'marketing',
      consentGranted: overrides?.consentGranted ?? true,
      timestamp: new Date(),
    });
  }

  it('should have providerName "gtm"', () => {
    expect(adapter.providerName).toBe('gtm');
  });

  it('should send event successfully when GTM is enabled', async () => {
    const config = makeConfig();
    const event = makeEvent();
    const result = await adapter.send(event, config);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('gtm');
    expect(result.eventId).toBe('evt-1');
  });

  it('should return failure when GTM is not enabled', async () => {
    const config = makeConfig({ gtm: null, metaCapi: { pixelId: 'p', accessToken: 't' } });
    const event = makeEvent();
    const result = await adapter.send(event, config);

    expect(result.success).toBe(false);
    expect(result.error).toContain('GTM not enabled');
  });

  it('should validate config correctly', () => {
    expect(adapter.validateConfig(makeConfig())).toBe(true);
    expect(adapter.validateConfig(makeConfig({ gtm: null, metaCapi: { pixelId: 'p', accessToken: 't' } }))).toBe(false);
  });
});

describe('MetaCAPIAdapter', () => {
  const adapter = new MetaCAPIAdapter();
  const metaConfig: MetaCAPIConfig = {
    pixelId: '123456',
    accessToken: 'test-token',
  };

  function makeConfig(overrides?: Partial<{ gtm: GTMConfig | null; metaCapi: MetaCAPIConfig | null; status: string; hashPii: boolean }>): TrackingConfig {
    return TrackingConfig.reconstitute({
      configId: 'cfg-2',
      storeId: 'store-2',
      organizationId: 'org-2',
      status: (overrides?.status as 'active' | 'disabled') || 'active',
      gtm: overrides?.gtm !== undefined ? overrides.gtm : null,
      metaCapi: overrides?.metaCapi !== undefined ? overrides.metaCapi : metaConfig,
      eventMappings: [],
      defaultConsentCategory: 'marketing',
      hashPii: overrides?.hashPii ?? true,
      serverSideEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  function makeEvent(overrides?: Partial<{ providers: string[]; consentGranted: boolean }>): TrackingEvent {
    return TrackingEvent.create({
      eventId: 'evt-2',
      storeId: 'store-2',
      sourceEvent: 'order.paid',
      targetEvent: 'Purchase',
      providers: (overrides?.providers as string[]) || ['meta_capi'],
      userData: { email: 'test@example.com', phone: '+1234567890', sessionId: 'sess-2' },
      ecommerceData: { transactionId: 'tx-2', value: 49.99, currency: 'USD', items: [{ productId: 'p1', name: 'Product 1', quantity: 2, price: 24.99 }] },
      customData: {},
      consentCategory: 'marketing',
      consentGranted: overrides?.consentGranted ?? true,
      timestamp: new Date(),
    });
  }

  it('should have providerName "meta_capi"', () => {
    expect(adapter.providerName).toBe('meta_capi');
  });

  it('should send event successfully when Meta CAPI is enabled', async () => {
    const config = makeConfig();
    const event = makeEvent();
    const result = await adapter.send(event, config);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('meta_capi');
    expect(result.eventId).toBe('evt-2');
  });

  it('should return failure when Meta CAPI is not enabled', async () => {
    const config = makeConfig({ metaCapi: null, gtm: { containerId: 'c', serverContainerUrl: 'u' } });
    const event = makeEvent();
    const result = await adapter.send(event, config);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Meta CAPI not enabled');
  });

  it('should validate config correctly', () => {
    expect(adapter.validateConfig(makeConfig())).toBe(true);
    expect(adapter.validateConfig(makeConfig({ metaCapi: null, gtm: { containerId: 'c', serverContainerUrl: 'u' } }))).toBe(false);
  });
});

describe('TrackingEvent', () => {
  it('should determine which providers to send to based on consent', () => {
    const eventWithConsent = TrackingEvent.create({
      eventId: 'evt-c1',
      storeId: 'store-1',
      sourceEvent: 'order.paid',
      targetEvent: 'Purchase',
      providers: ['gtm', 'meta_capi'],
      userData: {},
      ecommerceData: {},
      customData: {},
      consentCategory: 'marketing',
      consentGranted: true,
      timestamp: new Date(),
    });

    expect(eventWithConsent.shouldSendToGtm()).toBe(true);
    expect(eventWithConsent.shouldSendToMetaCapi()).toBe(true);
  });

  it('should not send to any provider when consent is not granted', () => {
    const eventNoConsent = TrackingEvent.create({
      eventId: 'evt-c2',
      storeId: 'store-1',
      sourceEvent: 'order.paid',
      targetEvent: 'Purchase',
      providers: ['gtm', 'meta_capi'],
      userData: {},
      ecommerceData: {},
      customData: {},
      consentCategory: 'marketing',
      consentGranted: false,
      timestamp: new Date(),
    });

    expect(eventNoConsent.shouldSendToGtm()).toBe(false);
    expect(eventNoConsent.shouldSendToMetaCapi()).toBe(false);
  });

  it('should hash user data for Meta CAPI', () => {
    const event = TrackingEvent.create({
      eventId: 'evt-h1',
      storeId: 'store-1',
      sourceEvent: 'order.paid',
      targetEvent: 'Purchase',
      providers: ['meta_capi'],
      userData: { email: 'Test@Example.COM', phone: '+1 (234) 567-890' },
      ecommerceData: {},
      customData: {},
      consentCategory: 'marketing',
      consentGranted: true,
      timestamp: new Date(),
    });

    const hashed = event.getHashedUserData();
    expect(hashed.email).toMatch(/^sha256:/);
    expect(hashed.phone).toMatch(/^sha256:/);
  });
});
