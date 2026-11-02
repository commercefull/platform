/**
 * Promotion Business Router
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  activateGiftCard,
  assignGiftCard,
  cancelGiftCard,
  createGiftCard,
  getGiftCard,
  getGiftCards,
  refundToGiftCard,
} from '../controllers/giftCardBusinessController';
import {
  createDiscount,
  deleteDiscount,
  getActiveDiscounts,
  getDiscountById,
  getDiscountsByCategoryId,
  getDiscountsByProductId,
  updateDiscount,
} from '../controllers/discountController';
import {
  calculateCouponDiscount,
  createCoupon,
  deleteCoupon,
  getActiveCoupons,
  getCouponByCode,
  getCouponById,
  getCouponUsage,
  updateCoupon,
  validateCoupon,
} from '../controllers/couponController';
import {
  activatePromotion,
  createPromotion,
  deletePromotion,
  getActivePromotions,
  getPromotionById,
  getPromotions,
  pausePromotion,
  updatePromotion,
} from '../controllers/promotionController';
import {
  applyPromotion,
  getCartPromotionById,
  getPromotionsByCartId,
  removePromotion,
  updateCartPromotion,
} from '../controllers/cartPromotionController';
import {
  createCategoryPromotion,
  deleteCategoryPromotion,
  getActiveCategoryPromotions,
  getCategoryPromotionById,
  getPromotionsByCategoryId,
  updateCategoryPromotion,
} from '../controllers/categoryPromotionController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();
router.use(isOrganizationLoggedIn);

// Promotion routes
router.get('/promotions', asyncHandler(getPromotions));
router.get('/promotions/active', asyncHandler(getActivePromotions));
router.post('/promotions', asyncHandler(createPromotion));
router.get('/promotions/:id', asyncHandler(getPromotionById));
router.put('/promotions/:id', asyncHandler(updatePromotion));
router.delete('/promotions/:id', asyncHandler(deletePromotion));
router.post('/promotions/:id/activate', asyncHandler(activatePromotion));
router.post('/promotions/:id/pause', asyncHandler(pausePromotion));

// Cart Promotion routes
router.get('/cart-promotions/:id', asyncHandler(getCartPromotionById));
router.get('/cart-promotions/cart/:cartId', asyncHandler(getPromotionsByCartId));
router.post('/cart-promotions', asyncHandler(applyPromotion));
router.put('/cart-promotions/:id', asyncHandler(updateCartPromotion));
router.delete('/cart-promotions/:id', asyncHandler(removePromotion));

// Category Promotion routes
router.get('/category-promotions/active', asyncHandler(getActiveCategoryPromotions));
router.get('/category-promotions/category/:categoryId', asyncHandler(getPromotionsByCategoryId));
router.get('/category-promotions/:id', asyncHandler(getCategoryPromotionById));
router.post('/category-promotions', asyncHandler(createCategoryPromotion));
router.put('/category-promotions/:id', asyncHandler(updateCategoryPromotion));
router.delete('/category-promotions/:id', asyncHandler(deleteCategoryPromotion));

// Gift Card routes
router.get('/gift-cards', asyncHandler(getGiftCards));
router.get('/gift-cards/:id', asyncHandler(getGiftCard));
router.post('/gift-cards', asyncHandler(createGiftCard));
router.post('/gift-cards/:id/activate', asyncHandler(activateGiftCard));
router.post('/gift-cards/:id/assign', asyncHandler(assignGiftCard));
router.post('/gift-cards/:id/refund', asyncHandler(refundToGiftCard));
router.post('/gift-cards/:id/cancel', asyncHandler(cancelGiftCard));

// Discount routes
router.get('/discounts', asyncHandler(getActiveDiscounts));
router.get('/discounts/:id', asyncHandler(getDiscountById));
router.get('/discounts/product/:productId', asyncHandler(getDiscountsByProductId));
router.get('/discounts/category/:categoryId', asyncHandler(getDiscountsByCategoryId));
router.post('/discounts', asyncHandler(createDiscount));
router.put('/discounts/:id', asyncHandler(updateDiscount));
router.delete('/discounts/:id', asyncHandler(deleteDiscount));

// Coupon routes
router.get('/coupons', asyncHandler(getActiveCoupons));
router.get('/coupons/:id', asyncHandler(getCouponById));
router.get('/coupons/code/:code', asyncHandler(getCouponByCode));
router.post('/coupons', asyncHandler(createCoupon));
router.put('/coupons/:id', asyncHandler(updateCoupon));
router.delete('/coupons/:id', asyncHandler(deleteCoupon));
router.post('/coupons/validate', asyncHandler(validateCoupon));
router.get('/coupons/:id/usage', asyncHandler(getCouponUsage));
router.post('/coupons/calculate', asyncHandler(calculateCouponDiscount));

export const promotionBusinessRouter = router;
