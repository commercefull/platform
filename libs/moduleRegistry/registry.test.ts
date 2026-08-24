/**
 * Tests for the Module Registry.
 */

import { moduleRegistry } from './registry';
import type { ModuleManifest } from './types';

describe('moduleRegistry', () => {
  beforeEach(() => {
    moduleRegistry.reset();
  });

  afterEach(() => {
    moduleRegistry.reset();
  });

  const requiredManifest: ModuleManifest = {
    name: 'core',
    description: 'Core module',
    requirement: 'required',
    routes: [{ path: '/business/core', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: ['core.event'], publishes: ['core.event'] },
    tables: { names: ['coreTable'] },
  };

  const optionalManifest: ModuleManifest = {
    name: 'optional-mod',
    description: 'Optional module',
    requirement: 'optional',
    dependsOn: ['core'],
    routes: [{ path: '/business/optional', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: ['optional.event'], publishes: [] },
    featureFlagKey: 'module.optional.enabled',
  };

  const independentOptional: ModuleManifest = {
    name: 'independent',
    description: 'Independent optional module',
    requirement: 'optional',
    routes: [{ path: '/business/independent', auth: 'organization' }],
    graphql: { enabled: false },
    events: { subscribes: [], publishes: [] },
  };

  describe('register', () => {
    it('should register a module manifest', () => {
      moduleRegistry.register(requiredManifest);
      expect(moduleRegistry.getManifest('core')).toBeDefined();
    });

    it('should not register duplicate modules', () => {
      moduleRegistry.register(requiredManifest);
      moduleRegistry.register(requiredManifest);
      expect(moduleRegistry.getAllManifests()).toHaveLength(1);
    });

    it('should register multiple manifests', () => {
      moduleRegistry.registerAll([requiredManifest, optionalManifest, independentOptional]);
      expect(moduleRegistry.getAllManifests()).toHaveLength(3);
    });
  });

  describe('initialize', () => {
    it('should always enable required modules', async () => {
      moduleRegistry.register(requiredManifest);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('core')).toBe(true);
    });

    it('should enable optional modules by default (no flag provider)', async () => {
      moduleRegistry.registerAll([requiredManifest, independentOptional]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('independent')).toBe(true);
    });

    it('should disable optional modules when env var is false', async () => {
      process.env.MODULE_INDEPENDENT_ENABLED = 'false';
      moduleRegistry.registerAll([requiredManifest, independentOptional]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('independent')).toBe(false);
      delete process.env.MODULE_INDEPENDENT_ENABLED;
    });

    it('should disable optional module with unmet dependencies', async () => {
      const orphanManifest: ModuleManifest = {
        name: 'orphan',
        description: 'Depends on non-existent module',
        requirement: 'optional',
        dependsOn: ['nonexistent'],
      };
      moduleRegistry.registerAll([requiredManifest, orphanManifest]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('orphan')).toBe(false);
    });

    it('should enable optional module when dependencies are met', async () => {
      moduleRegistry.registerAll([requiredManifest, optionalManifest]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('optional-mod')).toBe(true);
    });

    it('should use feature flag provider when set', async () => {
      moduleRegistry.registerAll([requiredManifest, optionalManifest]);
      moduleRegistry.setFeatureFlagProvider(async (key) => {
        return key === 'module.optional.enabled';
      });
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('optional-mod')).toBe(true);
    });

    it('should disable module when flag provider returns false', async () => {
      moduleRegistry.registerAll([requiredManifest, optionalManifest]);
      moduleRegistry.setFeatureFlagProvider(async () => false);
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('optional-mod')).toBe(false);
    });

    it('should default to enabled when flag provider throws', async () => {
      moduleRegistry.registerAll([requiredManifest, optionalManifest]);
      moduleRegistry.setFeatureFlagProvider(async () => {
        throw new Error('DB unavailable');
      });
      await moduleRegistry.initialize();
      expect(moduleRegistry.isEnabled('optional-mod')).toBe(true);
    });

    it('should only initialize once', async () => {
      moduleRegistry.register(requiredManifest);
      await moduleRegistry.initialize();
      await moduleRegistry.initialize();
      expect(moduleRegistry.getAllManifests()).toHaveLength(1);
    });
  });

  describe('shouldMountRoutes', () => {
    it('should return true for enabled module with routes', async () => {
      moduleRegistry.register(requiredManifest);
      await moduleRegistry.initialize();
      expect(moduleRegistry.shouldMountRoutes('core')).toBe(true);
    });

    it('should return false for unknown module', () => {
      expect(moduleRegistry.shouldMountRoutes('unknown')).toBe(false);
    });

    it('should return false for module with no routes', async () => {
      const noRoutes: ModuleManifest = {
        name: 'no-routes',
        description: 'Module without routes',
        requirement: 'required',
      };
      moduleRegistry.register(noRoutes);
      await moduleRegistry.initialize();
      expect(moduleRegistry.shouldMountRoutes('no-routes')).toBe(false);
    });
  });

  describe('shouldIncludeGraphQL', () => {
    it('should return true for enabled module with graphql', async () => {
      moduleRegistry.register(requiredManifest);
      await moduleRegistry.initialize();
      expect(moduleRegistry.shouldIncludeGraphQL('core')).toBe(true);
    });

    it('should return false for module with graphql disabled', async () => {
      moduleRegistry.registerAll([requiredManifest, independentOptional]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.shouldIncludeGraphQL('independent')).toBe(false);
    });
  });

  describe('shouldRegisterEvents', () => {
    it('should return true for enabled module with event subscriptions', async () => {
      moduleRegistry.register(requiredManifest);
      await moduleRegistry.initialize();
      expect(moduleRegistry.shouldRegisterEvents('core')).toBe(true);
    });

    it('should return false for module with no event subscriptions', async () => {
      moduleRegistry.registerAll([requiredManifest, independentOptional]);
      await moduleRegistry.initialize();
      expect(moduleRegistry.shouldRegisterEvents('independent')).toBe(false);
    });
  });

  describe('getDisabledModules', () => {
    it('should return list of disabled modules', async () => {
      process.env.MODULE_INDEPENDENT_ENABLED = 'false';
      moduleRegistry.registerAll([requiredManifest, independentOptional]);
      await moduleRegistry.initialize();
      const disabled = moduleRegistry.getDisabledModules();
      expect(disabled).toContain('independent');
      expect(disabled).not.toContain('core');
      delete process.env.MODULE_INDEPENDENT_ENABLED;
    });

    it('should return empty array when all enabled', async () => {
      moduleRegistry.register(requiredManifest);
      await moduleRegistry.initialize();
      expect(moduleRegistry.getDisabledModules()).toHaveLength(0);
    });
  });

  describe('getEnabledManifests', () => {
    it('should return only enabled manifests', async () => {
      process.env.MODULE_INDEPENDENT_ENABLED = 'false';
      moduleRegistry.registerAll([requiredManifest, independentOptional]);
      await moduleRegistry.initialize();
      const enabled = moduleRegistry.getEnabledManifests();
      expect(enabled).toHaveLength(1);
      expect(enabled[0].name).toBe('core');
      delete process.env.MODULE_INDEPENDENT_ENABLED;
    });
  });

  describe('reset', () => {
    it('should clear all state', async () => {
      moduleRegistry.register(requiredManifest);
      await moduleRegistry.initialize();
      moduleRegistry.reset();
      expect(moduleRegistry.getAllManifests()).toHaveLength(0);
      expect(moduleRegistry.isEnabled('core')).toBe(false);
    });
  });
});
