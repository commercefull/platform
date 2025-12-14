import EventEmitter from 'events';

export type EventType =
  // Order events
  | 'order.created'
  | 'order.paid'
  | 'order.shipped'
  | 'order.completed'
  | 'order.cancelled'
  | 'order.refunded'
  | 'order.status_changed'
  | 'order.payment_status_changed'
  | 'order.fulfillment_status_changed'
  | 'order.delivered'
  | 'order.item_added'
  | 'order.item_removed'
  // Product events
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.published'
  | 'product.unpublished'
  | 'product.archived'
  | 'product.status_changed'
  | 'product.price_changed'
  | 'product.variant_created'
  | 'product.variant_updated'
  | 'product.variant_deleted'
  | 'product.image_added'
  | 'product.category_changed'
  | 'product.viewed'
  // Review events
  | 'review.created'
  | 'review.approved'
  | 'review.rejected'
  // Basket events
  | 'basket.created'
  | 'basket.item_added'
  | 'basket.item_removed'
  | 'basket.item_updated'
  | 'basket.item_set_as_gift'
  | 'basket.cleared'
  | 'basket.abandoned'
  | 'basket.converted_to_order'
  | 'basket.merged'
  | 'basket.assigned_to_customer'
  | 'basket.expiration_extended'
  // Checkout events
  | 'checkout.started'
  | 'checkout.updated'
  | 'checkout.completed'
  | 'checkout.abandoned'
  | 'checkout.payment_initiated'
  | 'checkout.payment_completed'
  | 'checkout.payment_failed'
  // Payment events
  | 'payment.received'
  | 'payment.failed'
  | 'payment.success'
  | 'payment.refunded'
  // Inventory events
  | 'inventory.low'
  | 'inventory.out_of_stock'
  | 'inventory.reserved'
  | 'inventory.released'
  // Customer events
  | 'customer.registered'
  | 'customer.created'
  | 'customer.updated'
  // Identity events
  | 'identity.login'
  | 'identity.logout'
  | 'identity.password_reset'
  | 'identity.email_verified'
  | 'identity.customer.login'
  | 'identity.customer.logout'
  | 'identity.customer.registered'
  | 'identity.customer.password_reset_requested'
  | 'identity.customer.password_reset_completed'
  | 'identity.customer.token_refreshed'
  | 'identity.customer.session_created'
  | 'identity.customer.session_invalidated'
  | 'identity.customer.social_login'
  | 'identity.customer.social_account_linked'
  | 'identity.customer.social_account_unlinked'
  | 'identity.merchant.login'
  | 'identity.merchant.logout'
  | 'identity.merchant.registered'
  | 'identity.merchant.password_reset_requested'
  | 'identity.merchant.password_reset_completed'
  | 'identity.merchant.token_refreshed'
  | 'identity.merchant.session_created'
  | 'identity.merchant.session_invalidated'
  | 'identity.merchant.social_login'
  | 'identity.merchant.social_account_linked'
  | 'identity.merchant.social_account_unlinked'
  | 'identity.token.blacklisted'
  | 'identity.tokens.cleanup'
  // Supplier events
  | 'supplier.created'
  | 'supplier.approved'
  | 'purchase_order.created'
  | 'purchase_order.approved'
  | 'receiving.completed'
  // Notification events
  | 'notification.sent'
  // GDPR events
  | 'gdpr.request.created'
  | 'gdpr.request.completed'
  | 'gdpr.request.rejected'
  | 'gdpr.data.exported'
  | 'gdpr.data.deleted'
  | 'gdpr.consent.recorded'
  | 'gdpr.consent.updated'
  // Marketing events
  | 'campaign.created'
  | 'campaign.scheduled'
  | 'campaign.sent'
  | 'campaign.email.opened'
  | 'campaign.email.clicked'
  | 'abandoned_cart.detected'
  | 'abandoned_cart.email_sent'
  | 'abandoned_cart.recovered'
  | 'affiliate.applied'
  | 'affiliate.approved'
  | 'affiliate.commission.created'
  | 'affiliate.commission.paid'
  | 'referral.created'
  | 'referral.converted'
  | 'referral.rewarded'
  // B2B events
  | 'company.registered'
  | 'company.approved'
  | 'company.suspended'
  | 'company.user.invited'
  | 'company.user.accepted'
  | 'quote.created'
  | 'quote.sent'
  | 'quote.viewed'
  | 'quote.accepted'
  | 'quote.rejected'
  | 'quote.converted'
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected'
  // Subscription events
  | 'subscription.created'
  | 'subscription.activated'
  | 'subscription.trial.started'
  | 'subscription.trial.ended'
  | 'subscription.paused'
  | 'subscription.resumed'
  | 'subscription.cancelled'
  | 'subscription.expired'
  | 'subscription.renewed'
  | 'subscription.payment.success'
  | 'subscription.payment.failed'
  | 'subscription.dunning.started'
  | 'subscription.dunning.success'
  | 'subscription.dunning.failed'
  // Support events
  | 'ticket.created'
  | 'ticket.assigned'
  | 'ticket.replied'
  | 'ticket.resolved'
  | 'ticket.closed'
  | 'ticket.escalated'
  | 'ticket.feedback.received'
  // Alert events
  | 'alert.stock.created'
  | 'alert.stock.triggered'
  | 'alert.price.created'
  | 'alert.price.triggered'
  // Gift Card events
  | 'giftcard.created'
  | 'giftcard.activated'
  | 'giftcard.redeemed'
  | 'giftcard.reloaded'
  | 'giftcard.expired'
  // Bundle events
  | 'bundle.created'
  | 'bundle.purchased'
  // Pre-Order events
  | 'preorder.created'
  | 'preorder.reserved'
  | 'preorder.fulfilled'
  | 'preorder.cancelled'
  // Pickup events
  | 'pickup.created'
  | 'pickup.ready'
  | 'pickup.notified'
  | 'pickup.completed'
  | 'pickup.expired'
  // Fraud events
  | 'fraud.check.created'
  | 'fraud.check.flagged'
  | 'fraud.check.blocked'
  | 'fraud.check.reviewed'
  | 'fraud.blacklist.added'
  // Content events
  | 'content.page.created'
  | 'content.page.updated'
  | 'content.page.published'
  | 'content.page.unpublished'
  | 'content.page.archived'
  | 'content.page.deleted'
  | 'content.page.version_created'
  | 'content.block.created'
  | 'content.block.updated'
  | 'content.block.deleted'
  | 'content.blocks.reordered'
  | 'content.type.created'
  | 'content.type.updated'
  | 'content.type.deleted'
  | 'content.template.created'
  | 'content.template.updated'
  | 'content.template.deleted'
  | 'content.media.uploaded'
  | 'content.media.deleted'
  | 'content.navigation.created'
  | 'content.navigation.updated'
  | 'content.navigation.item_added'
  | 'content.category.created'
  | 'content.category.updated'
  | 'content.category.deleted'
  | 'content.redirect.created'
  | 'content.redirect.updated'
  | 'content.redirect.deleted';

export interface EventPayload {
  type: EventType;
  data: any;
  timestamp: Date;
  correlationId?: string;
  source?: string;
}

export interface EventHandler {
  (payload: EventPayload): void | Promise<void>;
}

class EventBus {
  private emitter: EventEmitter;
  private handlers: Map<EventType, EventHandler[]> = new Map();

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit(type: EventType, data: any, correlationId?: string, source?: string): Promise<void> {
    const payload: EventPayload = {
      type,
      data,
      timestamp: new Date(),
      correlationId,
      source
    };

    console.log(`[EVENT] ${type}`, {
      correlationId,
      source,
      dataKeys: Object.keys(data || {})
    });

    // Emit to specific event handlers
    this.emitter.emit(type, payload);

    // Emit to wildcard handler
    this.emitter.emit('*', payload);

    // Call registered handlers
    const handlers = this.handlers.get(type) || [];
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`[EVENT ERROR] Handler failed for ${type}:`, error);
      }
    }
  }

  /**
   * Register an event handler
   */
  on(type: EventType | '*', handler: EventHandler): void {
    this.emitter.on(type, handler);
  }

  /**
   * Remove an event handler
   */
  off(type: EventType | '*', handler: EventHandler): void {
    this.emitter.off(type, handler);
  }

  /**
   * Register a typed event handler
   */
  registerHandler(type: EventType, handler: EventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  /**
   * Unregister a typed event handler
   */
  unregisterHandler(type: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get all registered event types
   */
  getRegisteredTypes(): EventType[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get handler count for an event type
   */
  getHandlerCount(type: EventType): number {
    return this.handlers.get(type)?.length || 0;
  }
}

export const eventBus = new EventBus();
