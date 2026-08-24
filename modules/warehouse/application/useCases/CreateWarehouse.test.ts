jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreateWarehouseUseCase } from './CreateWarehouse';
import { WarehouseCodeAlreadyExistsError } from '../../domain/errors/WarehouseErrors';
import { eventBus } from '../../../../libs/events/eventBus';

describe('CreateWarehouseUseCase', () => {
  let useCase: CreateWarehouseUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByCode: jest.fn().mockResolvedValue(null),
      findDefault: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        distributionWarehouseId: 'wh-1', name: 'Main WH', code: 'WH01',
        isActive: true, isDefault: false, createdAt: new Date().toISOString(),
      }),
    };
    useCase = new CreateWarehouseUseCase(mockRepo as never);
    jest.mocked(eventBus.emit).mockClear();
  });

  it('should create a warehouse successfully (happy path)', async () => {
    const result = await useCase.execute({
      name: 'Main WH', code: 'WH01', type: 'warehouse',
      address: { addressLine1: '123 Main St', city: 'Springfield', postalCode: '12345', countryCode: 'US' },
    });

    expect(result.warehouseId).toBe('wh-1');
    expect(result.name).toBe('Main WH');
    expect(eventBus.emit).toHaveBeenCalledWith('warehouse.created', expect.objectContaining({ warehouseId: 'wh-1' }));
  });

  it('should throw WarehouseCodeAlreadyExistsError when code is taken', async () => {
    mockRepo.findByCode.mockResolvedValue({ distributionWarehouseId: 'existing-wh' });

    await expect(useCase.execute({
      name: 'New WH', code: 'WH01', type: 'warehouse',
      address: { addressLine1: '123', city: 'X', postalCode: '1', countryCode: 'US' },
    })).rejects.toThrow(WarehouseCodeAlreadyExistsError);
  });

  it('should unset existing default when creating new default warehouse', async () => {
    mockRepo.findDefault.mockResolvedValue({ distributionWarehouseId: 'old-default' });

    await useCase.execute({
      name: 'New Default', code: 'WH02', type: 'warehouse', isDefault: true,
      address: { addressLine1: '123', city: 'X', postalCode: '1', countryCode: 'US' },
    });

    expect(mockRepo.update).toHaveBeenCalledWith('old-default', { isDefault: false });
  });

  it('should set default values for timezone and processingTime', async () => {
    await useCase.execute({
      name: 'WH', code: 'WH03', type: 'warehouse',
      address: { addressLine1: '123', city: 'X', postalCode: '1', countryCode: 'US' },
    });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ timezone: 'UTC', processingTime: 24, isActive: true, isDefault: false }));
  });
});
