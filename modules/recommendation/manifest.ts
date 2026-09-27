import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'recommendation',
  description: 'Rule-, co-purchase- and similarity-based product recommendations (no AI)',
  requirement: 'optional',
  dependsOn: ['product', 'order'],
  routes: [
    { path: '/customer/recommendation', auth: 'customer' },
    { path: '/business/recommendation', auth: 'organization' },
  ],
  graphql: { enabled: false },
  events: {
    subscribes: [
      'order.paid',
      'order.cancelled',
      'order.refunded',
      'product.deleted',
      'product.unpublished',
      'product.archived',
      'product.viewed',
    ],
    publishes: ['recommendation.rebuilt', 'recommendation.rule_created', 'recommendation.rule_updated', 'recommendation.rule_deleted'],
  },
  tables: {
    names: [
      'recommendationCoPurchase',
      'recommendationCoView',
      'recommendationProductStat',
      'recommendationTenantStat',
      'recommendationProcessedOrder',
      'recommendationRule',
      'recommendationExclusion',
      'recommendationCandidate',
      'recommendationPopular',
    ],
  },
  featureFlagKey: 'module.recommendation.enabled',
};
