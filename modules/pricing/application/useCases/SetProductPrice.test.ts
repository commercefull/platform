import { SetProductPriceUseCase} from './SetProductPrice';
import { PriceMustBePositiveError, InvalidPriceError, PricingValidationError } from '../../domain/errors/PricingErrors';

describe('SetProductPriceUseCase', () => {
  let useCase: SetProductPriceUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      setPrice: jest.fn().mockResolvedValue({
        productId: 'p1', price: 100, salePrice: 80, updatedAt: new Date(),
      }),
    };
    useCase = new SetProductPriceUseCase(mockRepo as never);
  });

  it('should set product price (happy path)', async () => {
    const result = await useCase.execute({ productId: 'p1', price: 100, salePrice: 80 });

    expect(result.productId).toBe('p1');
    expect(result.price).toBe(100);
  });

  it('should throw PricingValidationError when productId is empty', async () => {
    await expect(useCase.execute({ productId: '', price: 100 })).rejects.toThrow(PricingValidationError);
  });

  it('should throw PriceMustBePositiveError for negative price', async () => {
    await expect(useCase.execute({ productId: 'p1', price: -10 })).rejects.toThrow(PriceMustBePositiveError);
  });

  it('should throw InvalidPriceError when salePrice >= price', async () => {
    await expect(useCase.execute({ productId: 'p1', price: 50, salePrice: 50 })).rejects.toThrow(InvalidPriceError);
  });
});
