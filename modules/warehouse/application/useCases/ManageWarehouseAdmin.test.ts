jest.mock('../../infrastructure/repositories/WarehouseDataRepository', () => ({
  __esModule: true,
  default: {
    warehouses: {
      findAll: jest.fn().mockResolvedValue([{ warehouseId: 'w1' }]),
      getStatistics: jest.fn().mockResolvedValue({ total: 5, active: 3 }),
    },
  },
}));

import { ManageWarehouseAdminUseCase } from './ManageWarehouseAdmin';

describe('ManageWarehouseAdminUseCase', () => {
  let useCase: ManageWarehouseAdminUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageWarehouseAdminUseCase();
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should get statistics', async () => {
    const result = await useCase.getStatistics();
    expect(result.total).toBe(5);
  });
});
