jest.mock('../../infrastructure/repositories/productCategoryRepo', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn().mockResolvedValue([{ categoryId: 'c1' }]),
    findById: jest.fn().mockResolvedValue({ categoryId: 'c1', name: 'Electronics' }),
    create: jest.fn().mockResolvedValue({ categoryId: 'c2', name: 'Books' }),
    update: jest.fn().mockResolvedValue({ categoryId: 'c1', name: 'Updated' }),
    softDelete: jest.fn().mockResolvedValue(true),
  },
}));

import { ManageProductCategoriesUseCase } from './ManageProductCategories';
import productCategoryRepo from '../../infrastructure/repositories/productCategoryRepo';

const mockRepo = productCategoryRepo as unknown as Record<string, jest.Mock>;

describe('ManageProductCategoriesUseCase', () => {
  let useCase: ManageProductCategoriesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageProductCategoriesUseCase();
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('c1');
    expect(result).toEqual({ categoryId: 'c1', name: 'Electronics' });
  });

  it('should create', async () => {
    const result = await useCase.create({ name: 'Books' } as never);
    expect(result).toEqual({ categoryId: 'c2', name: 'Books' });
  });

  it('should update', async () => {
    const result = await useCase.update('c1', { name: 'Updated' } as never);
    expect(result).toEqual({ categoryId: 'c1', name: 'Updated' });
  });

  it('should soft delete', async () => {
    const result = await useCase.softDelete('c1');
    expect(result).toBe(true);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('c1');
  });
});
