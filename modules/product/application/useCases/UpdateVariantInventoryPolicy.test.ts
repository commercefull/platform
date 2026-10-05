import { lazyMock } from '../../tests/testUtils';
import { UpdateVariantInventoryPolicyUseCase, UpdateVariantInventoryPolicyCommand } from './UpdateVariantInventoryPolicy';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { ProductVariantNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';

function makeVariant(policy: 'tracked' | 'unlimited' | 'backorderable' = 'tracked'): ProductVariant {
  return ProductVariant.create({
    variantId: 'v1',
    productId: 'p1',
    sku: 'SKU-1',
    attributes: [],
    inventoryPolicy: policy,
  });
}

describe('UpdateVariantInventoryPolicyUseCase', () => {
  let useCase: UpdateVariantInventoryPolicyUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof UpdateVariantInventoryPolicyUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<ConstructorParameters<typeof UpdateVariantInventoryPolicyUseCase>[0]>();
    mockRepo.save.mockImplementation(async (variant: unknown) => variant);
    useCase = new UpdateVariantInventoryPolicyUseCase(mockRepo);
  });

  it('should update the inventory policy and persist the variant', async () => {
    const variant = makeVariant('tracked');
    mockRepo.findById.mockResolvedValue(variant as never);

    const result = await useCase.execute(new UpdateVariantInventoryPolicyCommand('v1', 'unlimited'));

    expect(result.inventoryPolicy).toBe('unlimited');
    expect(mockRepo.save).toHaveBeenCalledWith(variant);
  });

  it('should support the backorderable policy', async () => {
    mockRepo.findById.mockResolvedValue(makeVariant('unlimited') as never);

    const result = await useCase.execute(new UpdateVariantInventoryPolicyCommand('v1', 'backorderable'));

    expect(result.inventoryPolicy).toBe('backorderable');
  });

  it('should throw ProductVariantNotFoundError when the variant does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateVariantInventoryPolicyCommand('missing', 'tracked'))).rejects.toThrow(
      ProductVariantNotFoundError,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should reject an invalid policy through the domain entity', async () => {
    mockRepo.findById.mockResolvedValue(makeVariant() as never);

    await expect(useCase.execute(new UpdateVariantInventoryPolicyCommand('v1', 'deny' as never))).rejects.toThrow(ProductValidationError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
