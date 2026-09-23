import '../../tests/testUtils';
import { ManageCouponsUseCase } from './ManageCoupons';
import {
  createCouponRepository,
  createPromotionCoupon,
} from '../../tests/testUtils';
import { CouponType } from '../../domain/repositories/CouponRepository';

describe('ManageCouponsUseCase', () => {
  const couponRepository = createCouponRepository();
  const useCase = new ManageCouponsUseCase(couponRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the coupon for the given code', async () => {
    couponRepository.findByCode.mockResolvedValue(createPromotionCoupon());

    const result = await useCase.findByCode('SAVE10', 'org-1');

    expect(result?.code).toBe('SAVE10');
    expect(couponRepository.findByCode).toHaveBeenCalledWith('SAVE10', 'org-1');
  });

  it('should delegate validation to the repository', async () => {
    couponRepository.validate.mockResolvedValue({ valid: true, coupon: createPromotionCoupon() });

    const result = await useCase.validate('SAVE10', 100, 'cust-1', 'org-1');

    expect(result.valid).toBe(true);
    expect(couponRepository.validate).toHaveBeenCalledWith('SAVE10', 100, 'cust-1', 'org-1');
  });

  it('should delegate discount calculation to the repository', () => {
    const coupon = createPromotionCoupon();
    couponRepository.calculateDiscount.mockReturnValue(25);

    const result = useCase.calculateDiscount(coupon, 250);

    expect(result).toBe(25);
    expect(couponRepository.calculateDiscount).toHaveBeenCalledWith(coupon, 250);
  });

  it('should delegate usage listing to the repository', async () => {
    couponRepository.getUsage.mockResolvedValue([]);

    const result = await useCase.getUsage('coupon-1');

    expect(result).toEqual([]);
    expect(couponRepository.getUsage).toHaveBeenCalledWith('coupon-1');
  });

  it('should delegate coupon creation to the repository', async () => {
    couponRepository.create.mockResolvedValue(createPromotionCoupon());
    const input = { code: 'NEW10', name: 'New', type: CouponType.PERCENTAGE };

    const result = await useCase.create(input);

    expect(result.code).toBe('SAVE10');
    expect(couponRepository.create).toHaveBeenCalledWith(input);
  });
});

