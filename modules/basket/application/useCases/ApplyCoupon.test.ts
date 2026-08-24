jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ApplyCouponUseCase, ApplyCouponCommand } from './ApplyCoupon';
import { BasketNotFoundError, BasketValidationError } from '../../domain/errors/BasketErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ApplyCouponUseCase', () => {
  let useCase: ApplyCouponUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockDiscountPort: Record<string, jest.Mock>;

  const makeBasket = () => ({
    basketId: 'b1', customerId: 'c1', subtotal: { amount: 100 },
    applyCoupon: jest.fn(), toJSON: jest.fn().mockReturnValue({ basketId: 'b1' }),
  });

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue(makeBasket()),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockDiscountPort = {
      validateDiscount: jest.fn().mockResolvedValue({
        valid: true, discount: { type: 'percentage', value: 10, discountAmount: 10 },
      }),
    };
    useCase = new ApplyCouponUseCase(mockRepo as never, mockDiscountPort as never);
  });

  it('should apply coupon to basket (happy path)', async () => {
    const result = await useCase.execute(new ApplyCouponCommand('b1', 'SAVE10'));

    expect(result.basketId).toBe('b1');
    expect(eventBus.emit).toHaveBeenCalledWith('promotion.coupon_applied', expect.objectContaining({ basketId: 'b1', couponCode: 'SAVE10' }));
  });

  it('should throw BasketNotFoundError when basket does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ApplyCouponCommand('missing', 'SAVE10'))).rejects.toThrow(BasketNotFoundError);
  });

  it('should throw BasketValidationError when no discount port provided', async () => {
    useCase = new ApplyCouponUseCase(mockRepo as never);

    await expect(useCase.execute(new ApplyCouponCommand('b1', 'SAVE10'))).rejects.toThrow(BasketValidationError);
  });

  it('should throw BasketValidationError when coupon is invalid', async () => {
    mockDiscountPort.validateDiscount.mockResolvedValue({ valid: false, error: 'Expired coupon' });

    await expect(useCase.execute(new ApplyCouponCommand('b1', 'EXPIRED'))).rejects.toThrow(BasketValidationError);
  });
});
