jest.mock('../../infrastructure/repositories/SupplierDataRepository', () => ({
  __esModule: true,
  default: {
    suppliers: {
      findAll: jest.fn().mockResolvedValue([{ supplierId: 'sup1' }]),
      findByStatus: jest.fn().mockResolvedValue([{ supplierId: 'sup1', status: 'active' }]),
      getStatistics: jest.fn().mockResolvedValue({ total: 5, active: 3 }),
      findById: jest.fn().mockResolvedValue({ supplierId: 'sup1' }),
      create: jest.fn().mockResolvedValue({ supplierId: 'sup2' }),
      update: jest.fn().mockResolvedValue({ supplierId: 'sup1', name: 'Updated' }),
      approve: jest.fn().mockResolvedValue(true),
      suspend: jest.fn().mockResolvedValue(true),
      activate: jest.fn().mockResolvedValue(true),
      deactivate: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    },
  },
}));

import { ManageSuppliersAdminUseCase } from './ManageSuppliersAdmin';

describe('ManageSuppliersAdminUseCase', () => {
  let useCase: ManageSuppliersAdminUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageSuppliersAdminUseCase();
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find by status', async () => {
    const result = await useCase.findByStatus('active');
    expect(result).toHaveLength(1);
  });

  it('should get statistics', async () => {
    const result = await useCase.getStatistics();
    expect(result.total).toBe(5);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('sup1');
    expect(result).toEqual({ supplierId: 'sup1' });
  });

  it('should create', async () => {
    const result = await useCase.create({ name: 'New Supplier' } as never);
    expect(result).toEqual({ supplierId: 'sup2' });
  });

  it('should approve', async () => {
    const result = await useCase.approve('sup1');
    expect(result).toBe(true);
  });

  it('should delete', async () => {
    const result = await useCase.delete('sup1');
    expect(result).toBe(true);
  });
});
