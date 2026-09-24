import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'marketplace',
  description: 'Multi-vendor marketplace — vendor onboarding, commission rules (percentage/fixed/tiered), payouts, order splitting',
  requirement: 'optional',
  dependsOn: ['identity', 'order', 'product'],
  routes: [{ path: '/business/marketplace', auth: 'organization' }],
  graphql: { enabled: false },
  events: {
    subscribes: [],
    publishes: [
      'marketplace.vendor.registered',
      'marketplace.vendor.approved',
      'marketplace.vendor.suspended',
      'marketplace.vendor.terminated',
      'marketplace.commission.created',
      'marketplace.commission.updated',
      'marketplace.payout.created',
      'marketplace.payout.processing',
      'marketplace.payout.completed',
      'marketplace.payout.failed',
    ],
  },
  tables: { names: ['marketplaceVendor', 'marketplaceCommissionRule', 'marketplaceVendorPayout'] },
  featureFlagKey: 'module.marketplace.enabled',
};
