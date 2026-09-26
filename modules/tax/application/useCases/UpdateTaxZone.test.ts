import { UpdateTaxZoneUseCase } from './UpdateTaxZone';
import { TaxValidationError, TaxZoneNotFoundError } from '../../domain/errors/TaxErrors';
import type { TaxZone } from '../../taxTypes';

type Port = ConstructorParameters<typeof UpdateTaxZoneUseCase>[0];

function existingZone(): TaxZone {
  return {
    id: 'tz1',
    name: 'US',
    code: 'US',
    isDefault: false,
    countries: ['US'],
    isActive: true,
    createdAt: 0,
    updatedAt: 0,
  };
}

function createPort(zone: TaxZone | null = existingZone()): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    findTaxZoneById: jest.fn(),
    updateTaxZone: jest.fn(),
  };
  port.findTaxZoneById.mockResolvedValue(zone);
  port.updateTaxZone.mockImplementation((id, data) => Promise.resolve({ ...existingZone(), ...data }));
  return port;
}

describe('UpdateTaxZoneUseCase', () => {
  it('should update only the provided fields when the zone exists', async () => {
    const port = createPort();
    const useCase = new UpdateTaxZoneUseCase(port);

    const result = await useCase.execute('tz1', { name: 'United States', isActive: false });

    expect(port.updateTaxZone).toHaveBeenCalledWith('tz1', { name: 'United States', isActive: false });
    expect(result.name).toBe('United States');
  });

  it('should throw TaxZoneNotFoundError when the zone does not exist', async () => {
    const port = createPort(null);
    const useCase = new UpdateTaxZoneUseCase(port);

    await expect(useCase.execute('missing', { name: 'x' })).rejects.toBeInstanceOf(TaxZoneNotFoundError);
    expect(port.updateTaxZone).not.toHaveBeenCalled();
  });

  it('should throw TaxValidationError when countries update leaves the zone empty', async () => {
    const port = createPort();
    const useCase = new UpdateTaxZoneUseCase(port);

    await expect(useCase.execute('tz1', { countries: [] })).rejects.toBeInstanceOf(TaxValidationError);
    expect(port.updateTaxZone).not.toHaveBeenCalled();
  });
});
