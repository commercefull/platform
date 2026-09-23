
import { ManageProductPricesUseCase } from './ManageProductPrices';
import { createProductPrice, lazyMock } from '../../tests/testUtils';

;

describe('ManageProductPricesUseCase', () => {
  let useCase: ManageProductPricesUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageProductPricesUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof ManageProductPricesUseCase>[0]>();
    mockRepo.findByProduct.mockResolvedValue([createProductPrice({ productPriceId: 'pr1', amount: 100 })]);
    mockRepo.create.mockResolvedValue(createProductPrice({ productPriceId: 'pr2', amount: 200 }));
    mockRepo.update.mockResolvedValue(createProductPrice({ productPriceId: 'pr1', amount: 150 }));
    useCase = new ManageProductPricesUseCase(mockRepo);
  });

  it('should find by product', async () => {
    const result = await useCase.findByProduct('p1');
    expect(result).toHaveLength(1);
  });

  it('should create price', async () => {
    const result = await useCase.create({ productId: 'p1', amount: 200, currencyCode: 'USD' });
    expect(result).toEqual(createProductPrice({ productPriceId: 'pr2', amount: 200 }));
  });

  it('should update price', async () => {
    const result = await useCase.update('pr1', { amount: 150 });
    expect(result).toEqual(createProductPrice({ productPriceId: 'pr1', amount: 150 }));
  });
});
