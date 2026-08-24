import { GetWarehouseUseCase} from './GetWarehouse';
import { WarehouseValidationError } from '../../domain/errors/WarehouseErrors';

describe('GetWarehouseUseCase', () => {
  let useCase: GetWarehouseUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue(null),
      findByCode: jest.fn().mockResolvedValue(null),
    };
    useCase = new GetWarehouseUseCase(mockRepo as never);
  });

  it('should get warehouse by ID (happy path)', async () => {
    mockRepo.findById.mockResolvedValue({
      distributionWarehouseId: 'wh-1', name: 'Main', code: 'WH001', description: 'Main WH',
      addressLine1: '123 St', city: 'Portland', state: 'OR', postalCode: '97201', country: 'US',
      timezone: 'America/Los_Angeles', isActive: true, isDefault: true, createdAt: '2024-01-01', updatedAt: '2024-01-02',
    });

    const result = await useCase.execute({ warehouseId: 'wh-1' });

    expect(result.warehouse).not.toBeNull();
    expect(result.warehouse!.warehouseId).toBe('wh-1');
    expect(result.warehouse!.name).toBe('Main');
  });

  it('should get warehouse by code', async () => {
    mockRepo.findByCode.mockResolvedValue({
      distributionWarehouseId: 'wh-2', name: 'East', code: 'EAST', description: '',
      addressLine1: '456 Ave', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US',
      timezone: 'America/New_York', isActive: true, isDefault: false, createdAt: '2024-01-01', updatedAt: '2024-01-02',
    });

    const result = await useCase.execute({ code: 'EAST' });

    expect(result.warehouse).not.toBeNull();
    expect(result.warehouse!.code).toBe('EAST');
  });

  it('should return null when warehouse not found', async () => {
    const result = await useCase.execute({ warehouseId: 'missing' });

    expect(result.warehouse).toBeNull();
  });

  it('should throw WarehouseValidationError when no ID or code provided', async () => {
    await expect(useCase.execute({})).rejects.toThrow(WarehouseValidationError);
  });
});
