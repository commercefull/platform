/**
 * Configuration Management Service
 * Provides dynamic platform configuration with caching
 * for the CommerceFull platform - Phase 8
 */

import { query, queryOne } from '../../../libs/db';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface PlatformConfig {
  configId: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: string;
  description?: string;
  isSecret: boolean;
  isEditable: boolean;
  validationRules?: Record<string, any>;
  merchantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigCategory {
  name: string;
  description: string;
  configs: PlatformConfig[];
}

// ============================================================================
// In-Memory Cache
// ============================================================================

const configCache = new Map<string, { value: any; expiresAt: number }>();
const CACHE_TTL_MS = 60000; // 1 minute

function getCacheKey(key: string, merchantId?: string): string {
  return merchantId ? `${merchantId}:${key}` : key;
}

function getFromCache(key: string, merchantId?: string): any | undefined {
  const cacheKey = getCacheKey(key, merchantId);
  const cached = configCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (cached) {
    configCache.delete(cacheKey);
  }

  return undefined;
}

function setInCache(key: string, value: any, merchantId?: string): void {
  const cacheKey = getCacheKey(key, merchantId);
  configCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

function invalidateCache(key?: string, merchantId?: string): void {
  if (key) {
    const cacheKey = getCacheKey(key, merchantId);
    configCache.delete(cacheKey);
  } else {
    configCache.clear();
  }
}

// ============================================================================
// Configuration CRUD
// ============================================================================

export async function getConfig<T = any>(key: string, merchantId?: string): Promise<T | undefined> {
  // Check cache first
  const cached = getFromCache(key, merchantId);
  if (cached !== undefined) {
    return cached as T;
  }

  // Query database
  const row = await queryOne<any>(
    merchantId
      ? `SELECT * FROM "platformConfig" WHERE "key" = $1 AND ("merchantId" = $2 OR "merchantId" IS NULL) ORDER BY "merchantId" DESC NULLS LAST LIMIT 1`
      : `SELECT * FROM "platformConfig" WHERE "key" = $1 AND "merchantId" IS NULL`,
    merchantId ? [key, merchantId] : [key]
  );

  if (!row) return undefined;

  const config = mapToPlatformConfig(row);
  const value = parseConfigValue(config.value, config.type);

  // Cache the result
  setInCache(key, value, merchantId);

  return value as T;
}

export async function getConfigWithDefault<T = any>(
  key: string,
  defaultValue: T,
  merchantId?: string
): Promise<T> {
  const value = await getConfig<T>(key, merchantId);
  return value !== undefined ? value : defaultValue;
}

export async function setConfig(
  key: string,
  value: any,
  options: {
    type?: PlatformConfig['type'];
    category?: string;
    description?: string;
    isSecret?: boolean;
    isEditable?: boolean;
    validationRules?: Record<string, any>;
    merchantId?: string;
  } = {}
): Promise<PlatformConfig> {
  const now = new Date();
  const type = options.type || inferType(value);
  const serializedValue = serializeConfigValue(value, type);

  // Check if config exists
  const existing = await queryOne<any>(
    options.merchantId
      ? `SELECT * FROM "platformConfig" WHERE "key" = $1 AND "merchantId" = $2`
      : `SELECT * FROM "platformConfig" WHERE "key" = $1 AND "merchantId" IS NULL`,
    options.merchantId ? [key, options.merchantId] : [key]
  );

  if (existing) {
    // Update existing config
    await query(
      `UPDATE "platformConfig" SET
        "value" = $1,
        "type" = $2,
        "category" = COALESCE($3, "category"),
        "description" = COALESCE($4, "description"),
        "isSecret" = COALESCE($5, "isSecret"),
        "isEditable" = COALESCE($6, "isEditable"),
        "validationRules" = COALESCE($7, "validationRules"),
        "updatedAt" = $8
       WHERE "configId" = $9`,
      [
        serializedValue,
        type,
        options.category || null,
        options.description || null,
        options.isSecret ?? null,
        options.isEditable ?? null,
        options.validationRules ? JSON.stringify(options.validationRules) : null,
        now,
        existing.configId
      ]
    );

    invalidateCache(key, options.merchantId);

    return {
      ...mapToPlatformConfig(existing),
      value: serializedValue,
      type,
      updatedAt: now
    };
  } else {
    // Create new config
    const configId = uuidv4();

    await query(
      `INSERT INTO "platformConfig" (
        "configId", "key", "value", "type", "category", "description",
        "isSecret", "isEditable", "validationRules", "merchantId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        configId,
        key,
        serializedValue,
        type,
        options.category || 'general',
        options.description || null,
        options.isSecret ?? false,
        options.isEditable ?? true,
        options.validationRules ? JSON.stringify(options.validationRules) : null,
        options.merchantId || null,
        now,
        now
      ]
    );

    invalidateCache(key, options.merchantId);

    return {
      configId,
      key,
      value: serializedValue,
      type,
      category: options.category || 'general',
      description: options.description,
      isSecret: options.isSecret ?? false,
      isEditable: options.isEditable ?? true,
      validationRules: options.validationRules,
      merchantId: options.merchantId,
      createdAt: now,
      updatedAt: now
    };
  }
}

export async function deleteConfig(key: string, merchantId?: string): Promise<boolean> {
  await query(
    merchantId
      ? `DELETE FROM "platformConfig" WHERE "key" = $1 AND "merchantId" = $2`
      : `DELETE FROM "platformConfig" WHERE "key" = $1 AND "merchantId" IS NULL`,
    merchantId ? [key, merchantId] : [key]
  );

  invalidateCache(key, merchantId);
  return true;
}

// ============================================================================
// Bulk Operations
// ============================================================================

export async function getConfigsByCategory(
  category: string,
  merchantId?: string
): Promise<PlatformConfig[]> {
  const rows = await query<Array<any>>(
    merchantId
      ? `SELECT * FROM "platformConfig" WHERE "category" = $1 AND ("merchantId" = $2 OR "merchantId" IS NULL) ORDER BY "key"`
      : `SELECT * FROM "platformConfig" WHERE "category" = $1 AND "merchantId" IS NULL ORDER BY "key"`,
    merchantId ? [category, merchantId] : [category]
  );

  return (rows || []).map(mapToPlatformConfig);
}

export async function getAllConfigs(merchantId?: string): Promise<PlatformConfig[]> {
  const rows = await query<Array<any>>(
    merchantId
      ? `SELECT * FROM "platformConfig" WHERE "merchantId" = $1 OR "merchantId" IS NULL ORDER BY "category", "key"`
      : `SELECT * FROM "platformConfig" WHERE "merchantId" IS NULL ORDER BY "category", "key"`,
    merchantId ? [merchantId] : []
  );

  return (rows || []).map(mapToPlatformConfig);
}

export async function getConfigCategories(merchantId?: string): Promise<ConfigCategory[]> {
  const configs = await getAllConfigs(merchantId);

  const categoryMap = new Map<string, PlatformConfig[]>();
  for (const config of configs) {
    const existing = categoryMap.get(config.category) || [];
    existing.push(config);
    categoryMap.set(config.category, existing);
  }

  return Array.from(categoryMap.entries()).map(([name, configs]) => ({
    name,
    description: getCategoryDescription(name),
    configs
  }));
}

export async function setMultipleConfigs(
  configs: Array<{ key: string; value: any; options?: Parameters<typeof setConfig>[2] }>
): Promise<PlatformConfig[]> {
  const results: PlatformConfig[] = [];

  for (const { key, value, options } of configs) {
    const result = await setConfig(key, value, options);
    results.push(result);
  }

  return results;
}

// ============================================================================
// Feature Flags
// ============================================================================

export async function isFeatureEnabled(
  featureKey: string,
  merchantId?: string
): Promise<boolean> {
  const value = await getConfig<boolean>(`feature.${featureKey}`, merchantId);
  return value === true;
}

export async function setFeatureFlag(
  featureKey: string,
  enabled: boolean,
  merchantId?: string
): Promise<void> {
  await setConfig(`feature.${featureKey}`, enabled, {
    type: 'boolean',
    category: 'features',
    description: `Feature flag: ${featureKey}`,
    merchantId
  });
}

export async function getFeatureFlags(merchantId?: string): Promise<Record<string, boolean>> {
  const configs = await getConfigsByCategory('features', merchantId);

  return configs.reduce((acc, config) => {
    const featureKey = config.key.replace('feature.', '');
    acc[featureKey] = parseConfigValue(config.value, config.type) === true;
    return acc;
  }, {} as Record<string, boolean>);
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_CONFIGS: Array<{
  key: string;
  value: any;
  type: PlatformConfig['type'];
  category: string;
  description: string;
}> = [
  // General Settings
  { key: 'platform.name', value: 'CommerceFull', type: 'string', category: 'general', description: 'Platform name' },
  { key: 'platform.timezone', value: 'UTC', type: 'string', category: 'general', description: 'Default timezone' },
  { key: 'platform.currency', value: 'USD', type: 'string', category: 'general', description: 'Default currency' },
  { key: 'platform.locale', value: 'en-US', type: 'string', category: 'general', description: 'Default locale' },

  // Order Settings
  { key: 'order.prefix', value: 'ORD-', type: 'string', category: 'orders', description: 'Order number prefix' },
  { key: 'order.autoConfirm', value: false, type: 'boolean', category: 'orders', description: 'Auto-confirm orders' },
  { key: 'order.expirationMinutes', value: 30, type: 'number', category: 'orders', description: 'Pending order expiration time' },

  // Inventory Settings
  { key: 'inventory.lowStockThreshold', value: 10, type: 'number', category: 'inventory', description: 'Low stock alert threshold' },
  { key: 'inventory.trackInventory', value: true, type: 'boolean', category: 'inventory', description: 'Enable inventory tracking' },
  { key: 'inventory.allowBackorder', value: false, type: 'boolean', category: 'inventory', description: 'Allow backorders' },

  // Shipping Settings
  { key: 'shipping.freeShippingThreshold', value: 100, type: 'number', category: 'shipping', description: 'Free shipping minimum order value' },
  { key: 'shipping.defaultCarrier', value: 'standard', type: 'string', category: 'shipping', description: 'Default shipping carrier' },

  // Payment Settings
  { key: 'payment.captureMode', value: 'automatic', type: 'string', category: 'payments', description: 'Payment capture mode (automatic/manual)' },
  { key: 'payment.allowedMethods', value: ['card', 'paypal'], type: 'array', category: 'payments', description: 'Allowed payment methods' },

  // Email Settings
  { key: 'email.fromName', value: 'CommerceFull', type: 'string', category: 'email', description: 'Email sender name' },
  { key: 'email.fromAddress', value: 'noreply@commercefull.com', type: 'string', category: 'email', description: 'Email sender address' },

  // Security Settings
  { key: 'security.sessionTimeout', value: 3600, type: 'number', category: 'security', description: 'Session timeout in seconds' },
  { key: 'security.maxLoginAttempts', value: 5, type: 'number', category: 'security', description: 'Max failed login attempts' },
  { key: 'security.lockoutDuration', value: 900, type: 'number', category: 'security', description: 'Account lockout duration in seconds' },

  // Feature Flags
  { key: 'feature.subscriptions', value: true, type: 'boolean', category: 'features', description: 'Enable subscriptions' },
  { key: 'feature.loyalty', value: true, type: 'boolean', category: 'features', description: 'Enable loyalty program' },
  { key: 'feature.b2b', value: true, type: 'boolean', category: 'features', description: 'Enable B2B features' },
  { key: 'feature.multiCurrency', value: false, type: 'boolean', category: 'features', description: 'Enable multi-currency support' },
  { key: 'feature.multiLanguage', value: false, type: 'boolean', category: 'features', description: 'Enable multi-language support' }
];

export async function initializeDefaultConfigs(): Promise<void> {
  for (const config of DEFAULT_CONFIGS) {
    const existing = await getConfig(config.key);
    if (existing === undefined) {
      await setConfig(config.key, config.value, {
        type: config.type,
        category: config.category,
        description: config.description
      });
    }
  }
  console.log('Default configurations initialized');
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToPlatformConfig(row: any): PlatformConfig {
  return {
    configId: row.configId,
    key: row.key,
    value: row.value,
    type: row.type,
    category: row.category,
    description: row.description,
    isSecret: row.isSecret,
    isEditable: row.isEditable,
    validationRules: row.validationRules ? (typeof row.validationRules === 'string' ? JSON.parse(row.validationRules) : row.validationRules) : undefined,
    merchantId: row.merchantId,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function inferType(value: any): PlatformConfig['type'] {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  return 'json';
}

function serializeConfigValue(value: any, type: PlatformConfig['type']): string {
  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      return String(value);
    case 'boolean':
      return String(value);
    case 'json':
    case 'array':
      return JSON.stringify(value);
    default:
      return String(value);
  }
}

function parseConfigValue(value: string, type: PlatformConfig['type']): any {
  switch (type) {
    case 'string':
      return value;
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value === 'true';
    case 'json':
    case 'array':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    general: 'General platform settings',
    orders: 'Order processing settings',
    inventory: 'Inventory management settings',
    shipping: 'Shipping and delivery settings',
    payments: 'Payment processing settings',
    email: 'Email notification settings',
    security: 'Security and authentication settings',
    features: 'Feature flags and toggles'
  };

  return descriptions[category] || `${category} settings`;
}
