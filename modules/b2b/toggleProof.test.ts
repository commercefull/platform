import { moduleRegistry } from '../../boot/moduleManifests';
import type { ModuleManifest } from '../../libs/moduleRegistry/types';

const requiredManifests: ModuleManifest[] = [
  {
    name: 'identity',
    description: 'Identity',
    requirement: 'required',
    routes: [{ path: '/business/identity', auth: 'organization' }],
    graphql: { enabled: false },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['user'] },
  },
  {
    name: 'order',
    description: 'Order',
    requirement: 'required',
    routes: [{ path: '/business/order', auth: 'organization' }],
    graphql: { enabled: false },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['order'] },
  },
  {
    name: 'product',
    description: 'Product',
    requirement: 'required',
    routes: [{ path: '/business/product', auth: 'organization' }],
    graphql: { enabled: false },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['product'] },
  },
];

const b2bManifest: ModuleManifest = {
  name: 'b2b',
  description: 'B2B commerce',
  requirement: 'optional',
  dependsOn: ['identity', 'order'],
  routes: [{ path: '/business/b2b', auth: 'organization' }],
  graphql: { enabled: false },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['b2bCompany'] },
  featureFlagKey: 'module.b2b.enabled',
};

const marketplaceManifest: ModuleManifest = {
  name: 'marketplace',
  description: 'Multi-vendor marketplace',
  requirement: 'optional',
  dependsOn: ['identity', 'order', 'product'],
  routes: [{ path: '/business/marketplace', auth: 'organization' }],
  graphql: { enabled: false },
  events: { subscribes: [], publishes: [] },
  tables: { names: ['marketplaceVendor'] },
  featureFlagKey: 'module.marketplace.enabled',
};

describe('Phase 6 — Toggle Proof: B2B and Marketplace engines', () => {
  beforeEach(() => {
    moduleRegistry.reset();
  });

  describe('B2B module toggle', () => {
    it('should be enabled by default (no env var set)', async () => {
      delete process.env.MODULE_B2B_ENABLED;
      moduleRegistry.registerAll([...requiredManifests, b2bManifest]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('b2b')).toBe(true);
      expect(moduleRegistry.shouldMountRoutes('b2b')).toBe(true);
    });

    it('should be disabled when MODULE_B2B_ENABLED=false', async () => {
      process.env.MODULE_B2B_ENABLED = 'false';
      moduleRegistry.registerAll([...requiredManifests, b2bManifest]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('b2b')).toBe(false);
      expect(moduleRegistry.shouldMountRoutes('b2b')).toBe(false);
      expect(moduleRegistry.shouldRunMigrations('b2b')).toBe(false);
      delete process.env.MODULE_B2B_ENABLED;
    });
  });

  describe('Marketplace module toggle', () => {
    it('should be enabled by default (no env var set)', async () => {
      delete process.env.MODULE_MARKETPLACE_ENABLED;
      moduleRegistry.registerAll([...requiredManifests, marketplaceManifest]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('marketplace')).toBe(true);
      expect(moduleRegistry.shouldMountRoutes('marketplace')).toBe(true);
    });

    it('should be disabled when MODULE_MARKETPLACE_ENABLED=false', async () => {
      process.env.MODULE_MARKETPLACE_ENABLED = 'false';
      moduleRegistry.registerAll([...requiredManifests, marketplaceManifest]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('marketplace')).toBe(false);
      expect(moduleRegistry.shouldMountRoutes('marketplace')).toBe(false);
      expect(moduleRegistry.shouldRunMigrations('marketplace')).toBe(false);
      delete process.env.MODULE_MARKETPLACE_ENABLED;
    });
  });

  describe('Both engines disabled simultaneously', () => {
    it('should disable both b2b and marketplace without affecting required modules', async () => {
      process.env.MODULE_B2B_ENABLED = 'false';
      process.env.MODULE_MARKETPLACE_ENABLED = 'false';
      moduleRegistry.registerAll([...requiredManifests, b2bManifest, marketplaceManifest]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('identity')).toBe(true);
      expect(moduleRegistry.isEnabled('order')).toBe(true);
      expect(moduleRegistry.isEnabled('product')).toBe(true);
      expect(moduleRegistry.isEnabled('b2b')).toBe(false);
      expect(moduleRegistry.isEnabled('marketplace')).toBe(false);
      expect(moduleRegistry.shouldMountRoutes('identity')).toBe(true);
      expect(moduleRegistry.shouldMountRoutes('b2b')).toBe(false);
      expect(moduleRegistry.shouldMountRoutes('marketplace')).toBe(false);
      delete process.env.MODULE_B2B_ENABLED;
      delete process.env.MODULE_MARKETPLACE_ENABLED;
    });
  });

  describe('Both engines enabled simultaneously', () => {
    it('should enable both b2b and marketplace alongside required modules', async () => {
      delete process.env.MODULE_B2B_ENABLED;
      delete process.env.MODULE_MARKETPLACE_ENABLED;
      moduleRegistry.registerAll([...requiredManifests, b2bManifest, marketplaceManifest]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('b2b')).toBe(true);
      expect(moduleRegistry.isEnabled('marketplace')).toBe(true);
      expect(moduleRegistry.shouldMountRoutes('b2b')).toBe(true);
      expect(moduleRegistry.shouldMountRoutes('marketplace')).toBe(true);
      expect(moduleRegistry.shouldRunMigrations('b2b')).toBe(true);
      expect(moduleRegistry.shouldRunMigrations('marketplace')).toBe(true);
    });
  });
});
