/**
 * Fulfillment Domain Events
 *
 * Events emitted by the Fulfillment module.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { SourceType } from '../entities/Fulfillment';

// Event payloads
export interface FulfillmentCreatedEvent {
  fulfillmentId: string;
  orderId: string;
  orderNumber?: string;
  sourceType: SourceType;
  sourceId: string;
}



export interface FulfillmentShippedEvent {
  fulfillmentId: string;
  orderId: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrierName?: string;
}

export interface FulfillmentDeliveredEvent {
  fulfillmentId: string;
  orderId: string;
  deliveredAt: Date;
}


// Event emitters
export function emitFulfillmentCreated(payload: FulfillmentCreatedEvent): void {
  eventBus.emit('fulfillment.created', payload);
}


export function emitFulfillmentPickingStarted(payload: { fulfillmentId: string; orderId: string }): void {
  eventBus.emit('fulfillment.picking_started', payload);
}


export function emitFulfillmentShipped(payload: FulfillmentShippedEvent): void {
  eventBus.emit('fulfillment.shipped', payload);
}

export function emitFulfillmentDelivered(payload: FulfillmentDeliveredEvent): void {
  eventBus.emit('fulfillment.delivered', payload);
}



