import { emitMock, lazyMock, createShippingMethodEntity } from '../../tests/testUtils';
import { CreateShippingMethodUseCase } from './CreateShippingMethod';
import { ShippingValidationError } from '../../domain/errors/ShippingErrors';

type ShippingMethodRepository = ConstructorParameters<typeof CreateShippingMethodUseCase>[0];

describe('CreateShippingMethodUseCase', () => {
  let useCase: CreateShippingMethodUseCase;
  let repo: jest.Mocked<ShippingMethodRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<ShippingMethodRepository>();
    repo.findMethodByCode.mockResolvedValue(null);
    repo.saveMethod.mockImplementation(async method => method);
    useCase = new CreateShippingMethodUseCase(repo);
  });

  it('should create and persist a shipping method', async () => {
    const result = await useCase.execute({
      name: 'Standard Shipping',
      code: 'std',
      type: 'flat_rate',
      basePrice: 9.99,
    });

    expect(result.shippingMethod.name).toBe('Standard Shipping');
    expect(repo.saveMethod).toHaveBeenCalledWith(expect.objectContaining({ code: 'std' }));
    expect(emitMock).toHaveBeenCalledWith('shipping.method_created', expect.objectContaining({ name: 'Standard Shipping' }));
  });

  it('should throw ShippingValidationError when the code already exists', async () => {
    repo.findMethodByCode.mockResolvedValue(createShippingMethodEntity({ code: 'std' }));

    await expect(
      useCase.execute({
        name: 'Test',
        code: 'std',
        type: 'flat_rate',
        basePrice: 5,
      }),
    ).rejects.toThrow(ShippingValidationError);
    expect(repo.saveMethod).not.toHaveBeenCalled();
  });
});
