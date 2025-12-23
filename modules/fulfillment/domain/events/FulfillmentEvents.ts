/**
 * Fulfillment Domain Events
 * 
 * Events emitted by the Fulfillment module.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { FulfillmentStatus, SourceType } from '../entities/Fulfillment';

// Event payloads
export interface FulfillmentCreatedEvent {
  fulfillmentId: string;
  orderId: string;
  orderNumber?: string;
  sourceType: SourceType;
  sourceId: string;
}

export interface FulfillmentAssignedEvent {
  fulfillmentId: string;
  orderId: string;
  sourceType: SourceType;
  sourceId: string;
}

export interface FulfillmentStatusChangedEvent {
  fulfillmentId: string;
  orderId: string;
  previousStatus: FulfillmentStatus;
  newStatus: FulfillmentStatus;
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

export interface FulfillmentFailedEvent {
  fulfillmentId: string;
  orderId: string;
  reason: string;
}

// Event emitters
export function emitFulfillmentCreated(payload: FulfillmentCreatedEvent): void {
  eventBus.emit('fulfillment.created', payload);
}

export function emitFulfillmentAssigned(payload: FulfillmentAssignedEvent): void {
  eventBus.emit('fulfillment.assigned', payload);
}

export function emitFulfillmentPickingStarted(payload: { fulfillmentId: string; orderId: string }): void {
  eventBus.emit('fulfillment.picking_started', payload);
}

export function emitFulfillmentPackingCompleted(payload: { fulfillmentId: string; orderId: string }): void {
  eventBus.emit('fulfillment.packing_completed', payload);
}

export function emitFulfillmentShipped(payload: FulfillmentShippedEvent): void {
  eventBus.emit('fulfillment.shipped', payload);
}

export function emitFulfillmentDelivered(payload: FulfillmentDeliveredEvent): void {
  eventBus.emit('fulfillment.delivered', payload);
}

export function emitFulfillmentFailed(payload: FulfillmentFailedEvent): void {
  eventBus.emit('fulfillment.failed', payload);
}

export function emitFulfillmentReturned(payload: { fulfillmentId: string; orderId: string }): void {
  eventBus.emit('fulfillment.returned', payload);
}
