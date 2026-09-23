import { lazyMock, uuidMock } from '../../tests/testUtils';
import { CreateProductVariantUseCase, CreateProductVariantCommand } from './CreateProductVariant';

;

describe('CreateProductVariantUseCase', () => {
  let useCase: CreateProductVariantUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof CreateProductVariantUseCase>[0]>;

  beforeEach(() => {
    uuidMock.mockReturnValue('variant-uuid');
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof CreateProductVariantUseCase>[0]>();
    mockRepo.save.mockImplementation(async (variant: unknown) => variant);
    useCase = new CreateProductVariantUseCase(mockRepo);
  });

  it('should create product variant (happy path)', async () => {
    const result = await useCase.execute(
      new CreateProductVariantCommand(
        'p1',
        'SKU-1',
        [{ attributeId: 'a1', attributeName: 'Color', value: 'Red' }],
        100,
        80,
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
});
