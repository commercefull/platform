import { CreateTaxRateRecordUseCase } from './CreateTaxRateRecord';
import { TaxValidationError } from '../../domain/errors/TaxErrors';
import type { TaxRate } from '../../taxTypes';

type Port = ConstructorParameters<typeof CreateTaxRateRecordUseCase>[0];

function createPort(): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    createTaxRate: jest.fn(),
  };
  port.createTaxRate.mockImplementation(r => Promise.resolve({ ...r, id: 'tr1', createdAt: 0, updatedAt: 0 } as TaxRate));
  return port;
}

const command = { name: 'Standard', rate: 20, taxCategoryId: 'tc1', taxZoneId: 'tz1' };

describe('CreateTaxRateRecordUseCase', () => {
  it('should create the rate with defaults when required fields are present', async () => {
    const port = createPort();
    const useCase = new CreateTaxRateRecordUseCase(port);

    const result = await useCase.execute(command);

    expect(result.id).toBe('tr1');
    expect(port.createTaxRate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Standard', rate: 20, priority: 1, isActive: true, type: 'percentage' }),
    );
  });

  it('should throw TaxValidationError when required fields are missing', async () => {
    const port = createPort();
    const useCase = new CreateTaxRateRecordUseCase(port);

    await expect(useCase.execute({ ...command, taxZoneId: undefined })).rejects.toBeInstanceOf(TaxValidationError);
    expect(port.createTaxRate).not.toHaveBeenCalled();
  });
});
