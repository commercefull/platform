/**
 * Coupon Router
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  createCoupon,
  validateCoupon,
  applyCoupon,
  redeemCoupon,
  listCoupons,
  getCoupon,
  deleteCoupon,
} from '../controllers/CouponController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = Router();

router.use(isOrganizationLoggedIn);

router.get('/coupons', asyncHandler(listCoupons));
router.post('/coupons', asyncHandler(createCoupon));
router.post('/coupons/validate', asyncHandler(validateCoupon));
router.get('/coupons/validate/:code', asyncHandler(validateCoupon));
router.post('/coupons/apply', asyncHandler(applyCoupon));
router.post('/coupons/redeem', asyncHandler(redeemCoupon));
router.get('/coupons/:couponId', asyncHandler(getCoupon));
router.delete('/coupons/:couponId', asyncHandler(deleteCoupon));

export const couponBusinessRouter = router;
export default router;
