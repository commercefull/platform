jest.mock('../../infrastructure/repositories/categoryRepo', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockResolvedValue({ categoryId: 'c1', name: 'Electronics' }),
    findBySlug: jest.fn().mockResolvedValue({ categoryId: 'c1', slug: 'electronics' }),
    findAll: jest.fn().mockResolvedValue([{ categoryId: 'c1' }]),
    findActive: jest.fn().mockResolvedValue([{ categoryId: 'c1', isActive: true }]),
    findChildren: jest.fn().mockResolvedValue([{ categoryId: 'c2' }]),
    findForMenu: jest.fn().mockResolvedValue([{ categoryId: 'c1', showInMenu: true }]),
    create: jest.fn().mockResolvedValue({ categoryId: 'c2', name: 'Books' }),
    update: jest.fn().mockResolvedValue({ categoryId: 'c1', name: 'Updated' }),
    delete: jest.fn().mockResolvedValue(undefined),
  },
}));

import { ManageCategoriesUseCase } from './ManageCategories';
import categoryRepo from '../../infrastructure/repositories/categoryRepo';

const mockRepo = categoryRepo as unknown as Record<string, jest.Mock>;

describe('ManageCategoriesUseCase', () => {
  let useCase: ManageCategoriesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageCategoriesUseCase(categoryRepo);
  });

  it('should find one', async () => {
    const result = await useCase.findOne('c1');
    expect(result).toEqual({ categoryId: 'c1', name: 'Electronics' });
  });

  it('should find by slug', async () => {
    const result = await useCase.findBySlug('electronics');
    expect(result).toEqual({ categoryId: 'c1', slug: 'electronics' });
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find active', async () => {
    const result = await useCase.findActive();
    expect(result).toHaveLength(1);
  });

  it('should find children', async () => {
    const result = await useCase.findChildren('c1');
    expect(result).toHaveLength(1);
  });

  it('should create category', async () => {
    const result = await useCase.create({ name: 'Books' } as never);
    expect(result).toEqual({ categoryId: 'c2', name: 'Books' });
  });

  it('should update category', async () => {
    const result = await useCase.update('c1', { name: 'Updated' } as never);
    expect(result).toEqual({ categoryId: 'c1', name: 'Updated' });
  });

  it('should delete category', async () => {
    await useCase.delete('c1');
    expect(mockRepo.delete).toHaveBeenCalledWith('c1');
  });

  it('should reorder categories', async () => {
    await useCase.reorder([{ categoryId: 'c1', position: 1 }, { categoryId: 'c2', position: 2 }]);
    expect(mockRepo.update).toHaveBeenCalledTimes(2);
  });
});
