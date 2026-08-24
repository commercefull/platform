import { TrackingConfig, GTMConfig, MetaCAPIConfig, EventMapping } from './TrackingConfig';
import { TrackingValidationError } from '../errors/TrackingErrors';

describe('TrackingConfig', () => {
  const validGtm: GTMConfig = {
    containerId: 'GTM-XXXXXXX',
    serverContainerUrl: 'https://gtm.example.com',
  };

  const validMetaCapi: MetaCAPIConfig = {
    pixelId: '1234567890',
    accessToken: 'test-token',
  };

  describe('create', () => {
    it('should create a valid config with GTM only', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-1',
        storeId: 'store-1',
        organizationId: 'org-1',
        gtm: validGtm,
      });

      expect(config.configId).toBe('cfg-1');
      expect(config.storeId).toBe('store-1');
      expect(config.organizationId).toBe('org-1');
      expect(config.status).toBe('active');
      expect(config.isGtmEnabled()).toBe(true);
      expect(config.isMetaCapiEnabled()).toBe(false);
      expect(config.hashPii).toBe(true);
      expect(config.serverSideEnabled).toBe(true);
    });

    it('should create a valid config with Meta CAPI only', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-2',
        storeId: 'store-2',
        organizationId: 'org-1',
        metaCapi: validMetaCapi,
      });

      expect(config.isGtmEnabled()).toBe(false);
      expect(config.isMetaCapiEnabled()).toBe(true);
    });

    it('should create a config with both providers', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-3',
        storeId: 'store-3',
        organizationId: 'org-1',
        gtm: validGtm,
        metaCapi: validMetaCapi,
      });

      expect(config.isGtmEnabled()).toBe(true);
      expect(config.isMetaCapiEnabled()).toBe(true);
    });

    it('should throw if no provider is configured', () => {
      expect(() =>
        TrackingConfig.create({
          configId: 'cfg-4',
          storeId: 'store-4',
          organizationId: 'org-1',
        }),
      ).toThrow(TrackingValidationError);
    });

    it('should throw if storeId is empty', () => {
      expect(() =>
        TrackingConfig.create({
          configId: 'cfg-5',
          storeId: '',
          organizationId: 'org-1',
          gtm: validGtm,
        }),
      ).toThrow(TrackingValidationError);
    });

    it('should throw if organizationId is empty', () => {
      expect(() =>
        TrackingConfig.create({
          configId: 'cfg-6',
          storeId: 'store-6',
          organizationId: '',
          gtm: validGtm,
        }),
      ).toThrow(TrackingValidationError);
    });

    it('should use default event mappings when useDefaultMappings is true', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-7',
        storeId: 'store-7',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: true,
      });

      expect(config.eventMappings.length).toBeGreaterThan(0);
    });

    it('should have empty event mappings when useDefaultMappings is false', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-8',
        storeId: 'store-8',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: false,
      });

      expect(config.eventMappings).toEqual([]);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const config = TrackingConfig.reconstitute({
        configId: 'cfg-r1',
        storeId: 'store-r1',
        organizationId: 'org-r1',
        status: 'disabled',
        gtm: validGtm,
        metaCapi: null,
        eventMappings: [],
        defaultConsentCategory: 'analytics',
        hashPii: false,
        serverSideEnabled: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      });

      expect(config.status).toBe('disabled');
      expect(config.isActive()).toBe(false);
      expect(config.hashPii).toBe(false);
      expect(config.serverSideEnabled).toBe(false);
    });
  });

  describe('event mappings', () => {
    const mapping: EventMapping = {
      sourceEvent: 'order.paid',
      targetEvent: 'Purchase',
      providers: ['gtm', 'meta_capi'],
      consentCategory: 'marketing',
    };

    it('should add an event mapping', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-m1',
        storeId: 'store-m1',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: false,
      });

      config.addEventMapping(mapping);
      expect(config.eventMappings).toHaveLength(1);
      expect(config.findMapping('order.paid')).toBeDefined();
    });

    it('should throw when adding duplicate mapping', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-m2',
        storeId: 'store-m2',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: false,
      });

      config.addEventMapping(mapping);
      expect(() => config.addEventMapping(mapping)).toThrow(TrackingValidationError);
    });

    it('should remove an event mapping', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-m3',
        storeId: 'store-m3',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: false,
      });

      config.addEventMapping(mapping);
      config.removeEventMapping('order.paid');
      expect(config.eventMappings).toHaveLength(0);
      expect(config.findMapping('order.paid')).toBeUndefined();
    });

    it('should update an event mapping', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-m4',
        storeId: 'store-m4',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: false,
      });

      config.addEventMapping(mapping);
      config.updateEventMapping('order.paid', { targetEvent: 'CustomPurchase' });
      expect(config.findMapping('order.paid')?.targetEvent).toBe('CustomPurchase');
    });

    it('should throw when updating non-existent mapping', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-m5',
        storeId: 'store-m5',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: false,
      });

      expect(() => config.updateEventMapping('nonexistent', { targetEvent: 'Test' })).toThrow(TrackingValidationError);
    });
  });

  describe('shouldSendToProvider', () => {
    it('should return true for mapped provider when active', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-s1',
        storeId: 'store-s1',
        organizationId: 'org-1',
        gtm: validGtm,
        metaCapi: validMetaCapi,
        useDefaultMappings: true,
      });

      expect(config.shouldSendToProvider('order.paid', 'gtm')).toBe(true);
      expect(config.shouldSendToProvider('order.paid', 'meta_capi')).toBe(true);
    });

    it('should return false when disabled', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-s2',
        storeId: 'store-s2',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: true,
      });

      config.disable();
      expect(config.shouldSendToProvider('order.paid', 'gtm')).toBe(false);
    });

    it('should return false for unmapped events', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-s3',
        storeId: 'store-s3',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: false,
      });

      expect(config.shouldSendToProvider('unknown.event', 'gtm')).toBe(false);
    });
  });

  describe('getConsentCategory', () => {
    it('should return mapping consent category', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-c1',
        storeId: 'store-c1',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: true,
      });

      expect(config.getConsentCategory('order.paid')).toBe('marketing');
      expect(config.getConsentCategory('order.created')).toBe('analytics');
    });

    it('should return default consent category for unmapped events', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-c2',
        storeId: 'store-c2',
        organizationId: 'org-1',
        gtm: validGtm,
        useDefaultMappings: false,
        defaultConsentCategory: 'thirdParty',
      });

      expect(config.getConsentCategory('unknown.event')).toBe('thirdParty');
    });
  });

  describe('lifecycle', () => {
    it('should activate and disable', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-l1',
        storeId: 'store-l1',
        organizationId: 'org-1',
        gtm: validGtm,
      });

      expect(config.isActive()).toBe(true);
      config.disable();
      expect(config.isActive()).toBe(false);
      config.activate();
      expect(config.isActive()).toBe(true);
    });
  });

  describe('provider management', () => {
    it('should update GTM config', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-p1',
        storeId: 'store-p1',
        organizationId: 'org-1',
        gtm: validGtm,
      });

      config.updateGtm({ containerId: 'GTM-NEW', serverContainerUrl: 'https://new.example.com' });
      expect(config.gtm?.containerId).toBe('GTM-NEW');
    });

    it('should remove GTM when Meta CAPI exists', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-p2',
        storeId: 'store-p2',
        organizationId: 'org-1',
        gtm: validGtm,
        metaCapi: validMetaCapi,
      });

      config.removeGtm();
      expect(config.gtm).toBeNull();
      expect(config.metaCapi).not.toBeNull();
    });

    it('should throw when removing last provider', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-p3',
        storeId: 'store-p3',
        organizationId: 'org-1',
        gtm: validGtm,
      });

      expect(() => config.removeGtm()).toThrow(TrackingValidationError);
    });

    it('should update Meta CAPI config', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-p4',
        storeId: 'store-p4',
        organizationId: 'org-1',
        metaCapi: validMetaCapi,
      });

      config.updateMetaCapi({ pixelId: 'new-pixel', accessToken: 'new-token' });
      expect(config.metaCapi?.pixelId).toBe('new-pixel');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON with computed fields', () => {
      const config = TrackingConfig.create({
        configId: 'cfg-j1',
        storeId: 'store-j1',
        organizationId: 'org-1',
        gtm: validGtm,
        metaCapi: validMetaCapi,
      });

      const json = config.toJSON() as Record<string, unknown>;
      expect(json.configId).toBe('cfg-j1');
      expect(json.isGtmEnabled).toBe(true);
      expect(json.isMetaCapiEnabled).toBe(true);
    });
  });
});
