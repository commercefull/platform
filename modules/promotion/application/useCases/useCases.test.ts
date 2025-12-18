/**
 * Unit Tests for Promotion Use Cases
 */

import { ValidateCouponCommand, ValidateCouponUseCase } from './ValidateCoupon';
import { RedeemGiftCardCommand, RedeemGiftCardUseCase } from './RedeemGiftCard';
import { CheckGiftCardBalanceQuery, CheckGiftCardBalanceUseCase } from './CheckGiftCardBalance';
import { ApplyProductDiscountCommand, ApplyProductDiscountUseCase } from './ApplyProductDiscount';

// Mock the repositories
jest.mock('../../repos/couponRepo', () => ({
  __esModule: true,
  default: {
    findByCode: jest.fn(),
    getCustomerUsageCount: jest.fn(),
    calculateDiscount: jest.fn(),
    recordUsage: jest.fn()
  }
}));

jest.mock('../../repos/giftCardRepo', () => ({
  getGiftCardByCode: jest.fn(),
  getGiftCard: jest.fn(),
  redeemGiftCard: jest.fn()
}));

jest.mock('../../repos/discountRepo', () => ({
  __esModule: true,
  default: {
    findDiscountsForProduct: jest.fn(),
    calculateDiscount: jest.fn()
  }
}));

import couponRepo from '../../repos/couponRepo';
import * as giftCardRepo from '../../repos/giftCardRepo';
import discountRepo from '../../repos/discountRepo';

describe('ValidateCouponUseCase', () => {
  const useCase = new ValidateCouponUseCase();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when code is empty', async () => {
    const command = new ValidateCouponCommand('', 100);
    const result = await useCase.execute(command);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('code_required');
  });

  it('should return error when order total is negative', async () => {
    const command = new ValidateCouponCommand('TEST', -100);
    const result = await useCase.execute(command);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('invalid_order_total');
  });

  it('should return error when coupon not found', async () => {
    (couponRepo.findByCode as jest.Mock).mockResolvedValue(null);
    
    const command = new ValidateCouponCommand('INVALID', 100);
    const result = await useCase.execute(command);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('coupon_not_found');
  });

  it('should return error when coupon is inactive', async () => {
    (couponRepo.findByCode as jest.Mock).mockResolvedValue({
      promotionCouponId: '123',
      code: 'TEST',
      isActive: false
    });
    
    const command = new ValidateCouponCommand('TEST', 100);
    const result = await useCase.execute(command);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('coupon_inactive');
  });

  it('should return error when coupon has expired', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    (couponRepo.findByCode as jest.Mock).mockResolvedValue({
      promotionCouponId: '123',
      code: 'TEST',
      isActive: true,
      endDate: pastDate
    });
    
    const command = new ValidateCouponCommand('TEST', 100);
    const result = await useCase.execute(command);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('coupon_expired');
  });

  it('should return error when usage limit reached', async () => {
    (couponRepo.findByCode as jest.Mock).mockResolvedValue({
      promotionCouponId: '123',
      code: 'TEST',
      isActive: true,
      maxUsage: 10,
      usageCount: 10
    });
    
    const command = new ValidateCouponCommand('TEST', 100);
    const result = await useCase.execute(command);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('usage_limit_reached');
  });

  it('should return error when minimum order not met', async () => {
    (couponRepo.findByCode as jest.Mock).mockResolvedValue({
      promotionCouponId: '123',
      code: 'TEST',
      isActive: true,
      minOrderAmount: 50
    });
    
    const command = new ValidateCouponCommand('TEST', 30);
    const result = await useCase.execute(command);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('min_order_not_met');
  });

  it('should validate coupon successfully', async () => {
    const mockCoupon = {
      promotionCouponId: '123',
      code: 'TEST',
      isActive: true,
      type: 'percentage',
      discountAmount: 10
    };
    
    (couponRepo.findByCode as jest.Mock).mockResolvedValue(mockCoupon);
    (couponRepo.calculateDiscount as jest.Mock).mockReturnValue(10);
    
    const command = new ValidateCouponCommand('TEST', 100);
    const result = await useCase.execute(command);
    
    expect(result.valid).toBe(true);
    expect(result.coupon).toEqual(mockCoupon);
    expect(result.discountAmount).toBe(10);
  });
});

describe('CheckGiftCardBalanceUseCase', () => {
  const useCase = new CheckGiftCardBalanceUseCase();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when code is empty', async () => {
    const query = new CheckGiftCardBalanceQuery('');
    const result = await useCase.execute(query);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('code_required');
  });

  it('should return error when gift card not found', async () => {
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValue(null);
    
    const query = new CheckGiftCardBalanceQuery('INVALID');
    const result = await useCase.execute(query);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('gift_card_not_found');
  });

  it('should return gift card balance successfully', async () => {
    const mockGiftCard = {
      code: 'GC123',
      currentBalance: 50,
      currency: 'USD',
      status: 'active',
      isReloadable: true
    };
    
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValue(mockGiftCard);
    
    const query = new CheckGiftCardBalanceQuery('GC123');
    const result = await useCase.execute(query);
    
    expect(result.success).toBe(true);
    expect(result.currentBalance).toBe(50);
    expect(result.currency).toBe('USD');
    expect(result.status).toBe('active');
  });

  it('should return expired status for expired gift card', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const mockGiftCard = {
      code: 'GC123',
      currentBalance: 50,
      currency: 'USD',
      status: 'active',
      expiresAt: pastDate
    };
    
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValue(mockGiftCard);
    
    const query = new CheckGiftCardBalanceQuery('GC123');
    const result = await useCase.execute(query);
    
    expect(result.success).toBe(true);
    expect(result.status).toBe('expired');
  });
});

describe('RedeemGiftCardUseCase', () => {
  const useCase = new RedeemGiftCardUseCase();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when code is empty', async () => {
    const command = new RedeemGiftCardCommand('', 50);
    const result = await useCase.execute(command);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('code_required');
  });

  it('should return error when amount is zero or negative', async () => {
    const command = new RedeemGiftCardCommand('GC123', 0);
    const result = await useCase.execute(command);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('invalid_amount');
  });

  it('should return error when gift card not found', async () => {
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValue(null);
    
    const command = new RedeemGiftCardCommand('INVALID', 50);
    const result = await useCase.execute(command);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('gift_card_not_found');
  });

  it('should return error when gift card is not active', async () => {
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValue({
      promotionGiftCardId: '123',
      code: 'GC123',
      status: 'depleted',
      currentBalance: 0
    });
    
    const command = new RedeemGiftCardCommand('GC123', 50);
    const result = await useCase.execute(command);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('gift_card_not_active');
  });

  it('should return error when insufficient balance', async () => {
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValue({
      promotionGiftCardId: '123',
      code: 'GC123',
      status: 'active',
      currentBalance: 30
    });
    
    const command = new RedeemGiftCardCommand('GC123', 50);
    const result = await useCase.execute(command);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('insufficient_balance');
  });

  it('should redeem gift card successfully', async () => {
    const mockGiftCard = {
      promotionGiftCardId: '123',
      code: 'GC123',
      status: 'active',
      currentBalance: 100
    };
    
    const mockTransaction = {
      promotionGiftCardTransactionId: 'txn123',
      amount: 50,
      type: 'redemption'
    };
    
    (giftCardRepo.getGiftCardByCode as jest.Mock).mockResolvedValue(mockGiftCard);
    (giftCardRepo.redeemGiftCard as jest.Mock).mockResolvedValue(mockTransaction);
    (giftCardRepo.getGiftCard as jest.Mock).mockResolvedValue({
      ...mockGiftCard,
      currentBalance: 50
    });
    
    const command = new RedeemGiftCardCommand('GC123', 50, 'order123', 'customer123');
    const result = await useCase.execute(command);
    
    expect(result.success).toBe(true);
    expect(result.transaction).toEqual(mockTransaction);
    expect(result.remainingBalance).toBe(50);
  });
});

describe('ApplyProductDiscountUseCase', () => {
  const useCase = new ApplyProductDiscountUseCase();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty result for empty items', async () => {
    const command = new ApplyProductDiscountCommand([]);
    const result = await useCase.execute(command);
    
    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(0);
    expect(result.totalDiscount).toBe(0);
  });

  it('should apply discounts to products', async () => {
    const mockDiscount = {
      promotionProductDiscountId: 'disc123',
      name: '10% Off',
      discountType: 'percentage',
      discountValue: 10,
      stackable: false
    };
    
    (discountRepo.findDiscountsForProduct as jest.Mock).mockResolvedValue([mockDiscount]);
    (discountRepo.calculateDiscount as jest.Mock).mockReturnValue(10);
    
    const command = new ApplyProductDiscountCommand([
      { productId: 'prod1', price: 100, quantity: 1 }
    ]);
    const result = await useCase.execute(command);
    
    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.totalDiscount).toBe(10);
    expect(result.appliedDiscounts).toContain('disc123');
  });

  it('should apply stackable discounts', async () => {
    const mockDiscounts = [
      {
        promotionProductDiscountId: 'disc1',
        name: '10% Off',
        discountType: 'percentage',
        discountValue: 10,
        stackable: true
      },
      {
        promotionProductDiscountId: 'disc2',
        name: '$5 Off',
        discountType: 'fixed',
        discountValue: 5,
        stackable: true
      }
    ];
    
    (discountRepo.findDiscountsForProduct as jest.Mock).mockResolvedValue(mockDiscounts);
    (discountRepo.calculateDiscount as jest.Mock)
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(5);
    
    const command = new ApplyProductDiscountCommand([
      { productId: 'prod1', price: 100, quantity: 1 }
    ]);
    const result = await useCase.execute(command);
    
    expect(result.success).toBe(true);
    expect(result.totalDiscount).toBe(15);
    expect(result.appliedDiscounts).toHaveLength(2);
  });
});
