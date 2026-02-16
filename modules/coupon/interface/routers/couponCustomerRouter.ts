/**
 * Coupon Customer Router
 *
 * Public-facing routes for validating and applying coupons.
 */

import { Router } from 'express';
import { validateCoupon, applyCoupon } from '../controllers/CouponController';

const router = Router();

router.post('/coupons/validate', validateCoupon);
router.get('/coupons/validate/:code', validateCoupon);
router.post('/coupons/apply', applyCoupon);

export const couponCustomerRouter = router;
export default router;
