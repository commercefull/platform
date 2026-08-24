/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

describe('StorePickupLocationAdapter', () => {
  let adapter: import('./StorePickupLocationAdapter').StorePickupLocationAdapter;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      saveLocation: jest.fn(),
      getLocation: jest.fn(),
      getLocations: jest.fn(),
      updateLocation: jest.fn(),
      deleteLocation: jest.fn(),
    };
    jest.resetModules();
    jest.doMock('../../../store/infrastructure/repositories/pickupLocationRepo', () => ({
      ...mockRepo,
      default: mockRepo,
    }));
    const { StorePickupLocationAdapter } = require('./StorePickupLocationAdapter');
    adapter = new StorePickupLocationAdapter();
  });

  afterEach(() => {
    jest.dontMock('../../../store/infrastructure/repositories/pickupLocationRepo');
  });

  const mockLocation = {
    pickupLocationId: 'ploc_1',
    storeId: 'store_1',
    name: 'Main Store',
    address: {
      line1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
    isActive: true,
    prepareTimeMinutes: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('implements PickupLocationPort', () => {
    expect(typeof adapter.findById).toBe('function');
    expect(typeof adapter.findAll).toBe('function');
    expect(typeof adapter.create).toBe('function');
    expect(typeof adapter.update).toBe('function');
    expect(typeof adapter.delete).toBe('function');
  });

  it('should map findById to PickupLocationSummary', async () => {
    mockRepo.getLocation.mockResolvedValue(mockLocation);

    const result = await adapter.findById('ploc_1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('ploc_1');
    expect(result!.storeId).toBe('store_1');
    expect(result!.name).toBe('Main Store');
    expect(result!.address.city).toBe('New York');
    expect(result!.isActive).toBe(true);
    expect(result!.prepareTimeMinutes).toBe(60);
  });

  it('should return null when location not found', async () => {
    mockRepo.getLocation.mockResolvedValue(null);

    const result = await adapter.findById('nonexistent');

    expect(result).toBeNull();
  });

  it('should map findAll to PickupLocationSummary array', async () => {
    mockRepo.getLocations.mockResolvedValue([mockLocation, { ...mockLocation, pickupLocationId: 'ploc_2', name: 'Branch Store' }]);

    const results = await adapter.findAll();

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('ploc_1');
    expect(results[1].id).toBe('ploc_2');
    expect(results[1].name).toBe('Branch Store');
  });

  it('should pass storeId to getLocations when provided', async () => {
    mockRepo.getLocations.mockResolvedValue([]);

    await adapter.findAll('store_1');

    expect(mockRepo.getLocations).toHaveBeenCalledWith('store_1');
  });

  it('should pass undefined storeId to getLocations when not provided', async () => {
    mockRepo.getLocations.mockResolvedValue([]);

    await adapter.findAll();

    expect(mockRepo.getLocations).toHaveBeenCalledWith(undefined);
  });

  it('should create a location and map to summary', async () => {
    mockRepo.saveLocation.mockResolvedValue(mockLocation);

    const result = await adapter.create({
      storeId: 'store_1',
      name: 'Main Store',
      address: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
      prepareTimeMinutes: 60,
    });

    expect(result.id).toBe('ploc_1');
    expect(result.name).toBe('Main Store');
    expect(mockRepo.saveLocation).toHaveBeenCalledWith(expect.objectContaining({ storeId: 'store_1', name: 'Main Store' }));
  });

  it('should update a location and map to summary', async () => {
    mockRepo.updateLocation.mockResolvedValue({ ...mockLocation, name: 'Updated Store' });

    const result = await adapter.update('ploc_1', { name: 'Updated Store' });

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Updated Store');
    expect(mockRepo.updateLocation).toHaveBeenCalledWith('ploc_1', { name: 'Updated Store' });
  });

  it('should return null when update target not found', async () => {
    mockRepo.updateLocation.mockResolvedValue(null);

    const result = await adapter.update('nonexistent', { name: 'Test' });

    expect(result).toBeNull();
  });

  it('should delete a location', async () => {
    mockRepo.deleteLocation.mockResolvedValue(true);

    const result = await adapter.delete('ploc_1');

    expect(result).toBe(true);
    expect(mockRepo.deleteLocation).toHaveBeenCalledWith('ploc_1');
  });

  it('should return false when delete target not found', async () => {
    mockRepo.deleteLocation.mockResolvedValue(false);

    const result = await adapter.delete('nonexistent');

    expect(result).toBe(false);
  });
});
