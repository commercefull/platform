import CouponRepo from '../infrastructure/repositories/CouponRepository';
import { CreateCouponUseCase } from './useCases/CreateCoupon';
import { ValidateCouponUseCase } from './useCases/ValidateCoupon';
import { ApplyCouponUseCase } from './useCases/ApplyCoupon';
import { RedeemCouponUseCase } from './useCases/RedeemCoupon';
import { ManageCouponsUseCase } from './useCases/ManageCoupons';

export { CouponRepo, CouponRepo as couponRepository };

export const createCouponUseCase = new CreateCouponUseCase(CouponRepo);
export const validateCouponUseCase = new ValidateCouponUseCase(CouponRepo);
export const applyCouponUseCase = new ApplyCouponUseCase(CouponRepo);
export const redeemCouponUseCase = new RedeemCouponUseCase(CouponRepo);
export const manageCouponsUseCase = new ManageCouponsUseCase(CouponRepo);
