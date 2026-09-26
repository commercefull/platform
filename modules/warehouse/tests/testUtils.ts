/**
 * Shared test helpers for the warehouse module.
 * Boundary mocks (event bus) + lazily-created typed port mocks.
 */

import { eventBus } from '../../../libs/events/eventBus';
import type { WarehouseRecord } from '../domain/repositories/WarehouseRepository';
import type { ActivateWarehouseUseCase } from '../application/useCases/ActivateWarehouse';
import type { AssignToStoreUseCase } from '../application/useCases/AssignToStore';
import type { CreateWarehouseUseCase } from '../application/useCases/CreateWarehouse';
import type { DeactivateWarehouseUseCase } from '../application/useCases/DeactivateWarehouse';
import type { DeleteWarehouseUseCase } from '../application/useCases/DeleteWarehouse';
import type { GetWarehouseUseCase } from '../application/useCases/GetWarehouse';
import type { ListWarehousesUseCase } from '../application/useCases/ListWarehouses';
import type { UpdateWarehouseUseCase } from '../application/useCases/UpdateWarehouse';
import type { ManageWarehouseAdminUseCase } from '../application/useCases/ManageWarehouseAdmin';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

beforeEach(() => {
  emitMock.mockClear();
});

/**
 * A lazily-created `jest.Mocked<T>`: every accessed method is a `jest.fn`,
 * so tests configure only the methods they exercise.
 */
function lazyMock<T>(): jest.Mocked<T> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
}

export function createWarehouseRepository(): jest.Mocked<ConstructorParameters<typeof ManageWarehouseAdminUseCase>[0]> {
  return lazyMock();
}

export function createActivateRepository(): jest.Mocked<ConstructorParameters<typeof ActivateWarehouseUseCase>[0]> {
  return lazyMock();
}

export function createAssignRepositories(): {
  warehouseRepository: jest.Mocked<ConstructorParameters<typeof AssignToStoreUseCase>[0]>;
  storeRepository: jest.Mocked<ConstructorParameters<typeof AssignToStoreUseCase>[1]>;
} {
  return { warehouseRepository: lazyMock(), storeRepository: lazyMock() };
}

export function createCreateRepository(): jest.Mocked<ConstructorParameters<typeof CreateWarehouseUseCase>[0]> {
  return lazyMock();
}

export function createDeactivateRepository(): jest.Mocked<ConstructorParameters<typeof DeactivateWarehouseUseCase>[0]> {
  return lazyMock();
}

export function createDeleteRepository(): jest.Mocked<ConstructorParameters<typeof DeleteWarehouseUseCase>[0]> {
  return lazyMock();
}

export function createGetRepository(): jest.Mocked<ConstructorParameters<typeof GetWarehouseUseCase>[0]> {
  return lazyMock();
}

export function createListRepository(): jest.Mocked<ConstructorParameters<typeof ListWarehousesUseCase>[0]> {
  return lazyMock();
}

export function createUpdateRepository(): jest.Mocked<ConstructorParameters<typeof UpdateWarehouseUseCase>[0]> {
  return lazyMock();
}

// ---------------------------------------------------------------------------
// Record factory — matches the flat `WarehouseRecord` shape the repository
// layer returns. The superset satisfies each use case's local record port.
// ---------------------------------------------------------------------------

export function createWarehouseRecord(overrides: Partial<WarehouseRecord> = {}): WarehouseRecord {
  return {
    distributionWarehouseId: 'wh-1',
    name: 'Main WH',
    code: 'WH01',
    description: 'Main warehouse',
    isActive: true,
    isDefault: false,
    isFulfillmentCenter: false,
    isReturnCenter: false,
    isVirtual: false,
    addressLine1: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    postalCode: '12345',
    country: 'US',
    timezone: 'America/Chicago',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}
