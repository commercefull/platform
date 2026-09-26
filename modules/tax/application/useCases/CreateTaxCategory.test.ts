import { CreateTaxCategoryUseCase } from './CreateTaxCategory';
import { TaxValidationError } from '../../domain/errors/TaxErrors';
import type { TaxCategory } from '../../taxTypes';

type Port = ConstructorParameters<typeof CreateTaxCategoryUseCase>[0];

function createPort(): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    createTaxCategory: jest.fn(),
  };
  port.createTaxCategory.mockImplementation(c => Promise.resolve({ ...c, id: 'tc1', createdAt: 0, updatedAt: 0 } as TaxCategory));
  return port;
}

describe('CreateTaxCategoryUseCase', () => {
  it('should create the category when name and code are present', async () => {
    const port = createPort();
    const useCase = new CreateTaxCategoryUseCase(port);

    const result = await useCase.execute({ name: 'Standard', code: 'STD' });

    expect(result.id).toBe('tc1');
    expect(port.createTaxCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Standard', code: 'STD', isActive: true, isDefault: false }),
    );
  });

  it('should throw TaxValidationError when name or code is missing', async () => {
    const port = createPort();
    const useCase = new CreateTaxCategoryUseCase(port);

    await expect(useCase.execute({ name: 'Standard' })).rejects.toBeInstanceOf(TaxValidationError);
    expect(port.createTaxCategory).not.toHaveBeenCalled();
  });
});
