import EventEmitter from 'events';
import { logger } from '../logger';
import { getCorrelationId } from '../correlationId';

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
  | 'order.payment_failed'
  | 'order.fulfillment_status_changed'
  | 'order.delivered'
  | 'order.item_added'
  | 'order.item_removed'
  | 'order.ready_for_pickup'
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
  | 'checkout.payment_captured'
  | 'checkout.payment_failed'
  | 'checkout.failed'
  | 'checkout.config.created'
  | 'checkout.config.updated'
  | 'checkout.config.deleted'
  // Payment events
  | 'payment.received'
  | 'payment.failed'
  | 'payment.success'
  | 'payment.completed'
  | 'payment.refunded'
  | 'payment.disputed'
  | 'payment.captured'
  | 'payment.voided'
  | 'payment.method_saved'
  | 'payment.psp_route.created'
  | 'payment.psp_route.updated'
  | 'payment.psp_route.deleted'
  | 'payment.routed'
  // Inventory events
  | 'inventory.low'
  | 'inventory.out_of_stock'
  | 'inventory.reserved'
  | 'inventory.released'
  | 'inventory.reservation.confirmed'
  | 'inventory.reservation_failed'
  | 'inventory.dispatch.created'
  | 'inventory.dispatch.approved'
  | 'inventory.dispatch.shipped'
  | 'inventory.dispatch.received'
  | 'inventory.dispatch.cancelled'
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
  | 'identity.organization.login'
  | 'identity.organization.logout'
  | 'identity.organization.registered'
  | 'identity.organization.password_reset_requested'
  | 'identity.organization.password_reset_completed'
  | 'identity.organization.token_refreshed'
  | 'identity.organization.session_created'
  | 'identity.organization.session_invalidated'
  | 'identity.organization.social_login'
  | 'identity.organization.social_account_linked'
  | 'identity.organization.social_account_unlinked'
  | 'identity.token.blacklisted'
  | 'identity.tokens.cleanup'
  // SSO events
  | 'identity.sso.login'
  | 'identity.sso.config_created'
  | 'identity.sso.config_updated'
  | 'identity.sso.config_deleted'
  | 'identity.sso.provider_activated'
  | 'identity.sso.provider_deactivated'
  // SCIM events
  | 'identity.scim.user_provisioned'
  | 'identity.scim.user_deprovisioned'
  | 'identity.scim.user_updated'
  // Extended identity events (use case support)
  | 'customer.login_failed'
  | 'customer.logged_in'
  | 'customer.logged_out'
  | 'customer.password_reset_requested'
  | 'customer.password_reset'
  | 'customer.password_changed'
  | 'customer.deactivated'
  | 'customer.reactivated'
  | 'customer.deleted'
  | 'customer.verified'
  | 'customer.email_verified'
  | 'customer.all_tokens_revoked'
  | 'organization.login_failed'
  | 'organization.logged_in'
  | 'organization.registered'
  | 'organization.all_tokens_revoked'
  // Admin events
  | 'admin.login_failed'
  | 'admin.logged_in'
  | 'admin.logged_out'
  | 'admin.registered'
  | 'admin.password_reset'
  | 'admin.session_created'
  | 'admin.session_invalidated'
  // Supplier events
  | 'supplier.created'
  | 'supplier.approved'
  | 'purchase_order.created'
  | 'purchase_order.approved'
  | 'receiving.completed'
  // Notification events
  | 'notification.sent'
  | 'notification.digest'
  // GDPR events
  | 'gdpr.request.created'
  | 'gdpr.request.completed'
  | 'gdpr.request.rejected'
  | 'gdpr.data.exported'
  | 'gdpr.data.deleted'
  | 'gdpr.consent.recorded'
  | 'gdpr.consent.updated'
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
  // Content events
  | 'content.page.created'
  | 'content.page.updated'
  | 'content.page.published'
  | 'content.page.unpublished'
  | 'content.page.archived'
  | 'content.page.deleted'
  | 'content.page.version_created'
  | 'content.page.version_restored'
  | 'content.page.translation_created'
  | 'content.page.translation_updated'
  | 'content.page.translation_deleted'
  | 'content.page.categorized'
  | 'content.page.uncategorized'
  | 'content.page.primary_category_set'
  | 'content.media.usage_tracked'
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
  | 'content.redirect.deleted'
  // Store events
  | 'store.created'
  | 'store.updated'
  | 'store.activated'
  | 'store.deactivated'
  | 'store.deleted'
  | 'store.inventory_linked'
  | 'store.inventory_unlinked'
  | 'store.settings_updated'
  | 'store.pickup_configured'
  // Theme events
  | 'theme.created'
  | 'theme.updated'
  | 'theme.deleted'
  | 'theme.activated'
  | 'theme.archived'
  | 'theme.assigned'
  | 'theme.unassigned'
  | 'theme.override.created'
  | 'theme.override.updated'
  | 'theme.override.deleted'
  // Page builder events
  | 'pagebuilder.draft.created'
  | 'pagebuilder.draft.updated'
  | 'pagebuilder.draft.deleted'
  | 'pagebuilder.draft.published'
  | 'pagebuilder.draft.unpublished'
  | 'pagebuilder.block.added'
  | 'pagebuilder.block.removed'
  | 'pagebuilder.block.moved'
  | 'pagebuilder.block.updated'
  | 'pagebuilder.blocks.reordered'
  // Warehouse events
  | 'warehouse.created'
  | 'warehouse.updated'
  | 'warehouse.activated'
  | 'warehouse.deactivated'
  | 'warehouse.deleted'
  | 'warehouse.assigned_to_store'
  | 'warehouse.capacity_updated'
  | 'warehouse.zone.created'
  | 'warehouse.zone.updated'
  | 'warehouse.zone.deleted'
  | 'warehouse.bin.created'
  | 'warehouse.bin.updated'
  | 'warehouse.bin.deleted'
  | 'warehouse.receiving.created'
  | 'warehouse.receiving.completed'
  | 'warehouse.pick.created'
  | 'warehouse.pick.completed'
  | 'warehouse.pack.completed'
  // Organization events
  | 'organization.created'
  | 'organization.updated'
  | 'organization.approved'
  | 'organization.suspended'
  | 'organization.terminated'
  | 'organization.onboarded'
  | 'organization.settlement_created'
  | 'organization.payout_processed'
  // Pricing events
  | 'pricing.price_list_created'
  | 'pricing.price_list_updated'
  | 'pricing.price_changed'
  | 'pricing.volume_discount_applied'
  // Loyalty events
  | 'loyalty.points_earned'
  | 'loyalty.points_redeemed'
  | 'loyalty.points_expired'
  | 'loyalty.tier_upgraded'
  | 'loyalty.tier_downgraded'
  | 'loyalty.reward_redeemed'
  // Promotion & Coupon events
  | 'promotion.coupon_created'
  | 'promotion.coupon_applied'
  | 'promotion.coupon_redeemed'
  | 'promotion.coupon_expired'
  | 'promotion.discount_applied'
  // Membership events
  | 'membership.assigned'
  | 'membership.upgraded'
  | 'membership.downgraded'
  | 'membership.cancelled'
  | 'membership.renewed'
  // Shipping events
  | 'shipping.method_created'
  | 'shipping.zone_created'
  | 'shipping.rate_calculated'
  | 'shipping.label_created'
  | 'shipping.label.voided'
  | 'shipping.tracking.updated'
  | 'shipping.delivered'
  // Fulfillment events
  | 'fulfillment.created'
  | 'fulfillment.assigned'
  | 'fulfillment.picking_started'
  | 'fulfillment.picking_completed'
  | 'fulfillment.packing_started'
  | 'fulfillment.packing_completed'
  | 'fulfillment.shipped'
  | 'fulfillment.delivered'
  | 'fulfillment.failed'
  | 'fulfillment.cancelled'
  | 'fulfillment.returned'
  | 'fulfillment.tracking_updated'
  // Tax events
  | 'tax.rate_created'
  | 'tax.rate_updated'
  | 'tax.exemption_applied'
  // Notification events
  | 'notification.failed'
  | 'notification.read'
  | 'notification.digest'
  // Return events
  | 'return.created'
  | 'return.approved'
  | 'return.denied'
  | 'return.in_transit'
  | 'return.received'
  | 'return.inspected'
  | 'return.completed'
  | 'return.cancelled'
  // Tracking events
  | 'tracking.config.created'
  | 'tracking.config.updated'
  | 'tracking.config.activated'
  | 'tracking.config.disabled'
  | 'tracking.config.deleted'
  | 'tracking.event.sent'
  | 'tracking.event.skipped'
  | 'tracking.event.failed'
  // B2B events
  | 'company.registered'
  | 'company.approved'
  | 'company.suspended'
  | 'company.user.invited'
  | 'company.user.accepted'
  | 'b2b_user.login_failed'
  | 'b2b_user.logged_in'
  | 'b2b_user.logged_out'
  | 'b2b_user.registered'
  | 'b2b_user.invited'
  | 'b2b_user.activated'
  | 'quote.created'
  | 'quote.sent'
  | 'quote.viewed'
  | 'quote.accepted'
  | 'quote.rejected'
  | 'quote.converted'
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected'
  | 'b2b.approval_submitted'
  | 'b2b.request_approved'
  | 'b2b.request_rejected'
  | 'b2b.request_escalated'
  | 'b2b.purchase_order_created'
  | 'b2b.purchase_order_submitted'
  | 'b2b.quote_requested'
  | 'b2b.quote_sent'
  | 'b2b.credit_requested'
  | 'b2b.credit_approved'
  // Marketplace events
  | 'marketplace.vendor.registered'
  | 'marketplace.vendor.approved'
  | 'marketplace.vendor.suspended'
  | 'marketplace.vendor.terminated'
  | 'marketplace.commission.created'
  | 'marketplace.commission.updated'
  | 'marketplace.payout.created'
  | 'marketplace.payout.processing'
  | 'marketplace.payout.completed'
  | 'marketplace.payout.failed'
  // Migration events
  | 'migration.job.created'
  | 'migration.job.started'
  | 'migration.job.completed'
  | 'migration.job.failed'
  | 'migration.job.cancelled'
  | 'migration.record.imported'
  | 'migration.record.skipped'
  | 'migration.record.error'
  // Integration events
  | 'integration.created'
  | 'integration.updated'
  | 'integration.activated'
  | 'integration.deactivated'
  | 'integration.deleted'
  | 'integration.credential.added'
  | 'integration.credential.updated'
  | 'integration.credential.expired'
  | 'integration.subscription.created'
  | 'integration.subscription.updated'
  | 'integration.dispatch.success'
  | 'integration.dispatch.failed';

/**
 * Planned event types for modules not yet implemented.
 * These are NOT emitted by any code today. When a module is built,
 * move its events into `EventType` above.
 * See docs/architecture/gap-analysis-and-roadmap.md for the roadmap.
 */
export type PlannedEventType =
  // Marketing events (no marketing module)
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
  // Gift Card events (no giftcard module)
  | 'giftcard.created'
  | 'giftcard.activated'
  | 'giftcard.redeemed'
  | 'giftcard.reloaded'
  | 'giftcard.expired'
  // Bundle events (no bundle module)
  | 'bundle.created'
  | 'bundle.purchased'
  // Pre-Order events (no preorder module)
  | 'preorder.created'
  | 'preorder.reserved'
  | 'preorder.fulfilled'
  | 'preorder.cancelled'
  // Pickup events (no pickup module)
  | 'pickup.created'
  | 'pickup.ready'
  | 'pickup.notified'
  | 'pickup.completed'
  | 'pickup.expired'
  // Fraud events (no fraud module)
  | 'fraud.check.created'
  | 'fraud.check.flagged'
  | 'fraud.check.blocked'
  | 'fraud.check.reviewed'
  | 'fraud.blacklist.added'
  // Channel events (no channel module)
  | 'channel.created'
  | 'channel.updated'
  | 'channel.activated'
  | 'channel.deactivated'
  | 'channel.products_assigned'
  | 'channel.warehouse_assigned';

export interface EventPayload {
  type: EventType;
  data: unknown;
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
  private outboxEnabled = false;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  /**
   * Enable or disable outbox mode.
   * When enabled, emit() writes to the eventOutbox table instead of
   * dispatching directly. The OutboxDispatcher reads the table and
   * calls dispatchFromOutbox() to actually run handlers.
   */
  setOutboxMode(enabled: boolean): void {
    this.outboxEnabled = enabled;
  }

  isOutboxMode(): boolean {
    return this.outboxEnabled;
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit(type: EventType, data: unknown, correlationId?: string, source?: string): Promise<void> {
    const payload: EventPayload = {
      type,
      data,
      timestamp: new Date(),
      correlationId: correlationId ?? getCorrelationId(),
      source,
    };

    logger.debug('Event emitted', { type, correlationId, source });

    // Emit to specific event handlers
    this.emitter.emit(type, payload);

    // Emit to wildcard handler
    this.emitter.emit('*', payload);

    // Call registered handlers with per-handler error boundaries
    const handlers = this.handlers.get(type) || [];
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err: unknown) {
        // Per-handler error boundary: log and continue so one failing
        // handler cannot break the emitting request or other handlers.
        logger.error('Event handler error (boundary caught)', {
          type,
          correlationId: payload.correlationId,
          error: (err as Error).message,
          stack: (err as Error).stack,
        });
      }
    }
  }

  /**
   * Dispatch an event payload from the outbox dispatcher.
   *
   * Unlike emit(), this method does NOT write to the outbox. It directly
   * invokes registered handlers with error boundaries. If any handler
   * throws, the error is re-thrown so the dispatcher can schedule a retry.
   */
  async dispatchFromOutbox(payload: EventPayload): Promise<void> {
    const { type } = payload;

    logger.debug('Dispatching outbox event', { type, correlationId: payload.correlationId });

    // Emit to EventEmitter listeners (wildcard + specific)
    this.emitter.emit(type, payload);
    this.emitter.emit('*', payload);

    // Call registered handlers. Collect errors instead of swallowing.
    const handlers = this.handlers.get(type) || [];
    const errors: Error[] = [];

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err: unknown) {
        logger.error('Outbox event handler error (boundary caught)', {
          type,
          correlationId: payload.correlationId,
          error: (err as Error).message,
          stack: (err as Error).stack,
        });
        errors.push(err as Error);
      }
    }

    // If any handler failed, re-throw so the dispatcher can retry
    if (errors.length > 0) {
      throw new Error(`Outbox dispatch failed for ${type}: ${errors.length} handler(s) failed. First error: ${errors[0].message}`);
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
