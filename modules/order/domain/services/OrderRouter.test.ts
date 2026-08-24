import { OrderRouter } from './OrderRouter';
import { NoEligibleStoresError, NoStoresWithInventoryError, NoPickupStoresError, NoFulfillmentStoresError, NoStoresWithInventoryForFulfillmentError } from '../errors/OrderErrors';

describe('OrderRouter', () => {
  const mockInventoryRepo = {
    getAvailableQuantity: jest.fn(),
  };
  const mockStoreRepo = {
    findById: jest.fn(),
  };
  let router: OrderRouter;

  beforeEach(() => {
    jest.clearAllMocks();
    router = new OrderRouter(mockStoreRepo as never, mockInventoryRepo as never);
  });

  const stores = [
    { storeId: 's1', name: 'Store 1', canFulfillOnline: true, canPickupInStore: true, localDeliveryEnabled: false, priority: 1, latitude: 40.7, longitude: -74.0 },
    { storeId: 's2', name: 'Store 2', canFulfillOnline: true, canPickupInStore: false, localDeliveryEnabled: true, priority: 2, latitude: 41.0, longitude: -73.0 },
  ];

  const order = {
    orderId: 'o1', fulfillmentType: 'shipping' as const,
    items: [{ productId: 'p1', quantity: 2 }],
  };

  it('should route order to store with inventory (happy path)', async () => {
    mockInventoryRepo.getAvailableQuantity.mockResolvedValue(5);
    const result = await router.routeOrderToStore(order, stores);
    expect(result.storeId).toBe('s1');
    expect(result.reason).toBeDefined();
  });

  it('should throw when no eligible stores', async () => {
    const noMatchStores = [{ storeId: 's3', name: 'Store 3', canFulfillOnline: false, canPickupInStore: false, localDeliveryEnabled: false }];
    await expect(router.routeOrderToStore(order, noMatchStores)).rejects.toThrow(NoEligibleStoresError);
  });

  it('should throw when no stores with inventory', async () => {
    mockInventoryRepo.getAvailableQuantity.mockResolvedValue(0);
    await expect(router.routeOrderToStore(order, stores)).rejects.toThrow(NoStoresWithInventoryError);
  });

  it('should route pickup to selected store', async () => {
    const pickupOrder = { ...order, fulfillmentType: 'pickup' as const, storeId: 's1' };
    mockInventoryRepo.getAvailableQuantity.mockResolvedValue(5);
    const result = await router.routeOrderToStore(pickupOrder, stores);
    expect(result.storeId).toBe('s1');
    expect(result.reason).toContain('pickup');
  });

  it('should determine pickup store by distance', async () => {
    mockInventoryRepo.getAvailableQuantity.mockResolvedValue(5);
    const result = await router.determinePickupStore(
      order, { latitude: 40.7, longitude: -74.0 }, stores,
    );
    expect(result.storeId).toBe('s1');
  });

  it('should throw when no pickup stores', async () => {
    await expect(router.determinePickupStore(order, {}, [stores[1]])).rejects.toThrow(NoPickupStoresError);
  });

  it('should determine fulfillment store', async () => {
    mockInventoryRepo.getAvailableQuantity.mockResolvedValue(5);
    const result = await router.determineFulfillmentStore(order, stores);
    expect(result.storeId).toBeDefined();
    expect(result.reason).toContain('inventory');
  });

  it('should throw when no fulfillment stores', async () => {
    await expect(router.determineFulfillmentStore(order, [stores[1].storeId === 's2' ? { ...stores[1], canFulfillOnline: false } : stores[1]])).rejects.toThrow(NoFulfillmentStoresError);
  });

  it('should throw when no stores with inventory for fulfillment', async () => {
    mockInventoryRepo.getAvailableQuantity.mockResolvedValue(0);
    await expect(router.determineFulfillmentStore(order, stores)).rejects.toThrow(NoStoresWithInventoryForFulfillmentError);
  });
});
