/**
 * Central Module Manifest Registration
 *
 * Collects each module's own `manifest.ts` (exported through its barrel)
 * and registers them with the module registry at boot, before routes,
 * GraphQL, and event handlers are wired up.
 *
 * Required modules (identity, order, product, payment, configuration,
 * organization) always load. Optional modules can be toggled off via
 * feature flags or env vars.
 */

import { moduleRegistry } from '../libs/moduleRegistry';
import type { ModuleManifest } from '../libs/moduleRegistry';
import { logger } from '../libs/logger';

import { manifest as analyticsManifest } from '../modules/analytics/manifest';
import { manifest as auditManifest } from '../modules/audit/manifest';
import { manifest as automationManifest } from '../modules/automation/manifest';
import { manifest as b2bManifest } from '../modules/b2b/manifest';
import { manifest as basketManifest } from '../modules/basket/manifest';
import { manifest as checkoutManifest } from '../modules/checkout/manifest';
import { manifest as configurationManifest } from '../modules/configuration/manifest';
import { manifest as contentManifest } from '../modules/content/manifest';
import { manifest as couponManifest } from '../modules/coupon/manifest';
import { manifest as customerManifest } from '../modules/customer/manifest';
import { manifest as fulfillmentManifest } from '../modules/fulfillment/manifest';
import { manifest as gdprManifest } from '../modules/gdpr/manifest';
import { manifest as identityManifest } from '../modules/identity/manifest';
import { manifest as integrationManifest } from '../modules/integration/manifest';
import { manifest as inventoryManifest } from '../modules/inventory/manifest';
import { manifest as localizationManifest } from '../modules/localization/manifest';
import { manifest as loyaltyManifest } from '../modules/loyalty/manifest';
import { manifest as marketplaceManifest } from '../modules/marketplace/manifest';
import { manifest as mediaManifest } from '../modules/media/manifest';
import { manifest as membershipManifest } from '../modules/membership/manifest';
import { manifest as migrationManifest } from '../modules/migration/manifest';
import { manifest as notificationManifest } from '../modules/notification/manifest';
import { manifest as orderManifest } from '../modules/order/manifest';
import { manifest as organizationManifest } from '../modules/organization/manifest';
import { manifest as pagebuilderManifest } from '../modules/pagebuilder/manifest';
import { manifest as paymentManifest } from '../modules/payment/manifest';
import { manifest as pricingManifest } from '../modules/pricing/manifest';
import { manifest as productManifest } from '../modules/product/manifest';
import { manifest as promotionManifest } from '../modules/promotion/manifest';
import { manifest as reportingManifest } from '../modules/reporting/manifest';
import { manifest as returnsManifest } from '../modules/returns/manifest';
import { manifest as segmentManifest } from '../modules/segment/manifest';
import { manifest as shippingManifest } from '../modules/shipping/manifest';
import { manifest as storeManifest } from '../modules/store/manifest';
import { manifest as subscriptionManifest } from '../modules/subscription/manifest';
import { manifest as supplierManifest } from '../modules/supplier/manifest';
import { manifest as supportManifest } from '../modules/support/manifest';
import { manifest as taxManifest } from '../modules/tax/manifest';
import { manifest as themeManifest } from '../modules/theme/manifest';
import { manifest as trackingManifest } from '../modules/tracking/manifest';
import { manifest as warehouseManifest } from '../modules/warehouse/manifest';
import { manifest as webhookManifest } from '../modules/webhook/manifest';

const manifests: ModuleManifest[] = [
  // ── Core (required) ──────────────────────────────────────────
  identityManifest,
  orderManifest,
  productManifest,
  paymentManifest,
  configurationManifest,
  organizationManifest,

  // ── Commerce (optional) ──────────────────────────────────────
  basketManifest,
  checkoutManifest,
  inventoryManifest,
  fulfillmentManifest,
  shippingManifest,
  warehouseManifest,
  supplierManifest,
  taxManifest,
  pricingManifest,
  promotionManifest,
  couponManifest,
  loyaltyManifest,
  membershipManifest,
  subscriptionManifest,
  customerManifest,
  storeManifest,

  // ── Content & Media (optional) ───────────────────────────────
  contentManifest,
  mediaManifest,
  localizationManifest,
  notificationManifest,

  // ── Analytics & Reporting (optional) ─────────────────────────
  analyticsManifest,
  reportingManifest,

  // ── Support (optional) ───────────────────────────────────────
  supportManifest,
  gdprManifest,

  // ── Platform (optional) ──────────────────────────────────────
  webhookManifest,
  auditManifest,
  segmentManifest,
  automationManifest,
  returnsManifest,
  themeManifest,
  pagebuilderManifest,
  trackingManifest,
  b2bManifest,
  marketplaceManifest,
  migrationManifest,
  integrationManifest,
];

/**
 * Register all module manifests and initialize the registry synchronously.
 * Uses env vars only (no feature flag provider). Called from app boot
 * before event handlers and routes are wired up.
 */
export function registerModuleManifestsSync(): void {
  moduleRegistry.registerAll(manifests);
  // Initialize synchronously — env vars only, no DB flag provider yet
  moduleRegistry.initializeSync();
}

/**
 * Register all module manifests and initialize the registry.
 * Async version — called after DB is available to re-initialize
 * with the feature flag provider.
 */
export async function registerModuleManifests(): Promise<void> {
  moduleRegistry.registerAll(manifests);
  await moduleRegistry.initialize();

  const disabled = moduleRegistry.getDisabledModules();
  if (disabled.length > 0) {
    logger.info('Modules disabled', { modules: disabled });
  }
}

export { moduleRegistry };
