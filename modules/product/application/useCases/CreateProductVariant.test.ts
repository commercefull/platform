import { lazyMock, uuidMock } from '../../tests/testUtils';
import { CreateProductVariantUseCase, CreateProductVariantCommand } from './CreateProductVariant';
import { ProductValidationError } from '../../domain/errors/ProductErrors';

;

describe('CreateProductVariantUseCase', () => {
  let useCase: CreateProductVariantUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof CreateProductVariantUseCase>[0]>;

  beforeEach(() => {
    uuidMock.mockReturnValue('variant-uuid');
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof CreateProductVariantUseCase>[0]>();
    mockRepo.save.mockImplementation(async (variant: unknown) => variant);
    const pricingPort = lazyMock<ConstructorParameters<typeof CreateProductVariantUseCase>[1]>();
    useCase = new CreateProductVariantUseCase(mockRepo, pricingPort);
  });

  it('should create product variant (happy path)', async () => {
    const result = await useCase.execute(
      new CreateProductVariantCommand(
        'p1',
        'SKU-1',
        [{ attributeId: 'a1', attributeName: 'Color', value: 'Red' }],
        10000,
        8000,
        'USD',
        true,
        50,
        false,
        5,
        true,
        0,
      ),
    );

    expect(result.variantId).toBe('variant-uuid');
    expect(result.productId).toBe('p1');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should throw ProductValidationError when basePriceCents is negative or fractional', async () => {
    await expect(
      useCase.execute(new CreateProductVariantCommand('p1', 'SKU-2', [], -1)),
    ).rejects.toThrow(ProductValidationError);
    await expect(
      useCase.execute(new CreateProductVariantCommand('p1', 'SKU-3', [], 10.5)),
    ).rejects.toThrow(ProductValidationError);
  });
});
