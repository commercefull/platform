/**
 * Coupon Customer Router
 *
 * Public-facing routes for validating and applying coupons.
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { validateCoupon, applyCoupon } from '../controllers/CouponController';

const router = Router();

router.post('/coupons/validate', asyncHandler(validateCoupon));
router.get('/coupons/validate/:code', asyncHandler(validateCoupon));
router.post('/coupons/apply', asyncHandler(applyCoupon));

export const couponCustomerRouter = router;
export default router;
