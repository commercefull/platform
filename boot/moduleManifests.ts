/**
 * Central Module Manifest Registration
 *
 * Declares and registers manifests for all 32 platform modules.
 * Called during app boot before routes, GraphQL, and event handlers are wired up.
 *
 * Required modules (identity, order, product, payment, configuration, organization)
 * always load. Optional modules can be toggled off via feature flags or env vars.
 */

import { moduleRegistry } from '../libs/moduleRegistry';
import type { ModuleManifest } from '../libs/moduleRegistry';
import { logger } from '../libs/logger';

const manifests: ModuleManifest[] = [
  // ── Core (required) ──────────────────────────────────────────
  {
    name: 'identity',
    description: 'Authentication, authorization, user management',
    requirement: 'required',
    routes: [
      { path: '/customer', auth: 'customer' },
      { path: '/business', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: {
      subscribes: ['identity.password_reset'],
      publishes: ['customer.registered', 'organization.approved', 'organization.settlement_created', 'organization.payout_processed', 'identity.sso.login', 'identity.sso.config_created', 'identity.sso.config_updated', 'identity.sso.config_deleted', 'identity.scim.user_provisioned', 'identity.scim.user_deprovisioned', 'identity.scim.user_updated'],
    },
    tables: { names: ['managedAdminUser', 'merchant', 'role', 'samlProvider', 'oidcProvider', 'scimProvisioningRecord'] },
  },
  {
    name: 'order',
    description: 'Order management, order history, status tracking',
    requirement: 'required',
    dependsOn: ['identity', 'product'],
    routes: [
      { path: '/customer/orders', auth: 'customer' },
      { path: '/business/orders', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: {
      subscribes: ['order.created', 'order.paid', 'order.cancelled', 'order.payment_failed', 'order.completed', 'fulfillment.delivered', 'order.status_changed'],
      publishes: ['order.created', 'order.paid', 'order.cancelled', 'order.completed', 'order.payment_failed', 'order.status_changed', 'order.ready_for_pickup'],
    },
    tables: { names: ['order', 'orderItem', 'orderStatusHistory', 'orderPaymentHistory'] },
  },
  {
    name: 'product',
    description: 'Product catalog, variants, categories, attributes, bundles',
    requirement: 'required',
    routes: [
      { path: '/customer/products', auth: 'customer' },
      { path: '/business/products', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: {
      subscribes: ['product.created', 'product.updated', 'product.deleted'],
      publishes: ['product.created', 'product.updated', 'product.deleted'],
    },
    tables: { names: ['product', 'productVariant', 'productCategory', 'productAttribute', 'productBundle'] },
  },
  {
    name: 'payment',
    description: 'Payment processing, gateway webhooks, refunds',
    requirement: 'required',
    dependsOn: ['identity', 'order'],
    routes: [
      { path: '/customer/payments', auth: 'customer' },
      { path: '/business/payments', auth: 'organization' },
      { path: '/payment/webhook', auth: 'webhook' },
    ],
    graphql: { enabled: true },
    events: {
      subscribes: ['payment.refunded', 'payment.voided'],
      publishes: ['order.paid', 'order.payment_failed', 'checkout.payment_captured', 'checkout.failed'],
    },
    tables: { names: ['paymentTransaction', 'paymentRefund'] },
  },
  {
    name: 'configuration',
    description: 'System configuration, feature flags',
    requirement: 'required',
    routes: [{ path: '/business/config', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: ['config.updated', 'config.flag_toggled'] },
    tables: { names: ['systemConfiguration'] },
  },
  {
    name: 'organization',
    description: 'Organization/merchant management',
    requirement: 'required',
    dependsOn: ['identity'],
    routes: [{ path: '/business/organization', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: ['organization.approved', 'organization.settlement_created', 'organization.payout_processed'] },
    tables: { names: ['merchant'] },
  },

  // ── Commerce (optional) ──────────────────────────────────────
  {
    name: 'basket',
    description: 'Shopping cart management',
    requirement: 'optional',
    dependsOn: ['product'],
    routes: [
      { path: '/customer/basket', auth: 'customer' },
      { path: '/business/basket', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: ['basket.abandoned'], publishes: ['basket.abandoned'] },
    tables: { names: ['basket', 'basketItem'] },
  },
  {
    name: 'checkout',
    description: 'Checkout sessions, payment capture flow',
    requirement: 'optional',
    dependsOn: ['basket', 'order', 'payment'],
    routes: [{ path: '/customer/checkout', auth: 'customer' }],
    graphql: { enabled: true },
    events: { subscribes: ['checkout.payment_captured', 'checkout.failed'], publishes: ['checkout.completed', 'checkout.failed'] },
    tables: { names: ['checkoutSession'] },
  },
  {
    name: 'inventory',
    description: 'Stock management, reservations, low-stock alerts',
    requirement: 'optional',
    dependsOn: ['product'],
    routes: [
      { path: '/customer/inventory', auth: 'customer' },
      { path: '/business/inventory', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: {
      subscribes: ['order.created', 'order.cancelled', 'order.payment_failed'],
      publishes: ['inventory.low', 'inventory.out_of_stock', 'inventory.reserved', 'inventory.released', 'inventory.reservation_failed'],
    },
    tables: { names: ['inventoryItem', 'inventoryLocation', 'inventoryReservation', 'inventoryAdjustment'] },
  },
  {
    name: 'fulfillment',
    description: 'Order fulfillment, packing, shipping labels',
    requirement: 'optional',
    dependsOn: ['order', 'inventory'],
    routes: [
      { path: '/business/fulfillment', auth: 'organization' },
      { path: '/customer/fulfillment', auth: 'customer' },
    ],
    graphql: { enabled: true },
    events: {
      subscribes: ['order.paid', 'fulfillment.created', 'fulfillment.shipped', 'fulfillment.delivered'],
      publishes: ['fulfillment.created', 'fulfillment.shipped', 'fulfillment.delivered'],
    },
    tables: { names: ['fulfillment', 'fulfillmentItem'] },
  },
  {
    name: 'shipping',
    description: 'Shipping methods, rates, zones',
    requirement: 'optional',
    dependsOn: ['order'],
    routes: [
      { path: '/customer/shipping', auth: 'customer' },
      { path: '/business/shipping', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['shippingMethod', 'shippingZone', 'shippingRate'] },
  },
  {
    name: 'warehouse',
    description: 'Warehouse management, stock transfers',
    requirement: 'optional',
    dependsOn: ['inventory'],
    routes: [{ path: '/business/warehouse', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['distributionWarehouse'] },
  },
  {
    name: 'supplier',
    description: 'Supplier management, purchase orders',
    requirement: 'optional',
    dependsOn: ['inventory'],
    routes: [{ path: '/business/supplier', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['supplier'] },
  },
  {
    name: 'tax',
    description: 'Tax calculation, tax rates, tax zones',
    requirement: 'optional',
    dependsOn: ['product'],
    routes: [
      { path: '/customer/tax', auth: 'customer' },
      { path: '/business/tax', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['taxRate', 'taxZone'] },
  },
  {
    name: 'pricing',
    description: 'Price lists, price rules, bulk pricing',
    requirement: 'optional',
    dependsOn: ['product'],
    routes: [{ path: '/business/pricing', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['priceList', 'priceRule'] },
  },
  {
    name: 'promotion',
    description: 'Promotional campaigns, discounts',
    requirement: 'optional',
    dependsOn: ['product'],
    routes: [
      { path: '/customer/promotion', auth: 'customer' },
      { path: '/business/promotion', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['promotion', 'promotionRule'] },
  },
  {
    name: 'coupon',
    description: 'Coupon codes, redemption tracking',
    requirement: 'optional',
    dependsOn: ['promotion'],
    routes: [
      { path: '/customer/coupon', auth: 'customer' },
      { path: '/business/coupon', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['coupon', 'couponRedemption'] },
  },
  {
    name: 'loyalty',
    description: 'Loyalty points, tier management',
    requirement: 'optional',
    dependsOn: ['customer', 'order'],
    routes: [
      { path: '/customer/loyalty', auth: 'customer' },
      { path: '/business/loyalty', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: {
      subscribes: ['order.completed', 'loyalty.points_earned', 'loyalty.points_redeemed', 'loyalty.tier_upgraded'],
      publishes: ['loyalty.points_earned', 'loyalty.points_redeemed', 'loyalty.tier_upgraded'],
    },
    tables: { names: ['loyaltyPoint', 'loyaltyTier', 'loyaltyProgram'] },
  },
  {
    name: 'membership',
    description: 'Membership tiers, benefits',
    requirement: 'optional',
    dependsOn: ['customer'],
    routes: [
      { path: '/customer/membership', auth: 'customer' },
      { path: '/business/membership', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['membership', 'membershipTier'] },
  },
  {
    name: 'subscription',
    description: 'Recurring billing, subscription plans',
    requirement: 'optional',
    dependsOn: ['customer', 'payment'],
    routes: [
      { path: '/customer/subscription', auth: 'customer' },
      { path: '/business/subscription', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: ['subscription.created', 'subscription.cancelled', 'subscription.renewed'] },
    tables: { names: ['subscription', 'subscriptionPlan'] },
  },
  {
    name: 'customer',
    description: 'Customer profiles, addresses, preferences',
    requirement: 'optional',
    dependsOn: ['identity'],
    routes: [
      { path: '/customer', auth: 'customer' },
      { path: '/business/customer', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: ['customer.registered'], publishes: ['customer.registered', 'customer.updated'] },
    tables: { names: ['customer', 'customerAddress'] },
  },
  {
    name: 'store',
    description: 'Store management, pickup, local delivery',
    requirement: 'optional',
    dependsOn: ['inventory'],
    routes: [
      { path: '/customer/store', auth: 'customer' },
      { path: '/business/store', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: ['store.created', 'store.inventory_linked', 'store.pickup_configured'], publishes: ['store.created', 'store.inventory_linked', 'store.pickup_configured'] },
    tables: { names: ['store', 'storeSettings'] },
  },

  // ── Content & Media (optional) ───────────────────────────────
  {
    name: 'content',
    description: 'CMS, pages, blog, content blocks',
    requirement: 'optional',
    routes: [
      { path: '/customer/content', auth: 'customer' },
      { path: '/business/content', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['contentPage', 'contentBlock'] },
  },
  {
    name: 'media',
    description: 'Media uploads, image management',
    requirement: 'optional',
    routes: [{ path: '/business/media', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['mediaAsset'] },
  },
  {
    name: 'localization',
    description: 'Translations, currency, locale management',
    requirement: 'optional',
    routes: [
      { path: '/customer/localization', auth: 'customer' },
      { path: '/business/localization', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['translation', 'currency', 'locale'] },
  },
  {
    name: 'notification',
    description: 'In-app, email, push notifications',
    requirement: 'optional',
    dependsOn: ['identity'],
    routes: [
      { path: '/customer/notification', auth: 'customer' },
      { path: '/business/notification', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: ['*'], publishes: [] },
    tables: { names: ['notification'] },
  },

  // ── Analytics & Reporting (optional) ─────────────────────────
  {
    name: 'analytics',
    description: 'Analytics tracking, dashboards',
    requirement: 'optional',
    dependsOn: ['order', 'product'],
    routes: [{ path: '/business/analytics', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: ['*'], publishes: [] },
    tables: { names: ['analyticsEvent'] },
  },
  {
    name: 'reporting',
    description: 'Report generation, exports',
    requirement: 'optional',
    dependsOn: ['order', 'product'],
    routes: [{ path: '/business/reporting', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['report', 'reportRun'] },
  },

  // ── Support (optional) ───────────────────────────────────────
  {
    name: 'support',
    description: 'Support tickets, customer service',
    requirement: 'optional',
    dependsOn: ['customer'],
    routes: [
      { path: '/customer/support', auth: 'customer' },
      { path: '/business/support', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: ['support.ticket_created', 'support.ticket_resolved'] },
    tables: { names: ['supportTicket', 'supportMessage'] },
  },
  {
    name: 'gdpr',
    description: 'GDPR data requests, cookie consent',
    requirement: 'optional',
    dependsOn: ['customer'],
    routes: [
      { path: '/customer/gdpr', auth: 'customer' },
      { path: '/business/gdpr', auth: 'organization' },
    ],
    graphql: { enabled: true },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['gdprDataRequest', 'gdprCookieConsent'] },
  },

  // ── Platform (optional) ──────────────────────────────────────
  {
    name: 'webhook',
    description: 'Outbound webhook delivery',
    requirement: 'optional',
    routes: [{ path: '/business/webhook', auth: 'organization' }],
    graphql: { enabled: true },
    events: { subscribes: ['*'], publishes: [] },
    tables: { names: ['webhookEndpoint', 'webhookDelivery'] },
  },
  {
    name: 'audit',
    description: 'Immutable audit log',
    requirement: 'optional',
    routes: [{ path: '/business/audit', auth: 'organization' }],
    graphql: { enabled: false },
    events: { subscribes: [], publishes: [] },
    tables: { names: ['auditLog'] },
    featureFlagKey: 'module.audit.enabled',
  },
  {
    name: 'segment',
    description: 'CDP & customer segmentation — customer profiles, LTV/frequency/behaviour aggregates, dynamic segment definitions',
    requirement: 'optional',
    dependsOn: ['customer', 'order'],
    routes: [{ path: '/business/segment', auth: 'organization' }],
    graphql: { enabled: false },
    events: { subscribes: ['order.created', 'order.completed', 'customer.registered'], publishes: ['segment.member_added', 'segment.member_removed'] },
    tables: { names: ['segmentDefinition', 'segmentMembership', 'customerProfile'] },
    featureFlagKey: 'module.segment.enabled',
  },
  {
    name: 'automation',
    description: 'Automation engine — rule persistence, condition/action DSL, execution on event bus, execution log',
    requirement: 'optional',
    dependsOn: ['identity'],
    routes: [{ path: '/business/automation', auth: 'organization' }],
    graphql: { enabled: false },
    events: { subscribes: ['*'], publishes: ['automation.rule_executed', 'automation.rule_failed'] },
    tables: { names: ['automationRule', 'automationExecutionLog'] },
    featureFlagKey: 'module.automation.enabled',
  },
  {
    name: 'returns',
    description: 'Returns, exchanges & store credit — explicit state machine, carrier return labels, store-credit ledger, warranty claims',
    requirement: 'optional',
    dependsOn: ['order'],
    routes: [{ path: '/business/returns', auth: 'organization' }, { path: '/business/store-credit', auth: 'organization' }],
    graphql: { enabled: false },
    events: { subscribes: ['order.completed', 'order.cancelled'], publishes: ['return.created', 'return.approved', 'return.denied', 'return.in_transit', 'return.received', 'return.inspected', 'return.completed', 'return.cancelled'] },
    tables: { names: ['orderReturn', 'orderReturnItem', 'storeCreditLedger'] },
    featureFlagKey: 'module.returns.enabled',
  },
  {
    name: 'theme',
    description: 'Theme engine — theme registry, per-store overrides, built-in themes, CSS variable generation',
    requirement: 'optional',
    dependsOn: ['store'],
    routes: [{ path: '/business/theme', auth: 'organization' }],
    graphql: { enabled: false },
    events: {
      subscribes: [],
      publishes: ['theme.created', 'theme.updated', 'theme.deleted', 'theme.activated', 'theme.archived', 'theme.assigned', 'theme.unassigned', 'theme.override.created', 'theme.override.updated', 'theme.override.deleted'],
    },
    tables: { names: ['theme', 'themeOverride', 'themeAssignment'] },
    featureFlagKey: 'module.theme.enabled',
  },
  {
    name: 'pagebuilder',
    description: 'Page builder — block schema registry, drag-and-drop editor, live preview with theme integration',
    requirement: 'optional',
    dependsOn: ['content', 'theme'],
    routes: [{ path: '/business/page-builder', auth: 'organization' }],
    graphql: { enabled: false },
    events: {
      subscribes: [],
      publishes: ['pagebuilder.draft.created', 'pagebuilder.draft.updated', 'pagebuilder.draft.deleted', 'pagebuilder.draft.published', 'pagebuilder.draft.unpublished', 'pagebuilder.block.added', 'pagebuilder.block.removed', 'pagebuilder.block.moved', 'pagebuilder.block.updated', 'pagebuilder.blocks.reordered'],
    },
    tables: { names: ['pageDraft'] },
    featureFlagKey: 'module.pagebuilder.enabled',
  },
  {
    name: 'tracking',
    description: 'Server-side tracking — consent-gated GTM Server container + Meta CAPI adapter, sourced from the durable event stream',
    requirement: 'optional',
    dependsOn: ['gdpr'],
    graphql: { enabled: false },
    events: {
      subscribes: ['order.paid', 'order.created', 'checkout.started', 'checkout.completed', 'basket.item_added', 'basket.item_removed', 'product.viewed', 'checkout.payment_initiated', 'customer.registered'],
      publishes: ['tracking.config.created', 'tracking.config.updated', 'tracking.config.activated', 'tracking.config.disabled', 'tracking.config.deleted', 'tracking.event.sent', 'tracking.event.skipped', 'tracking.event.failed'],
    },
    tables: { names: ['trackingConfig'] },
    featureFlagKey: 'module.tracking.enabled',
  },
  {
    name: 'b2b',
    description: 'B2B commerce — company hierarchy, multi-user spending limits, price books, RFQ→quote→order, Net-15/30/60 terms, approval workflows',
    requirement: 'optional',
    dependsOn: ['identity', 'order'],
    routes: [{ path: '/business/b2b', auth: 'organization' }],
    graphql: { enabled: false },
    events: {
      subscribes: [],
      publishes: ['company.registered', 'company.approved', 'company.suspended', 'company.user.invited', 'b2b_user.activated', 'quote.created', 'quote.sent', 'quote.viewed', 'quote.accepted', 'quote.rejected', 'quote.converted', 'approval.requested', 'approval.approved', 'approval.rejected', 'b2b.request_escalated'],
    },
    tables: { names: ['b2bCompany', 'b2bUser', 'b2bQuote', 'b2bApprovalWorkflow'] },
    featureFlagKey: 'module.b2b.enabled',
  },
  {
    name: 'marketplace',
    description: 'Multi-vendor marketplace — vendor onboarding, commission rules (percentage/fixed/tiered), payouts, order splitting',
    requirement: 'optional',
    dependsOn: ['identity', 'order', 'product'],
    routes: [{ path: '/business/marketplace', auth: 'organization' }],
    graphql: { enabled: false },
    events: {
      subscribes: [],
      publishes: ['marketplace.vendor.registered', 'marketplace.vendor.approved', 'marketplace.vendor.suspended', 'marketplace.vendor.terminated', 'marketplace.commission.created', 'marketplace.commission.updated', 'marketplace.payout.created', 'marketplace.payout.processing', 'marketplace.payout.completed', 'marketplace.payout.failed'],
    },
    tables: { names: ['marketplaceVendor', 'marketplaceCommissionRule', 'marketplaceVendorPayout'] },
    featureFlagKey: 'module.marketplace.enabled',
  },
  {
    name: 'compliance',
    description: 'Compliance — SOC2 audit logging, key rotation policy, CCPA data subject requests',
    requirement: 'optional',
    dependsOn: ['identity'],
    routes: [{ path: '/business/compliance', auth: 'organization' }],
    graphql: { enabled: false },
    events: {
      subscribes: [],
      publishes: ['compliance.audit_log.created', 'compliance.key_rotation.scheduled', 'compliance.key_rotation.completed', 'compliance.ccpa.dsr_created', 'compliance.ccpa.dsr_completed'],
    },
    tables: { names: ['auditLog', 'keyRotationPolicy', 'ccpaDsr'] },
    featureFlagKey: 'module.compliance.enabled',
  },
];

/**
 * Register all module manifests and initialize the registry synchronously.
 * Uses env vars only (no feature flag provider). Called from app boot
 * before event handlers and routes are wired up.
 */
export function registerModuleManifestsSync(): void {
  moduleRegistry.registerAll(manifests);
  // Initialize synchronously — env vars only, no DB flag provider yet
  // The registry's initialize() is async but works synchronously when
  // no flag provider is set, so we call it and discard the promise.
  void moduleRegistry.initialize();
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
