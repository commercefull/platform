jest.mock('../../../store/infrastructure/repositories/StoreRepo', () => ({
  __esModule: true,
  default: { findActive: jest.fn() },
}));

jest.mock('../../../warehouse/infrastructure/repositories/warehouseRepo', () => ({
  __esModule: true,
  default: { findDefault: jest.fn() },
}));

import StoreRepo from '../../../store/infrastructure/repositories/StoreRepo';
import WarehouseRepo from '../../../warehouse/infrastructure/repositories/warehouseRepo';
import { FulfillmentSourceAdapter } from './FulfillmentSourceAdapter';
import type { Store } from '../../../store/domain/entities/Store';

const storeRepo = StoreRepo as unknown as { findActive: jest.Mock };
const warehouseRepo = WarehouseRepo as unknown as { findDefault: jest.Mock };

const store = (overrides: Partial<Store> = {}): Store =>
  ({
    storeId: 's1',
    name: 'Store 1',
    address: { line1: '123 Main', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US', latitude: 40.7, longitude: -74 },
    settings: {
      allowGuestCheckout: true,
      pickup: { enabled: true },
      localDelivery: { enabled: false },
    },
    isHeadquarters: false,
    ...overrides,
  }) as Store;

describe('FulfillmentSourceAdapter', () => {
  let adapter: FulfillmentSourceAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new FulfillmentSourceAdapter();
  });

  it('should map active stores to fulfillable stores', async () => {
    storeRepo.findActive.mockResolvedValue([store()]);

    const result = await adapter.findFulfillableStores();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      storeId: 's1',
      name: 'Store 1',
      settings: { allowOnlineOrdering: true, pickup: { enabled: true }, localDelivery: { enabled: false } },
    });
    expect(result[0].address?.line1).toBe('123 Main');
  });

  it('should map allowOnlineOrdering from the store allowGuestCheckout setting', async () => {
    storeRepo.findActive.mockResolvedValue([store({ settings: { allowGuestCheckout: false } as Store['settings'] })]);
    const result = await adapter.findFulfillableStores();
    expect(result[0].settings?.allowOnlineOrdering).toBe(false);
  });

  it('should leave pickup/localDelivery undefined when store settings lack them', async () => {
    storeRepo.findActive.mockResolvedValue([store({ settings: undefined })]);
    const result = await adapter.findFulfillableStores();
    expect(result[0].settings?.pickup).toBeUndefined();
    expect(result[0].settings?.localDelivery).toBeUndefined();
  });

  it('should map the default warehouse when one exists', async () => {
    warehouseRepo.findDefault.mockResolvedValue({
      distributionWarehouseId: 'w1',
      name: 'Main WH',
      addressLine1: '456 St',
      city: 'LA',
      state: 'CA',
      postalCode: '90001',
      country: 'US',
      phone: '555',
      email: 'wh@x.com',
    });

    const result = await adapter.findDefaultWarehouse();

    expect(result).toMatchObject({ distributionWarehouseId: 'w1', name: 'Main WH', city: 'LA', email: 'wh@x.com' });
  });

  it('should return null when no default warehouse exists', async () => {
    warehouseRepo.findDefault.mockResolvedValue(null);
    expect(await adapter.findDefaultWarehouse()).toBeNull();
  });
});
