import { lazyMock } from '../../tests/testUtils';
import { ManageInventoryLocationsUseCase } from './ManageInventoryLocations';

describe('ManageInventoryLocationsUseCase', () => {
  let useCase: ManageInventoryLocationsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageInventoryLocationsUseCase>[0]>;

  const location = {
    inventoryLocationId: 'loc1',
    distributionWarehouseId: 'wh1',
    productId: 'p1',
    sku: 'SKU-1',
    quantity: 10,
    reservedQuantity: 2,
  };

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof ManageInventoryLocationsUseCase>[0]>();
    useCase = new ManageInventoryLocationsUseCase(mockRepo);
  });

  it('should delegate location lookups to the repository', async () => {
    mockRepo.findLocationById.mockResolvedValue(location as never);

    const result = await useCase.findLocationById('loc1');

    expect(result).toBe(location);
    expect(mockRepo.findLocationById).toHaveBeenCalledWith('loc1');
  });

  it('should delegate location listing with filter and pagination', async () => {
    mockRepo.findLocations.mockResolvedValue([location] as never);

    const result = await useCase.findLocations({ sku: 'SKU-1' }, 20, 40);

    expect(result).toEqual([location]);
    expect(mockRepo.findLocations).toHaveBeenCalledWith({ sku: 'SKU-1' }, 20, 40);
  });

  it('should create a location through the repository', async () => {
    const input = { distributionWarehouseId: 'wh1', productId: 'p1', sku: 'SKU-1', quantity: 5 };
    mockRepo.createLocation.mockResolvedValue(location as never);

    const result = await useCase.createLocation(input);

    expect(result).toBe(location);
    expect(mockRepo.createLocation).toHaveBeenCalledWith(input);
  });

  it('should update a location through the repository', async () => {
    mockRepo.updateLocation.mockResolvedValue({ ...location, quantity: 7 } as never);

    const result = await useCase.updateLocation('loc1', { quantity: 7 });

    expect(result.quantity).toBe(7);
    expect(mockRepo.updateLocation).toHaveBeenCalledWith('loc1', { quantity: 7 });
  });

  it('should delete a location through the repository', async () => {
    mockRepo.deleteLocation.mockResolvedValue(true);

    const result = await useCase.deleteLocation('loc1');

    expect(result).toBe(true);
    expect(mockRepo.deleteLocation).toHaveBeenCalledWith('loc1');
  });

  it('should delegate stock reports and availability checks', async () => {
    mockRepo.findLowStockLocations.mockResolvedValue([location] as never);
    mockRepo.findOutOfStockLocations.mockResolvedValue([] as never);
    mockRepo.checkProductAvailability.mockResolvedValue({ available: true, totalAvailable: 8, locations: [location] } as never);

    expect(await useCase.findLowStockLocations()).toEqual([location]);
    expect(await useCase.findOutOfStockLocations()).toEqual([]);
    expect(await useCase.checkProductAvailability('p1', 'v1', 3)).toEqual({
      available: true,
      totalAvailable: 8,
      locations: [location],
    });
    expect(mockRepo.checkProductAvailability).toHaveBeenCalledWith('p1', 'v1', 3);
  });

  it('should delegate transaction and transaction-type lookups', async () => {
    mockRepo.findTransactionsByProductId.mockResolvedValue([{ inventoryTransactionId: 't1' }] as never);
    mockRepo.findAllTransactionTypes.mockResolvedValue([{ code: 'ADJUST' }] as never);

    expect(await useCase.findTransactionsByProductId('p1', 25)).toEqual([{ inventoryTransactionId: 't1' }]);
    expect(await useCase.findAllTransactionTypes()).toEqual([{ code: 'ADJUST' }]);
    expect(mockRepo.findTransactionsByProductId).toHaveBeenCalledWith('p1', 25);
  });
});
