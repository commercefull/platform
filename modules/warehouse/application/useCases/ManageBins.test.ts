import { emitMock } from '../../tests/testUtils';
import { ManageBinsUseCase } from './ManageBins';
import { BinNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import type { WarehouseBin } from '../../domain/repositories/WarehouseRepository';

type Port = ConstructorParameters<typeof ManageBinsUseCase>[0];

function createBin(overrides: Partial<WarehouseBin> = {}): WarehouseBin {
  return {
    distributionWarehouseBinId: 'b1',
    distributionWarehouseId: 'w1',
    locationCode: 'A-01-01',
    binType: 'standard',
    isActive: true,
    isPickable: true,
    isReceivable: true,
    isMixed: false,
    priority: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createPort(): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    createBin: jest.fn(),
    updateBin: jest.fn(),
    deleteBin: jest.fn(),
    findBinById: jest.fn(),
    findBinsByWarehouse: jest.fn(),
  };
  port.createBin.mockImplementation(input => Promise.resolve({ ...createBin(), ...input }));
  port.updateBin.mockResolvedValue(createBin());
  port.deleteBin.mockResolvedValue(true);
  return port;
}

describe('ManageBinsUseCase', () => {
  it('should create a bin and emit warehouse.bin.created when fields are valid', async () => {
    const port = createPort();
    const useCase = new ManageBinsUseCase(port);

    const bin = await useCase.create('w1', { locationCode: 'A-01-01', binType: 'standard' });

    expect(port.createBin).toHaveBeenCalledWith(expect.objectContaining({ distributionWarehouseId: 'w1' }));
    expect(emitMock).toHaveBeenCalledWith(
      'warehouse.bin.created',
      expect.objectContaining({ binId: bin.distributionWarehouseBinId, warehouseId: 'w1' }),
    );
  });

  it('should throw WarehouseValidationError when locationCode or binType is missing', async () => {
    const port = createPort();
    const useCase = new ManageBinsUseCase(port);

    await expect(useCase.create('w1', { locationCode: '', binType: 'standard' })).rejects.toBeInstanceOf(
      WarehouseValidationError,
    );
    expect(port.createBin).not.toHaveBeenCalled();
  });

  it('should update a bin and emit warehouse.bin.updated when it exists', async () => {
    const port = createPort();
    const useCase = new ManageBinsUseCase(port);

    await useCase.update('b1', { isPickable: false });

    expect(emitMock).toHaveBeenCalledWith('warehouse.bin.updated', { binId: 'b1', changes: { isPickable: false } });
  });

  it('should throw BinNotFoundError when updating a missing bin', async () => {
    const port = createPort();
    port.updateBin.mockResolvedValue(null);
    const useCase = new ManageBinsUseCase(port);

    await expect(useCase.update('missing', {})).rejects.toBeInstanceOf(BinNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should delete a bin and emit warehouse.bin.deleted', async () => {
    const port = createPort();
    const useCase = new ManageBinsUseCase(port);

    await useCase.delete('b1');

    expect(port.deleteBin).toHaveBeenCalledWith('b1');
    expect(emitMock).toHaveBeenCalledWith('warehouse.bin.deleted', { binId: 'b1' });
  });
});
