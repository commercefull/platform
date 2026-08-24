jest.mock('../../infrastructure/repositories/StoreDataRepository', () => ({
  __esModule: true,
  default: {
    stores: {
      findById: jest.fn().mockResolvedValue({ storeId: 's1' }),
      findBySlug: jest.fn().mockResolvedValue({ storeId: 's1', slug: 'main' }),
      findAll: jest.fn().mockResolvedValue([{ storeId: 's1' }]),
      save: jest.fn().mockResolvedValue({ storeId: 's2' }),
      delete: jest.fn().mockResolvedValue(true),
      count: jest.fn().mockResolvedValue(1),
      findByBusiness: jest.fn().mockResolvedValue([{ storeId: 's1' }]),
      findActive: jest.fn().mockResolvedValue([{ storeId: 's1' }]),
      findFeatured: jest.fn().mockResolvedValue([{ storeId: 's1' }]),
      findByType: jest.fn().mockResolvedValue([{ storeId: 's1' }]),
    },
  },
}));

import { ManageStoresAdminUseCase } from './ManageStoresAdmin';

describe('ManageStoresAdminUseCase', () => {
  let useCase: ManageStoresAdminUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageStoresAdminUseCase();
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('s1');
    expect(result).toEqual({ storeId: 's1' });
  });

  it('should find by slug', async () => {
    const result = await useCase.findBySlug('main');
    expect(result).toEqual({ storeId: 's1', slug: 'main' });
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should save', async () => {
    const result = await useCase.save({ name: 'New Store' } as never);
    expect(result).toEqual({ storeId: 's2' });
  });

  it('should delete', async () => {
    const result = await useCase.delete('s1');
    expect(result).toBe(true);
  });

  it('should count', async () => {
    const result = await useCase.count();
    expect(result).toBe(1);
  });

  it('should find by business', async () => {
    const result = await useCase.findByBusiness('org1');
    expect(result).toHaveLength(1);
  });

  it('should find active', async () => {
    const result = await useCase.findActive();
    expect(result).toHaveLength(1);
  });

  it('should find by type', async () => {
    const result = await useCase.findByType('physical');
    expect(result).toHaveLength(1);
  });
});
