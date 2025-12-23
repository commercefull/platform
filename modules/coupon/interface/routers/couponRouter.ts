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

router.get('/', listCoupons);
router.post('/', createCoupon);
router.post('/validate', validateCoupon);
router.get('/validate/:code', validateCoupon);
router.post('/apply', applyCoupon);
router.post('/redeem', redeemCoupon);
router.get('/:couponId', getCoupon);
router.delete('/:couponId', deleteCoupon);

export const couponBusinessRouter = router;
export default router;
