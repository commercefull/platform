jest.mock('../../infrastructure/repositories/PromotionRuleRepository', () => ({
  __esModule: true,
  default: {
    promotions: {
      findById: jest.fn().mockResolvedValue({ promotionId: 'p1' }),
      findAll: jest.fn().mockResolvedValue([{ promotionId: 'p1' }]),
      findActive: jest.fn().mockResolvedValue([{ promotionId: 'p1', isActive: true }]),
      create: jest.fn().mockResolvedValue({ promotionId: 'p2' }),
      update: jest.fn().mockResolvedValue({ promotionId: 'p1', name: 'Updated' }),
      delete: jest.fn().mockResolvedValue(true),
    },
  },
}));

jest.mock('../../infrastructure/repositories/CouponDiscountRepository', () => ({
  __esModule: true,
  default: {
    coupons: {
      findById: jest.fn().mockResolvedValue({ couponId: 'c1' }),
      findByCode: jest.fn().mockResolvedValue({ couponId: 'c1', code: 'SAVE10' }),
      findAll: jest.fn().mockResolvedValue([{ couponId: 'c1' }]),
      findActiveCoupons: jest.fn().mockResolvedValue([{ couponId: 'c1', isActive: true }]),
      create: jest.fn().mockResolvedValue({ couponId: 'c2' }),
      update: jest.fn().mockResolvedValue({ couponId: 'c1', name: 'Updated' }),
      delete: jest.fn().mockResolvedValue(true),
      getUsage: jest.fn().mockResolvedValue([{ promotionCouponUsageId: 'u1' }]),
      validate: jest.fn().mockResolvedValue({ valid: true }),
      calculateDiscount: jest.fn().mockReturnValue(10),
    },
  },
}));

jest.mock('../../infrastructure/repositories/GiftCardRepository', () => ({
  getGiftCardByCode: jest.fn(),
}));

import { ManagePromotionsUseCase, ManageCouponsUseCase } from './ManagePromotions';
import promotionRuleRepository from '../../infrastructure/repositories/PromotionRuleRepository';
import couponDiscountRepository from '../../infrastructure/repositories/CouponDiscountRepository';

const _mockPromoRepo = promotionRuleRepository as unknown as { promotions: Record<string, jest.Mock> };
const _mockCouponRepo = couponDiscountRepository as unknown as { coupons: Record<string, jest.Mock> };

describe('ManagePromotionsUseCase', () => {
  let useCase: ManagePromotionsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManagePromotionsUseCase();
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('p1');
    expect(result).toEqual({ promotionId: 'p1' });
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find active', async () => {
    const result = await useCase.findActive();
    expect(result).toHaveLength(1);
  });

  it('should create', async () => {
    const result = await useCase.create({ name: 'Sale' } as never);
    expect(result).toEqual({ promotionId: 'p2' });
  });

  it('should delete', async () => {
    const result = await useCase.delete('p1');
    expect(result).toBe(true);
  });
});

describe('ManageCouponsUseCase', () => {
  let useCase: ManageCouponsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageCouponsUseCase();
  });

  it('should find by code', async () => {
    const result = await useCase.findByCode('SAVE10');
    expect(result).toEqual({ couponId: 'c1', code: 'SAVE10' });
  });

  it('should validate coupon', async () => {
    const result = await useCase.validate('SAVE10', 100);
    expect(result.valid).toBe(true);
  });

  it('should calculate discount', async () => {
    const result = useCase.calculateDiscount({} as never, 100);
    expect(result).toBe(10);
  });

  it('should get usage', async () => {
    const result = await useCase.getUsage('c1');
    expect(result).toHaveLength(1);
  });
});
