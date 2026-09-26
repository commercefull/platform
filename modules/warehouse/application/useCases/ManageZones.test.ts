import { emitMock } from '../../tests/testUtils';
import { ManageZonesUseCase } from './ManageZones';
import { WarehouseValidationError, ZoneNotFoundError } from '../../domain/errors/WarehouseErrors';
import type { WarehouseZone } from '../../domain/repositories/WarehouseRepository';

type Port = ConstructorParameters<typeof ManageZonesUseCase>[0];

function createZone(overrides: Partial<WarehouseZone> = {}): WarehouseZone {
  return {
    distributionWarehouseZoneId: 'z1',
    distributionWarehouseId: 'w1',
    name: 'Zone A',
    code: 'ZA',
    zoneType: 'storage',
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createPort(): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    createZone: jest.fn(),
    updateZone: jest.fn(),
    deleteZone: jest.fn(),
    findZoneById: jest.fn(),
    findZonesByWarehouse: jest.fn(),
  };
  port.createZone.mockImplementation(input => Promise.resolve({ ...createZone(), ...input }));
  port.updateZone.mockResolvedValue(createZone());
  port.deleteZone.mockResolvedValue(true);
  return port;
}

describe('ManageZonesUseCase', () => {
  it('should create a zone and emit warehouse.zone.created when fields are valid', async () => {
    const port = createPort();
    const useCase = new ManageZonesUseCase(port);

    const zone = await useCase.create('w1', { name: 'Zone A', code: 'ZA' });

    expect(port.createZone).toHaveBeenCalledWith(expect.objectContaining({ distributionWarehouseId: 'w1' }));
    expect(emitMock).toHaveBeenCalledWith(
      'warehouse.zone.created',
      expect.objectContaining({ zoneId: zone.distributionWarehouseZoneId, warehouseId: 'w1' }),
    );
  });

  it('should throw WarehouseValidationError when name or code is missing', async () => {
    const port = createPort();
    const useCase = new ManageZonesUseCase(port);

    await expect(useCase.create('w1', { name: '', code: 'ZA' })).rejects.toBeInstanceOf(WarehouseValidationError);
    expect(port.createZone).not.toHaveBeenCalled();
  });

  it('should update a zone and emit warehouse.zone.updated when it exists', async () => {
    const port = createPort();
    const useCase = new ManageZonesUseCase(port);

    const zone = await useCase.update('z1', { name: 'Renamed' });

    expect(zone.name).toBe('Zone A');
    expect(emitMock).toHaveBeenCalledWith('warehouse.zone.updated', { zoneId: 'z1', changes: { name: 'Renamed' } });
  });

  it('should throw ZoneNotFoundError when updating a missing zone', async () => {
    const port = createPort();
    port.updateZone.mockResolvedValue(null);
    const useCase = new ManageZonesUseCase(port);

    await expect(useCase.update('missing', {})).rejects.toBeInstanceOf(ZoneNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should delete a zone and emit warehouse.zone.deleted', async () => {
    const port = createPort();
    const useCase = new ManageZonesUseCase(port);

    await useCase.delete('z1');

    expect(port.deleteZone).toHaveBeenCalledWith('z1');
    expect(emitMock).toHaveBeenCalledWith('warehouse.zone.deleted', { zoneId: 'z1' });
  });
});
