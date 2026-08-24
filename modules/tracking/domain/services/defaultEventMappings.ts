import { EventMapping } from '../entities/TrackingConfig';

/**
 * Default event mappings that map platform event bus events
 * to tracking provider events (GTM + Meta CAPI).
 */
export function getDefaultEventMappings(): EventMapping[] {
  return [
    {
      sourceEvent: 'order.paid',
      targetEvent: 'Purchase',
      providers: ['gtm', 'meta_capi'],
      consentCategory: 'marketing',
    },
    {
      sourceEvent: 'order.created',
      targetEvent: 'OrderCreated',
      providers: ['gtm'],
      consentCategory: 'analytics',
    },
    {
      sourceEvent: 'checkout.started',
      targetEvent: 'InitiateCheckout',
      providers: ['gtm', 'meta_capi'],
      consentCategory: 'marketing',
    },
    {
      sourceEvent: 'checkout.completed',
      targetEvent: 'CompleteCheckout',
      providers: ['gtm'],
      consentCategory: 'analytics',
    },
    {
      sourceEvent: 'basket.item_added',
      targetEvent: 'AddToCart',
      providers: ['gtm', 'meta_capi'],
      consentCategory: 'marketing',
    },
    {
      sourceEvent: 'basket.item_removed',
      targetEvent: 'RemoveFromCart',
      providers: ['gtm'],
      consentCategory: 'analytics',
    },
    {
      sourceEvent: 'product.viewed',
      targetEvent: 'ViewContent',
      providers: ['gtm', 'meta_capi'],
      consentCategory: 'marketing',
    },
    {
      sourceEvent: 'checkout.payment_initiated',
      targetEvent: 'AddPaymentInfo',
      providers: ['gtm', 'meta_capi'],
      consentCategory: 'marketing',
    },
    {
      sourceEvent: 'customer.registered',
      targetEvent: 'CompleteRegistration',
      providers: ['gtm', 'meta_capi'],
      consentCategory: 'marketing',
    },
    {
      sourceEvent: 'search.performed',
      targetEvent: 'Search',
      providers: ['gtm'],
      consentCategory: 'analytics',
    },
  ];
}
