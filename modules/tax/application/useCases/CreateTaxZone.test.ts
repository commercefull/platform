import { CreateTaxZoneUseCase } from './CreateTaxZone';
import { TaxValidationError } from '../../domain/errors/TaxErrors';
import type { TaxZone } from '../../taxTypes';

type Port = ConstructorParameters<typeof CreateTaxZoneUseCase>[0];

function createPort(): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    createTaxZone: jest.fn(),
  };
  port.createTaxZone.mockImplementation(z => Promise.resolve({ ...z, id: 'tz1', createdAt: 0, updatedAt: 0 } as TaxZone));
  return port;
}

const command = { name: 'US', code: 'US', countries: ['US'] };

describe('CreateTaxZoneUseCase', () => {
  it('should create the zone when required fields are present', async () => {
    const port = createPort();
    const useCase = new CreateTaxZoneUseCase(port);

    const result = await useCase.execute(command);

    expect(result.id).toBe('tz1');
    expect(port.createTaxZone).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'US', countries: ['US'], states: [], isActive: true }),
    );
  });

  it('should throw TaxValidationError when countries is empty', async () => {
    const port = createPort();
    const useCase = new CreateTaxZoneUseCase(port);

    await expect(useCase.execute({ ...command, countries: [] })).rejects.toBeInstanceOf(TaxValidationError);
    expect(port.createTaxZone).not.toHaveBeenCalled();
  });
});
