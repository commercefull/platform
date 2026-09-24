import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
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
    subscribes: ['payment.completed', 'payment.failed', 'payment.refunded', 'payment.voided'],
    publishes: ['order.paid', 'order.payment_failed', 'checkout.payment_captured', 'checkout.failed'],
  },
  tables: { names: ['paymentTransaction', 'paymentRefund'] },
};
