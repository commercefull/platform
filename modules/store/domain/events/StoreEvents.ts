/**
 * Store Domain Events
 * 
 * Events emitted by the Store module.
 */

import { eventBus } from '../../../../libs/events/eventBus';

// Event payloads
export interface StoreCreatedEvent {
  storeId: string;
  name: string;
  slug: string;
  storeType: 'merchant_store' | 'business_store';
  merchantId?: string;
  businessId?: string;
}

export interface StoreUpdatedEvent {
  storeId: string;
  changes: string[];
}

export interface StoreActivatedEvent {
  storeId: string;
}

export interface StoreDeactivatedEvent {
  storeId: string;
}

export interface StoreDeletedEvent {
  storeId: string;
}

export interface StoreInventoryLinkedEvent {
  storeId: string;
  inventoryId: string;
  inventoryMode: 'dedicated' | 'shared' | 'virtual';
}

export interface StoreInventoryUnlinkedEvent {
  storeId: string;
  inventoryId: string;
}

export interface StoreSettingsUpdatedEvent {
  storeId: string;
  settings: Record<string, unknown>;
}

export interface StorePickupConfiguredEvent {
  storeId: string;
  pickupEnabled: boolean;
  pickupLocations?: string[];
}

// Event emitters
export function emitStoreCreated(payload: StoreCreatedEvent): void {
  eventBus.emit('store.created', payload);
}

export function emitStoreUpdated(payload: StoreUpdatedEvent): void {
  eventBus.emit('store.updated', payload);
}

export function emitStoreActivated(payload: StoreActivatedEvent): void {
  eventBus.emit('store.activated', payload);
}

export function emitStoreDeactivated(payload: StoreDeactivatedEvent): void {
  eventBus.emit('store.deactivated', payload);
}

export function emitStoreDeleted(payload: StoreDeletedEvent): void {
  eventBus.emit('store.deleted', payload);
}

export function emitStoreInventoryLinked(payload: StoreInventoryLinkedEvent): void {
  eventBus.emit('store.inventory_linked', payload);
}

export function emitStoreInventoryUnlinked(payload: StoreInventoryUnlinkedEvent): void {
  eventBus.emit('store.inventory_unlinked', payload);
}

export function emitStoreSettingsUpdated(payload: StoreSettingsUpdatedEvent): void {
  eventBus.emit('store.settings_updated', payload);
}

export function emitStorePickupConfigured(payload: StorePickupConfiguredEvent): void {
  eventBus.emit('store.pickup_configured', payload);
}
