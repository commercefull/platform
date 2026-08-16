/**
 * Coupon Router
 */

import { Router } from 'express';
import {
  createCoupon,
  validateCoupon,
  applyCoupon,
  redeemCoupon,
  listCoupons,
  getCoupon,
  deleteCoupon,
} from '../controllers/CouponController';

const router = Router();

router.get('/coupons', listCoupons);
router.post('/coupons', createCoupon);
router.post('/coupons/validate', validateCoupon);
router.get('/coupons/validate/:code', validateCoupon);
router.post('/coupons/apply', applyCoupon);
router.post('/coupons/redeem', redeemCoupon);
router.get('/coupons/:couponId', getCoupon);
router.delete('/coupons/:couponId', deleteCoupon);

export const couponBusinessRouter = router;
export default router;
