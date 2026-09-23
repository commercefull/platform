/**
 * Shared test utilities for inventory use-case tests.
 * Mocks module boundaries (eventBus, uuid, libs/db, logger) once and
 * provides typed lazy port mocks plus entity factories.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { generateUUID } from '../../../libs/uuid';
import { Inventory, InventoryLocation, InventoryMovement } from '../domain/entities/Inventory';
import { StoreDispatch } from '../domain/entities/StoreDispatch';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn(), registerHandler: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'inventory-uuid-123'),
  isUuid: jest.fn(() => true),
}));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../libs/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(async (fn: (client?: unknown) => Promise<unknown>) => fn()),
}));

export const emitMock = jest.mocked(eventBus.emit);
export const uuidMock = jest.mocked(generateUUID);

export function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    // `in` checks must see every port method
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

// ============================================================================
// Entity factories
// ============================================================================


export function createStoreDispatch(overrides: Partial<Parameters<typeof StoreDispatch.create>[0]> = {}): StoreDispatch {
  return StoreDispatch.create({
    dispatchId: 'd1',
    fromStoreId: 's1',
    toStoreId: 's2',
    dispatchNumber: 'DSP-1',
    items: [{ dispatchItemId: 'di-1', productId: 'p1', requestedQuantity: 10 }],
    ...overrides,
  });
}

export function createLocation(overrides: Partial<InventoryLocation> = {}): InventoryLocation {
  return { locationId: 'loc-1', name: 'Main Warehouse', type: 'warehouse', isActive: true, priority: 1, ...overrides };
}

export function createInventory(overrides: Partial<Parameters<typeof Inventory.create>[0]> = {}): Inventory {
  return Inventory.create({
    inventoryId: 'inv-1',
    productId: 'p1',
    locationId: 'loc-1',
    sku: 'SKU-1',
    quantity: 100,
    ...overrides,
  });
}

export function createInventoryMovement(overrides: Partial<InventoryMovement> = {}): InventoryMovement {
  return {
    movementId: 'mv-1',
    inventoryId: 'inv-1',
    productId: 'p1',
    locationId: 'loc-1',
    type: 'inbound',
    quantity: 10,
    previousQuantity: 90,
    newQuantity: 100,
    performedBy: 'user1',
    createdAt: new Date(),
    ...overrides,
  };
}
