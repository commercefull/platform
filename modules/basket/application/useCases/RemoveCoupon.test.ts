import { RemoveCouponUseCase, RemoveCouponCommand } from './RemoveCoupon';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';

describe('RemoveCouponUseCase', () => {
  let useCase: RemoveCouponUseCase;
  let mockRepo: Record<string, jest.Mock>;

  const makeBasket = () => ({
    basketId: 'b1', removeCoupon: jest.fn(), toJSON: jest.fn().mockReturnValue({ basketId: 'b1', couponCode: null }),
  });

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue(makeBasket()),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RemoveCouponUseCase(mockRepo as never);
  });

  it('should remove coupon from basket (happy path)', async () => {
    const result = await useCase.execute(new RemoveCouponCommand('b1'));

    expect(result.basketId).toBe('b1');
  });

  it('should throw BasketNotFoundError when basket does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new RemoveCouponCommand('missing'))).rejects.toThrow(BasketNotFoundError);
  });
});
