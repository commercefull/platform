/**
 * OrderStatusSyncPort
 *
 * ACL port owned by payment. Provides synchronous lookups
 * needed by the webhook handler to correlate payment intents
 * with orders and checkout sessions.
 *
 * Fire-and-forget status updates (markOrderPaymentFailed,
 * markCheckoutPaymentAuthorized, markCheckoutPaymentFailed)
 * have been migrated to Published Language event subscriptions.
 * See modules/checkout/application/eventHandlers.ts and
 * modules/order/application/eventHandlers.ts.
 */

export interface CheckoutSyncSummary {
  checkoutId: string;
  orderId: string;
  customerId?: string;
  totalAmount: number;
  orderNumber?: string;
}

export interface OrderStatusSyncPort {
  findCheckoutByPaymentIntentId(paymentIntentId: string): Promise<CheckoutSyncSummary | null>;
  markOrderPaid(orderId: string): Promise<{ orderNumber?: string } | null>;
}
