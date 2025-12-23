/**
 * Channel Domain Events
 *
 * Events emitted by the Channel module.
 */

import { eventBus } from '../../../../libs/events/eventBus';

// Event payloads
export interface ChannelCreatedEvent {
  channelId: string;
  name: string;
  code: string;
  type: string;
  ownerType: string;
  ownerId?: string;
}

export interface ChannelUpdatedEvent {
  channelId: string;
  changes: Record<string, unknown>;
}

export interface ChannelActivatedEvent {
  channelId: string;
}

export interface ChannelDeactivatedEvent {
  channelId: string;
}

export interface ChannelProductsAssignedEvent {
  channelId: string;
  productIds: string[];
}

export interface ChannelWarehouseAssignedEvent {
  channelId: string;
  warehouseIds: string[];
}

// Event emitters
export function emitChannelCreated(payload: ChannelCreatedEvent): void {
  eventBus.emit('channel.created', payload);
}

export function emitChannelUpdated(payload: ChannelUpdatedEvent): void {
  eventBus.emit('channel.updated', payload);
}

export function emitChannelActivated(payload: ChannelActivatedEvent): void {
  eventBus.emit('channel.activated', payload);
}

export function emitChannelDeactivated(payload: ChannelDeactivatedEvent): void {
  eventBus.emit('channel.deactivated', payload);
}

export function emitChannelProductsAssigned(payload: ChannelProductsAssignedEvent): void {
  eventBus.emit('channel.products_assigned', payload);
}

export function emitChannelWarehouseAssigned(payload: ChannelWarehouseAssignedEvent): void {
  eventBus.emit('channel.warehouse_assigned', payload);
}
