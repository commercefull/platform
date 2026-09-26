import { emitMock } from '../../tests/testUtils';
import { ManagePickPackUseCase } from './ManagePickPack';
import { PickPackRecordNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import type { WarehousePickPack } from '../../domain/repositories/WarehouseRepository';

type Port = ConstructorParameters<typeof ManagePickPackUseCase>[0];

function createPickPack(overrides: Partial<WarehousePickPack> = {}): WarehousePickPack {
  return {
    warehousePickPackId: 'pp1',
    distributionWarehouseId: 'w1',
    pickPackNumber: 'PP-1',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createPort(record: WarehousePickPack | null = createPickPack()): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    create: jest.fn(),
    startPicking: jest.fn(),
    completePicking: jest.fn(),
    startPacking: jest.fn(),
    completePacking: jest.fn(),
    assignTo: jest.fn(),
    findById: jest.fn(),
    findByWarehouse: jest.fn(),
  };
  port.create.mockImplementation(input => Promise.resolve({ ...createPickPack(), ...input }));
  port.startPicking.mockResolvedValue(record);
  port.completePicking.mockResolvedValue(record);
  port.startPacking.mockResolvedValue(record);
  port.completePacking.mockResolvedValue(record);
  port.assignTo.mockResolvedValue(record);
  return port;
}

describe('ManagePickPackUseCase', () => {
  it('should create a pick/pack record and emit warehouse.pick.created when pickPackNumber is valid', async () => {
    const port = createPort();
    const useCase = new ManagePickPackUseCase(port);

    const record = await useCase.create('w1', { pickPackNumber: 'PP-1' });

    expect(port.create).toHaveBeenCalledWith(expect.objectContaining({ distributionWarehouseId: 'w1' }));
    expect(emitMock).toHaveBeenCalledWith(
      'warehouse.pick.created',
      expect.objectContaining({ pickPackId: record.warehousePickPackId, warehouseId: 'w1' }),
    );
  });

  it('should throw WarehouseValidationError when pickPackNumber is missing', async () => {
    const port = createPort();
    const useCase = new ManagePickPackUseCase(port);

    await expect(useCase.create('w1', { pickPackNumber: '' })).rejects.toBeInstanceOf(WarehouseValidationError);
    expect(port.create).not.toHaveBeenCalled();
  });

  it('should emit warehouse.pick.created when picking starts', async () => {
    const port = createPort();
    const useCase = new ManagePickPackUseCase(port);

    await useCase.startPicking('pp1');

    expect(emitMock).toHaveBeenCalledWith('warehouse.pick.created', { pickPackId: 'pp1', warehouseId: 'w1' });
  });

  it('should emit warehouse.pick.completed when picking completes', async () => {
    const port = createPort();
    const useCase = new ManagePickPackUseCase(port);

    await useCase.completePicking('pp1');

    expect(emitMock).toHaveBeenCalledWith('warehouse.pick.completed', { pickPackId: 'pp1', warehouseId: 'w1' });
  });

  it('should not emit when packing starts', async () => {
    const port = createPort();
    const useCase = new ManagePickPackUseCase(port);

    await useCase.startPacking('pp1');

    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should emit warehouse.pack.completed when packing completes', async () => {
    const port = createPort();
    const useCase = new ManagePickPackUseCase(port);

    await useCase.completePacking('pp1');

    expect(emitMock).toHaveBeenCalledWith('warehouse.pack.completed', { pickPackId: 'pp1', warehouseId: 'w1' });
  });

  it('should throw PickPackRecordNotFoundError when a transition targets a missing or wrong-state record', async () => {
    const port = createPort(null);
    const useCase = new ManagePickPackUseCase(port);

    await expect(useCase.startPicking('missing')).rejects.toBeInstanceOf(PickPackRecordNotFoundError);
    await expect(useCase.completePacking('missing')).rejects.toBeInstanceOf(PickPackRecordNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should assign a record when assignedTo is provided', async () => {
    const port = createPort();
    const useCase = new ManagePickPackUseCase(port);

    const record = await useCase.assign('pp1', 'worker-1');

    expect(port.assignTo).toHaveBeenCalledWith('pp1', 'worker-1');
    expect(record.warehousePickPackId).toBe('pp1');
  });

  it('should throw WarehouseValidationError when assignedTo is missing', async () => {
    const port = createPort();
    const useCase = new ManagePickPackUseCase(port);

    await expect(useCase.assign('pp1', '')).rejects.toBeInstanceOf(WarehouseValidationError);
    expect(port.assignTo).not.toHaveBeenCalled();
  });
});
