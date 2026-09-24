/**
 * Event Handler Registration
 *
 * Centralized registration of all event handlers at application boot.
 * Each module owns its handlers in `modules/<m>/application/eventHandlers.ts`;
 * this file wires them — injecting cross-module dependencies — and gates
 * each on the module registry.
 */

import { eventBus } from '../libs/events/eventBus';
import { logger } from '../libs/logger';
import { stopOutboxDispatcher } from '../libs/events/outboxDispatcher';
import { moduleRegistry } from './moduleManifests';

import { OrderDataRepository as OrderDataRepo } from '../modules/order/infrastructure';
import { InventoryDataRepository as InventoryDataRepo } from '../modules/inventory/infrastructure';
import { WarehouseDataRepository as WarehouseDataRepo } from '../modules/warehouse/infrastructure';
import { FulfillmentDataRepository as FulfillmentDataRepo } from '../modules/fulfillment/infrastructure';
import { StoreDataRepository as StoreDataRepo } from '../modules/store/infrastructure';
import { LoyaltyDataRepository as LoyaltyDataRepo } from '../modules/loyalty/infrastructure';
import { CheckoutRepository as CheckoutRepo } from '../modules/checkout/infrastructure';
import { GdprDataRepository } from '../modules/gdpr/infrastructure';
import { WebhookRepository as WebhookRepo } from '../modules/webhook/infrastructure';
import { TrackingConfigRepositoryImpl } from '../modules/tracking/infrastructure';

import { registerOrderEventHandlers, registerOrderPaymentEventHandlers } from '../modules/order/application/eventHandlers';
import { registerInventoryEventHandlers } from '../modules/inventory/application/eventHandlers';
import { registerFulfillmentEventHandlers } from '../modules/fulfillment/application/eventHandlers';
import { registerLoyaltyEventHandlers } from '../modules/loyalty/application/eventHandlers';
import { registerStoreEventHandlers } from '../modules/store/application/eventHandlers';
import { registerOrganizationEventHandlers } from '../modules/organization/application/eventHandlers';
import { registerBasketEventHandlers } from '../modules/basket/application/eventHandlers';
import { registerCheckoutEventHandlers } from '../modules/checkout/application/eventHandlers';
import { registerPaymentEventHandlers } from '../modules/payment/application/eventHandlers';
import { registerCustomerEventHandlers } from '../modules/customer/application/eventHandlers';
import { registerProductEventHandlers } from '../modules/product/application/eventHandlers';
import { registerSubscriptionEventHandlers } from '../modules/subscription/application/eventHandlers';
import { registerWebhookEventHandlers } from '../modules/webhook/application/eventHandlers';
import { registerIntegrationEventHandlers } from '../modules/integration/application/eventHandlers';
import {
  registerTrackingEventHandlers,
  setConsentRepository,
} from '../modules/tracking/application/eventHandlers/trackingEventHandlers';
import type { WebhookDispatchService } from '../modules/webhook/application/services/WebhookDispatchService';

// Track registration state
let isRegistered = false;
let webhookDispatchService: WebhookDispatchService | null = null;

/**
 * Module event-handler registrations. Each entry is gated on
 * `moduleRegistry.shouldRegisterEvents(module)` at boot.
 */
const eventHandlerModules: { module: string; register: () => void }[] = [
  {
    // Order handlers (payment lifecycle + completion notification)
    module: 'order',
    register: () => {
      registerOrderPaymentEventHandlers(OrderDataRepo.commands);
      registerOrderEventHandlers(OrderDataRepo.commands);
    },
  },
  {
    // Inventory handlers (reservation lifecycle, stock alerts)
    module: 'inventory',
    register: () =>
      registerInventoryEventHandlers({
        orders: OrderDataRepo.commands,
        stock: InventoryDataRepo.stock,
        reservations: InventoryDataRepo.reservations,
      }),
  },
  {
    // Fulfillment handlers (order.paid orchestration, status sync)
    module: 'fulfillment',
    register: () =>
      registerFulfillmentEventHandlers({
        orders: OrderDataRepo.commands,
        stores: StoreDataRepo.stores,
        warehouses: WarehouseDataRepo.warehouses,
        stock: InventoryDataRepo.stock,
        reservations: InventoryDataRepo.reservations,
        fulfillments: FulfillmentDataRepo.fulfillments,
      }),
  },
  {
    // Loyalty handlers (points on order.completed, tier updates)
    module: 'loyalty',
    register: () =>
      registerLoyaltyEventHandlers({
        orders: OrderDataRepo.commands,
        points: LoyaltyDataRepo.points,
      }),
  },
  // Store handlers (inventory sync, pickup notifications)
  { module: 'store', register: registerStoreEventHandlers },
  // Organization handlers (settlement updates)
  { module: 'organization', register: registerOrganizationEventHandlers },
  // Basket handlers (cart recovery)
  { module: 'basket', register: registerBasketEventHandlers },
  // Checkout handlers (Published Language: reacts to payment events)
  { module: 'checkout', register: () => registerCheckoutEventHandlers(CheckoutRepo) },
  // Payment handlers (order status, notifications)
  { module: 'payment', register: () => registerPaymentEventHandlers({ orders: OrderDataRepo.commands }) },
  // Customer handlers (welcome email)
  { module: 'customer', register: registerCustomerEventHandlers },
  // Product handlers (search index, cache invalidation)
  { module: 'product', register: registerProductEventHandlers },
  // Subscription handlers (notifications, analytics)
  { module: 'subscription', register: registerSubscriptionEventHandlers },
  {
    // Webhook dispatch (forwards eventBus events to registered webhook endpoints)
    module: 'webhook',
    register: () => {
      webhookDispatchService = registerWebhookEventHandlers(WebhookRepo);
    },
  },
  {
    // Tracking handlers (server-side GTM + Meta CAPI, consent-gated)
    module: 'tracking',
    register: () => {
      // Wire consent repository from GDPR module for consent gating
      if (moduleRegistry.isEnabled('gdpr')) {
        setConsentRepository(GdprDataRepository.cookieConsent);
      }
      registerTrackingEventHandlers(new TrackingConfigRepositoryImpl());
    },
  },
  // Integration dispatcher (forwards events to third-party integrations)
  { module: 'integration', register: registerIntegrationEventHandlers },
];

/**
 * Register all event handlers on application boot
 * Called from app initialization (server.ts or app.ts)
 */
export function registerAllEventHandlers(): void {
  if (isRegistered) {
    return;
  }

  try {
    for (const { module, register } of eventHandlerModules) {
      if (moduleRegistry.shouldRegisterEvents(module)) {
        register();
      }
    }

    isRegistered = true;

    logger.info('Event handlers registered', { registeredTypes: eventBus.getRegisteredTypes().length });
  } catch (error) {
    logger.error('Failed to register event handlers', { error });
    throw error;
  }
}

/**
 * Unregister all handlers (for testing/shutdown)
 */
export async function unregisterAllEventHandlers(): Promise<void> {
  if (webhookDispatchService) {
    webhookDispatchService.stop();
    webhookDispatchService = null;
  }
  // Stop the outbox dispatcher
  await stopOutboxDispatcher();
  isRegistered = false;
  // EventBus doesn't have a clearAll method, so handlers persist
  // This is mainly for tracking registration state
}
