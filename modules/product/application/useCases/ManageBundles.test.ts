import { ManageBundlesUseCase } from './ManageBundles';
import { lazyMock } from '../../tests/testUtils';

describe('ManageBundlesUseCase', () => {
  let useCase: ManageBundlesUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageBundlesUseCase>[0]>;

  const bundle = { productBundleId: 'b1', productId: 'p1', name: 'Starter Kit', isActive: true };
  const item = { bundleItemId: 'i1', productBundleId: 'b1', productId: 'p2' };
  const pricing = { priceCents: 5000, savingsCents: 500, savingsPercent: 9 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<ConstructorParameters<typeof ManageBundlesUseCase>[0]>();
    useCase = new ManageBundlesUseCase(mockRepo);
  });

  it('should list bundles', async () => {
    mockRepo.getBundles.mockResolvedValue({ data: [bundle], total: 1 });
    const result = await useCase.listBundles({ isActive: true }, { limit: 10 });
    expect(result.total).toBe(1);
    expect(mockRepo.getBundles).toHaveBeenCalledWith({ isActive: true }, { limit: 10 });
  });

  it('should return bundle with items', async () => {
    mockRepo.getBundle.mockResolvedValue(bundle);
    mockRepo.getBundleItems.mockResolvedValue([item]);
    const result = await useCase.getBundleWithItems('b1');
    expect(result.items).toHaveLength(1);
  });

  it('should throw when bundle not found', async () => {
    mockRepo.getBundle.mockResolvedValue(null);
    await expect(useCase.getBundleWithItems('missing')).rejects.toThrow('Bundle not found');
  });

  it('should create a bundle', async () => {
    mockRepo.saveBundle.mockResolvedValue(bundle);
    const result = await useCase.createBundle({ productId: 'p1', name: 'Starter Kit' });
    expect(result).toEqual(bundle);
  });

  it('should merge existing data when updating a bundle', async () => {
    mockRepo.getBundle.mockResolvedValue(bundle);
    mockRepo.saveBundle.mockResolvedValue({ ...bundle, name: 'Renamed' });
    const result = await useCase.updateBundle('b1', { name: 'Renamed' });
    expect(mockRepo.saveBundle).toHaveBeenCalledWith(expect.objectContaining({ productBundleId: 'b1', name: 'Renamed' }));
    expect(result.name).toBe('Renamed');
  });

  it('should throw when updating a missing bundle', async () => {
    mockRepo.getBundle.mockResolvedValue(null);
    await expect(useCase.updateBundle('missing', { name: 'x' })).rejects.toThrow('Bundle not found');
    expect(mockRepo.saveBundle).not.toHaveBeenCalled();
  });

  it('should delete a bundle', async () => {
    await useCase.deleteBundle('b1');
    expect(mockRepo.deleteBundle).toHaveBeenCalledWith('b1');
  });

  it('should add a bundle item scoped to the bundle', async () => {
    mockRepo.saveBundleItem.mockResolvedValue(item);
    await useCase.addBundleItem('b1', { productId: 'p2', quantity: 2 });
    expect(mockRepo.saveBundleItem).toHaveBeenCalledWith({ productBundleId: 'b1', productId: 'p2', quantity: 2 });
  });

  it('should update a bundle item', async () => {
    mockRepo.getBundleItem.mockResolvedValue(item);
    mockRepo.saveBundleItem.mockResolvedValue({ ...item, quantity: 3 });
    const result = await useCase.updateBundleItem('b1', 'i1', { quantity: 3 });
    expect(mockRepo.saveBundleItem).toHaveBeenCalledWith(
      expect.objectContaining({ bundleItemId: 'i1', productBundleId: 'b1', quantity: 3 }),
    );
    expect(result.quantity).toBe(3);
  });

  it('should throw when updating a missing bundle item', async () => {
    mockRepo.getBundleItem.mockResolvedValue(null);
    await expect(useCase.updateBundleItem('b1', 'missing', { quantity: 2 })).rejects.toThrow('Bundle item not found');
  });

  it('should delete a bundle item', async () => {
    await useCase.deleteBundleItem('i1');
    expect(mockRepo.deleteBundleItem).toHaveBeenCalledWith('i1');
  });

  it('should list active bundles', async () => {
    mockRepo.getActiveBundles.mockResolvedValue([bundle]);
    expect(await useCase.listActiveBundles()).toHaveLength(1);
  });

  it('should compose active bundle details with pricing', async () => {
    mockRepo.getBundle.mockResolvedValue(bundle);
    mockRepo.getBundleItems.mockResolvedValue([item]);
    mockRepo.calculateBundlePrice.mockResolvedValue(pricing);
    const result = await useCase.getActiveBundleDetails('b1');
    expect(result.pricing).toEqual(pricing);
    expect(result.items).toHaveLength(1);
  });

  it('should reject inactive bundles in detail view', async () => {
    mockRepo.getBundle.mockResolvedValue({ ...bundle, isActive: false });
    await expect(useCase.getActiveBundleDetails('b1')).rejects.toThrow('Bundle not found');
  });

  it('should resolve an active bundle by product', async () => {
    mockRepo.getBundleByProductId.mockResolvedValue(bundle);
    mockRepo.getBundleItems.mockResolvedValue([item]);
    mockRepo.calculateBundlePrice.mockResolvedValue(pricing);
    const result = await useCase.getActiveBundleForProduct('p1');
    expect(result.pricing).toEqual(pricing);
  });

  it('should reject when no active bundle exists for a product', async () => {
    mockRepo.getBundleByProductId.mockResolvedValue(null);
    await expect(useCase.getActiveBundleForProduct('p1')).rejects.toThrow('Bundle not found');
  });

  it('should calculate bundle price with selected items', async () => {
    mockRepo.calculateBundlePrice.mockResolvedValue(pricing);
    const result = await useCase.calculatePrice('b1', [{ productId: 'p2', quantity: 1 }]);
    expect(result).toEqual(pricing);
    expect(mockRepo.calculateBundlePrice).toHaveBeenCalledWith('b1', [{ productId: 'p2', quantity: 1 }]);
  });
});
