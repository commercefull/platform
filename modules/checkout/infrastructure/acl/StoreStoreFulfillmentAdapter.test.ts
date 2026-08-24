/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

jest.mock('../../../store/infrastructure/repositories/StoreRepo', () => ({
  __esModule: true,
  default: { findActive: jest.fn() },
}));

jest.mock('../../../store/infrastructure/repositories/pickupLocationRepo', () => ({
  __esModule: true,
  getLocations: jest.fn(),
  getLocation: jest.fn(),
  findNearestLocations: jest.fn(),
}));

import { StoreStoreFulfillmentAdapter } from './StoreStoreFulfillmentAdapter';

describe('StoreStoreFulfillmentAdapter', () => {
  let adapter: StoreStoreFulfillmentAdapter;
   
  let StoreRepo: any;
   
  let pickupLocationRepo: any;

  beforeEach(() => {
    StoreRepo = require('../../../store/infrastructure/repositories/StoreRepo').default;
    pickupLocationRepo = require('../../../store/infrastructure/repositories/pickupLocationRepo');
    adapter = new StoreStoreFulfillmentAdapter();
  });

  it('implements StoreFulfillmentPort', () => {
    expect(typeof adapter.checkLocalDeliveryEligibility).toBe('function');
    expect(typeof adapter.getAllPickupLocations).toBe('function');
    expect(typeof adapter.getPickupLocation).toBe('function');
    expect(typeof adapter.findNearestPickupLocations).toBe('function');
  });

  it('should return eligible options for postal code match', async () => {
    StoreRepo.findActive.mockResolvedValue([
      {
        storeId: 'store-1',
        name: 'Downtown Store',
        settings: {
          localDelivery: {
            enabled: true,
            postalCodes: ['97201'],
            deliveryFee: 5,
            estimatedDeliveryMinutes: 30,
            freeDeliveryThreshold: 50,
          },
        },
      },
    ]);

    const result = await adapter.checkLocalDeliveryEligibility({ postalCode: '97201' });

    expect(result.eligible).toBe(true);
    expect(result.options).toHaveLength(1);
    expect(result.options[0].storeId).toBe('store-1');
    expect(result.options[0].storeName).toBe('Downtown Store');
    expect(result.options[0].deliveryFee).toBe(5);
    expect(result.options[0].estimatedDeliveryMinutes).toBe(30);
  });

  it('should return not eligible when no stores match', async () => {
    StoreRepo.findActive.mockResolvedValue([
      {
        storeId: 'store-1',
        name: 'Store',
        settings: { localDelivery: { enabled: true, postalCodes: ['10001'] } },
      },
    ]);

    const result = await adapter.checkLocalDeliveryEligibility({ postalCode: '97201' });

    expect(result.eligible).toBe(false);
    expect(result.options).toEqual([]);
  });

  it('should skip stores with local delivery disabled', async () => {
    StoreRepo.findActive.mockResolvedValue([
      {
        storeId: 'store-1',
        name: 'Store',
        settings: { localDelivery: { enabled: false } },
      },
    ]);

    const result = await adapter.checkLocalDeliveryEligibility({ postalCode: '97201' });

    expect(result.eligible).toBe(false);
  });

  it('should check radius-based eligibility using Haversine distance', async () => {
    StoreRepo.findActive.mockResolvedValue([
      {
        storeId: 'store-1',
        name: 'Nearby Store',
        address: { latitude: 45.5152, longitude: -122.6784 },
        settings: {
          localDelivery: {
            enabled: true,
            postalCodes: [],
            radiusKm: 10,
            deliveryFee: 3,
            estimatedDeliveryMinutes: 20,
          },
        },
      },
    ]);

    const result = await adapter.checkLocalDeliveryEligibility({
      latitude: 45.52,
      longitude: -122.67,
    });

    expect(result.eligible).toBe(true);
    expect(result.options[0].radiusKm).toBe(10);
  });

  it('should map pickup locations to checkout vocabulary', async () => {
    pickupLocationRepo.getLocations.mockResolvedValue([
      {
        pickupLocationId: 'loc-1',
        storeId: 'store-1',
        name: 'Downtown Pickup',
        address: { line1: '123 Main St', city: 'Portland', postalCode: '97201', country: 'US' },
        latitude: 45.51,
        longitude: -122.68,
      },
    ]);

    const result = await adapter.getAllPickupLocations();

    expect(result).toHaveLength(1);
    expect(result[0].locationId).toBe('loc-1');
    expect(result[0].storeId).toBe('store-1');
    expect(result[0].storeName).toBe('Downtown Pickup');
    expect(result[0].address.line1).toBe('123 Main St');
    expect(result[0].address.city).toBe('Portland');
    expect(result[0].address.latitude).toBe(45.51);
  });

  it('should get single pickup location by id', async () => {
    pickupLocationRepo.getLocation.mockResolvedValue({
      pickupLocationId: 'loc-1',
      storeId: 'store-1',
      name: 'Downtown Pickup',
      address: { line1: '123 Main St', city: 'Portland', postalCode: '97201', country: 'US' },
      latitude: 45.51,
      longitude: -122.68,
    });

    const result = await adapter.getPickupLocation('loc-1');

    expect(result).not.toBeNull();
    expect(result!.locationId).toBe('loc-1');
    expect(result!.address.line1).toBe('123 Main St');
  });

  it('should return null when pickup location not found', async () => {
    pickupLocationRepo.getLocation.mockResolvedValue(null);

    const result = await adapter.getPickupLocation('nonexistent');
    expect(result).toBeNull();
  });

  it('should find nearest pickup locations with default radius', async () => {
    pickupLocationRepo.findNearestLocations.mockResolvedValue([
      {
        pickupLocationId: 'loc-1',
        storeId: 'store-1',
        name: 'Nearby',
        address: { line1: '123 Main', city: 'Portland', postalCode: '97201', country: 'US' },
        latitude: 45.51,
        longitude: -122.68,
        distance: 2.5,
      },
    ]);

    const result = await adapter.findNearestPickupLocations(45.51, -122.68);

    expect(pickupLocationRepo.findNearestLocations).toHaveBeenCalledWith(45.51, -122.68, 50);
    expect(result).toHaveLength(1);
    expect(result[0].locationId).toBe('loc-1');
  });

  it('should find nearest pickup locations with custom radius', async () => {
    pickupLocationRepo.findNearestLocations.mockResolvedValue([]);

    await adapter.findNearestPickupLocations(45.51, -122.68, 10);

    expect(pickupLocationRepo.findNearestLocations).toHaveBeenCalledWith(45.51, -122.68, 10);
  });
});
