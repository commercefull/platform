/**
 * Module Registry
 *
 * Central registry for module manifests. Tracks which modules are enabled
 * and provides helpers for conditional route mounting, GraphQL schema
 * composition, event handler registration, and migration gating.
 *
 * Module enabled state is determined by:
 * 1. Feature flags from the configuration module (DB-backed)
 * 2. Environment variables (fallback / override)
 * 3. The manifest's `requirement` field (required modules always load)
 */

import type { ModuleManifest } from './types';
import { logger } from '../logger';

/** Feature flag provider — returns true if the flag is enabled. */
export type FeatureFlagProvider = (key: string) => Promise<boolean>;

class ModuleRegistryClass {
  private manifests = new Map<string, ModuleManifest>();
  private enabledModules = new Set<string>();
  private flagProvider: FeatureFlagProvider | null = null;
  private initialized = false;

  /**
   * Register a module manifest.
   */
  register(manifest: ModuleManifest): void {
    if (this.manifests.has(manifest.name)) {
      logger.warning('Module already registered, skipping', { module: manifest.name });
      return;
    }
    this.manifests.set(manifest.name, manifest);
  }

  /**
   * Register multiple module manifests.
   */
  registerAll(manifests: ModuleManifest[]): void {
    for (const m of manifests) {
      this.register(m);
    }
  }

  /**
   * Set the feature flag provider (called after DB is available).
   */
  setFeatureFlagProvider(provider: FeatureFlagProvider): void {
    this.flagProvider = provider;
  }

  /**
   * Initialize the registry — resolves which modules are enabled.
   * Must be called after all manifests are registered and the flag
   * provider is set (if any).
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const candidates = new Set<string>();
    for (const [name, manifest] of this.manifests) {
      if (manifest.requirement === 'required' || (await this.resolveEnabled(manifest))) {
        candidates.add(name);
      }
    }
    this.enableCandidates(candidates);
  }

  initializeSync(): void {
    if (this.initialized) {
      return;
    }

    const candidates = new Set<string>();
    for (const [name, manifest] of this.manifests) {
      if (manifest.requirement === 'required' || this.resolveEnabledSync(manifest)) {
        candidates.add(name);
      }
    }
    this.enableCandidates(candidates);
  }

  /**
   * Check if a module is enabled.
   */
  isEnabled(moduleName: string): boolean {
    return this.enabledModules.has(moduleName);
  }

  /**
   * Get a module manifest.
   */
  getManifest(moduleName: string): ModuleManifest | undefined {
    return this.manifests.get(moduleName);
  }

  /**
   * Get all registered manifests.
   */
  getAllManifests(): ModuleManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Get all enabled module manifests.
   */
  getEnabledManifests(): ModuleManifest[] {
    return this.getAllManifests().filter(m => this.isEnabled(m.name));
  }

  /**
   * Get all disabled module names.
   */
  getDisabledModules(): string[] {
    return this.getAllManifests()
      .filter(m => !this.isEnabled(m.name))
      .map(m => m.name);
  }

  /**
   * Check if a module's routes should be mounted.
   */
  shouldMountRoutes(moduleName: string): boolean {
    const manifest = this.manifests.get(moduleName);
    if (!manifest) return false;
    return this.isEnabled(moduleName) && (manifest.routes?.length ?? 0) > 0;
  }

  /**
   * Check if a module's GraphQL schema should be included.
   */
  shouldIncludeGraphQL(moduleName: string): boolean {
    const manifest = this.manifests.get(moduleName);
    if (!manifest) return false;
    return this.isEnabled(moduleName) && (manifest.graphql?.enabled ?? false);
  }

  /**
   * Check if a module's event handlers should be registered.
   */
  shouldRegisterEvents(moduleName: string): boolean {
    const manifest = this.manifests.get(moduleName);
    if (!manifest) return false;
    return this.isEnabled(moduleName) && (manifest.events?.subscribes.length ?? 0) > 0;
  }

  /**
   * Check if a module's migrations should run.
   */
  shouldRunMigrations(moduleName: string): boolean {
    return this.isEnabled(moduleName);
  }

  /**
   * Reset the registry (for testing).
   */
  reset(): void {
    this.manifests.clear();
    this.enabledModules.clear();
    this.flagProvider = null;
    this.initialized = false;
  }

  // ── Internal helpers ──────────────────────────────────────────

  private async resolveEnabled(manifest: ModuleManifest): Promise<boolean> {
    // No feature flag → check env var, default to enabled
    if (!manifest.featureFlagKey) {
      return this.resolveEnabledSync(manifest);
    }

    // Feature flag provider → ask it
    if (this.flagProvider) {
      try {
        return await this.flagProvider(manifest.featureFlagKey);
      } catch (err: unknown) {
        logger.warning('Feature flag provider error, defaulting to enabled', {
          module: manifest.name,
          flag: manifest.featureFlagKey,
          error: (err as Error).message,
        });
        return true;
      }
    }

    // No provider → check env var, default to enabled
    return this.resolveEnabledSync(manifest);
  }

  private resolveEnabledSync(manifest: ModuleManifest): boolean {
    const envVal = process.env[`MODULE_${manifest.name.toUpperCase()}_ENABLED`];
    return envVal !== 'false' && envVal !== '0';
  }

  private enableCandidates(candidates: Set<string>): void {
    this.enabledModules.clear();

    for (const [name, manifest] of this.manifests) {
      if (manifest.requirement === 'required') {
        this.enabledModules.add(name);
      }
    }

    const pending = new Set([...candidates].filter(name => !this.enabledModules.has(name)));
    let enabledCount: number;
    do {
      enabledCount = this.enabledModules.size;
      for (const name of pending) {
        const manifest = this.manifests.get(name);
        if (manifest && this.checkDependencies(manifest)) {
          this.enabledModules.add(name);
          pending.delete(name);
        }
      }
    } while (this.enabledModules.size > enabledCount);

    for (const name of pending) {
      logger.warning('Module disabled — unmet dependencies', {
        module: name,
        dependsOn: this.manifests.get(name)?.dependsOn,
      });
    }

    this.initialized = true;
    logger.info('Module registry initialized', {
      total: this.manifests.size,
      enabled: this.enabledModules.size,
      disabled: this.manifests.size - this.enabledModules.size,
    });
  }

  private checkDependencies(manifest: ModuleManifest): boolean {
    if (!manifest.dependsOn || manifest.dependsOn.length === 0) {
      return true;
    }
    return manifest.dependsOn.every(dep => this.isEnabled(dep));
  }
}

/** Singleton instance. */
export const moduleRegistry = new ModuleRegistryClass();
