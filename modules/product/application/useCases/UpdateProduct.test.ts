jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { UpdateProductUseCase, UpdateProductCommand } from './UpdateProduct';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockProduct: Record<string, unknown>;

  beforeEach(() => {
    mockProduct = {
      productId: 'p1', name: 'Old', slug: 'old', status: 'active', tags: [], updatedAt: new Date(),
      price: { basePrice: 10, salePrice: null, cost: 5 },
      updateBasicInfo: jest.fn(), updateSeo: jest.fn(), updatePrice: jest.fn(),
      setSalePrice: jest.fn(), updateDimensions: jest.fn(), assignCategory: jest.fn(),
      removeCategory: jest.fn(), setFeatured: jest.fn(), addTag: jest.fn(), removeTag: jest.fn(),
      updateMetadata: jest.fn(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockProduct),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new UpdateProductUseCase(mockRepo as never);
  });

  it('should update product name (happy path)', async () => {
    const result = await useCase.execute(new UpdateProductCommand('p1', { name: 'New Name' }));

    expect(result.productId).toBe('p1');
    expect(result.updatedFields).toContain('name');
    expect(eventBus.emit).toHaveBeenCalledWith('product.updated', expect.objectContaining({ productId: 'p1' }));
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateProductCommand('missing', { name: 'X' }))).rejects.toThrow(ProductNotFoundError);
  });

  it('should update price when basePrice provided', async () => {
    await useCase.execute(new UpdateProductCommand('p1', { basePrice: 99.99 }));

    expect(mockProduct.updatePrice).toHaveBeenCalled();
  });

  it('should update tags', async () => {
    await useCase.execute(new UpdateProductCommand('p1', { tags: ['new', 'hot'] }));

    expect(mockProduct.addTag).toHaveBeenCalledWith('new');
    expect(mockProduct.addTag).toHaveBeenCalledWith('hot');
  });
});
