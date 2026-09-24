import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'tracking',
  description: 'Server-side tracking — consent-gated GTM Server container + Meta CAPI adapter, sourced from the durable event stream',
  requirement: 'optional',
  dependsOn: ['gdpr'],
  routes: [{ path: '/business/tracking', auth: 'organization' }],
  graphql: { enabled: false },
  events: {
    subscribes: [
      'order.paid',
      'order.created',
      'checkout.started',
      'checkout.completed',
      'basket.item_added',
      'basket.item_removed',
      'product.viewed',
      'checkout.payment_initiated',
      'customer.registered',
    ],
    publishes: [
      'tracking.config.created',
      'tracking.config.updated',
      'tracking.config.activated',
      'tracking.config.disabled',
      'tracking.config.deleted',
      'tracking.event.sent',
      'tracking.event.skipped',
      'tracking.event.failed',
    ],
  },
  tables: { names: ['trackingConfig'] },
  featureFlagKey: 'module.tracking.enabled',
};
