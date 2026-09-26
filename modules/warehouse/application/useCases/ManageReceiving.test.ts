import { emitMock } from '../../tests/testUtils';
import { ManageReceivingUseCase } from './ManageReceiving';
import { ReceivingRecordNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import type { WarehouseReceiving } from '../../domain/repositories/WarehouseRepository';

type Port = ConstructorParameters<typeof ManageReceivingUseCase>[0];

function createReceiving(overrides: Partial<WarehouseReceiving> = {}): WarehouseReceiving {
  return {
    warehouseReceivingId: 'r1',
    distributionWarehouseId: 'w1',
    receiptNumber: 'COV-1',
    sourceType: 'purchase_order',
    status: 'pending',
    hasDiscrepancies: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createPort(record: WarehouseReceiving | null = createReceiving()): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    create: jest.fn(),
    updateItems: jest.fn(),
    updateStatus: jest.fn(),
    findById: jest.fn(),
    findByWarehouse: jest.fn(),
  };
  port.create.mockImplementation(input => Promise.resolve({ ...createReceiving(), ...input }));
  port.updateItems.mockResolvedValue(record);
  port.updateStatus.mockResolvedValue(record ? { ...record, status: 'completed' } : null);
  return port;
}

describe('ManageReceivingUseCase', () => {
  it('should create a receiving record and emit warehouse.receiving.created when fields are valid', async () => {
    const port = createPort();
    const useCase = new ManageReceivingUseCase(port);

    const record = await useCase.create('w1', { receiptNumber: 'COV-1', sourceType: 'purchase_order' });

    expect(port.create).toHaveBeenCalledWith(expect.objectContaining({ distributionWarehouseId: 'w1' }));
    expect(emitMock).toHaveBeenCalledWith(
      'warehouse.receiving.created',
      expect.objectContaining({ receivingId: record.warehouseReceivingId, warehouseId: 'w1' }),
    );
  });

  it('should throw WarehouseValidationError when receiptNumber or sourceType is missing', async () => {
    const port = createPort();
    const useCase = new ManageReceivingUseCase(port);

    await expect(useCase.create('w1', { receiptNumber: '', sourceType: 'purchase_order' })).rejects.toBeInstanceOf(
      WarehouseValidationError,
    );
    expect(port.create).not.toHaveBeenCalled();
  });

  it('should update items before completing when items are provided', async () => {
    const port = createPort();
    const useCase = new ManageReceivingUseCase(port);
    const items = [{ productId: 'p1', quantity: 5 }];

    await useCase.complete('r1', { receivedBy: 'u1', items, hasDiscrepancies: true });

    expect(port.updateItems).toHaveBeenCalledWith('r1', items, true);
    expect(port.updateStatus).toHaveBeenCalledWith('r1', 'completed', 'u1');
    expect(emitMock).toHaveBeenCalledWith(
      'warehouse.receiving.completed',
      expect.objectContaining({ receivingId: 'r1', warehouseId: 'w1' }),
    );
  });

  it('should complete without touching items when none are provided', async () => {
    const port = createPort();
    const useCase = new ManageReceivingUseCase(port);

    await useCase.complete('r1', {});

    expect(port.updateItems).not.toHaveBeenCalled();
    expect(port.updateStatus).toHaveBeenCalledWith('r1', 'completed', undefined);
  });

  it('should throw ReceivingRecordNotFoundError when the record does not exist', async () => {
    const port = createPort(null);
    const useCase = new ManageReceivingUseCase(port);

    await expect(useCase.complete('missing', {})).rejects.toBeInstanceOf(ReceivingRecordNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
