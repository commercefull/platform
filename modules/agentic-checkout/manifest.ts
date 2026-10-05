import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'agentic-checkout',
  description:
    'Agentic Commerce Protocol adapter — exposes checkout sessions and product feeds to AI surfaces (ChatGPT, Meta, Google) via /acp',
  requirement: 'optional',
  dependsOn: ['basket', 'checkout', 'store', 'payment', 'integration', 'assortment'],
  routes: [{ path: '/acp', auth: 'public' }],
  events: {
    subscribes: [],
    publishes: ['agenticCheckout.session_created', 'agenticCheckout.session_completed', 'agenticCheckout.session_failed'],
  },
  tables: {
    names: ['agenticCheckoutSession', 'agenticCheckoutIdempotencyRecord'],
  },
};
