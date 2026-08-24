jest.mock('../../infrastructure/repositories/WarehouseDataRepository', () => ({
  __esModule: true,
  default: {
    warehouses: {
      findAll: jest.fn().mockResolvedValue([{ warehouseId: 'w1' }]),
      getStatistics: jest.fn().mockResolvedValue({ total: 5, active: 3 }),
      findById: jest.fn().mockResolvedValue({ warehouseId: 'w1' }),
      create: jest.fn().mockResolvedValue({ warehouseId: 'w2' }),
      update: jest.fn().mockResolvedValue({ warehouseId: 'w1', name: 'Updated' }),
      activate: jest.fn().mockResolvedValue(true),
      deactivate: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    },
  },
}));

import { ManageWarehouseAdminUseCaseV2 } from './ManageWarehouseAdminV2';

describe('ManageWarehouseAdminUseCaseV2', () => {
  let useCase: ManageWarehouseAdminUseCaseV2;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageWarehouseAdminUseCaseV2();
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should get statistics', async () => {
    const result = await useCase.getStatistics();
    expect(result.total).toBe(5);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('w1');
    expect(result).toEqual({ warehouseId: 'w1' });
  });

  it('should create', async () => {
    const result = await useCase.create({ name: 'New WH' } as never);
    expect(result).toEqual({ warehouseId: 'w2' });
  });

  it('should activate', async () => {
    const result = await useCase.activate('w1');
    expect(result).toBe(true);
  });

  it('should delete', async () => {
    const result = await useCase.delete('w1');
    expect(result).toBe(true);
  });
});
