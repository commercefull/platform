/**
 * Unit Tests for ListGroupedChildren Use Case
 */

import { lazyMock } from '../../tests/testUtils';
import { ListGroupedChildrenUseCase } from './ListGroupedChildren';
import { Product } from '../../domain/entities/Product';

function createProduct(id: string): Product {
  return Product.create({ productId: id, name: `Product ${id}`, description: 'd', productTypeId: 'pt-1' });
}

describe('ListGroupedChildrenUseCase', () => {
  let useCase: ListGroupedChildrenUseCase;
  let mockRelationshipRepo: jest.Mocked<ConstructorParameters<typeof ListGroupedChildrenUseCase>[0]>;
  let mockProductRepo: jest.Mocked<ConstructorParameters<typeof ListGroupedChildrenUseCase>[1]>;

  beforeEach(() => {
    mockRelationshipRepo = lazyMock();
    mockProductRepo = lazyMock();
    useCase = new ListGroupedChildrenUseCase(mockRelationshipRepo, mockProductRepo);
  });

  it('should resolve grouped relationships to child products', async () => {
    mockRelationshipRepo.findByProductId.mockResolvedValue([
      { productRelatedId: 'rel-1', productId: 'p-1', relatedProductId: 'child-1', type: 'grouped' },
      { productRelatedId: 'rel-2', productId: 'p-1', relatedProductId: 'child-missing', type: 'grouped' },
    ]);
    mockProductRepo.findById.mockImplementation(async id => (id === 'child-1' ? createProduct(id) : null));

    const result = await useCase.execute('p-1');

    expect(mockRelationshipRepo.findByProductId).toHaveBeenCalledWith('p-1', 'grouped');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ productId: 'child-1' });
  });

  it('should return an empty list when there are no grouped relationships', async () => {
    mockRelationshipRepo.findByProductId.mockResolvedValue([]);

    const result = await useCase.execute('p-1');

    expect(result).toEqual([]);
    expect(mockProductRepo.findById).not.toHaveBeenCalled();
  });
});
