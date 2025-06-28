import express from 'express';
import { isMerchantLoggedIn } from '../../libs/auth';

// Import coupon controller
import {
  getActiveCoupons,
  getCouponById,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getCouponUsage,
  calculateCouponDiscount
} from './controllers/couponController';

// Import promotion controller
import {
  getActivePromotions,
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  applyPromotionToCart,
  removePromotionFromCart,
  validatePromotionForCart
} from './controllers/promotionController';

import { applyPromotion,  getCartPromotionById, getPromotionsByCartId, removePromotion,  updateCartPromotion } from './controllers/cartPromotionController';
import { getActiveCategoryPromotions, getPromotionsByCategoryId, getCategoryPromotionById, createCategoryPromotion, updateCategoryPromotion, deleteCategoryPromotion } from './controllers/categoryPromotionController';
import { getActiveDiscounts, getDiscountById, getDiscountsByCategoryId, getDiscountsByProductId, createDiscount, updateDiscount, deleteDiscount } from './controllers/discountController';

const router = express.Router();

router.use(isMerchantLoggedIn);

// -------------------- Enhanced Coupon Routes --------------------
router.get('/coupons', getActiveCoupons);
router.get('/coupons/:id', getCouponById);
router.get('/coupons/code/:code', getCouponByCode);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.post('/coupons/validate', validateCoupon);
router.get('/coupons/:id/usage', getCouponUsage);
router.post('/coupons/calculate-discount', calculateCouponDiscount);

// -------------------- New Unified Promotion Routes --------------------
router.get('/promotions', getPromotions);
router.get('/promotions/active', getActivePromotions);
router.get('/promotions/:id', getPromotionById);
router.post('/promotions', createPromotion);
router.put('/promotions/:id', updatePromotion);
router.delete('/promotions/:id', deletePromotion);
router.post('/promotions/apply', applyPromotionToCart);
router.delete('/promotions/cart/:cartId/promotion/:promotionId', removePromotionFromCart);
router.post('/promotions/validate', validatePromotionForCart);

// -------------------- Legacy Routes (for backward compatibility) --------------------
// Legacy Cart Promotion Routes
router.get('/cart-promotions/cart/:cartId', getPromotionsByCartId);
router.get('/cart-promotions/:id', getCartPromotionById);
router.post('/cart-promotions', applyPromotion);
router.put('/cart-promotions/:id', updateCartPromotion);
router.delete('/cart-promotions/:id', removePromotion);

// Legacy Category Promotion Routes
router.get('/category-promotions', getActiveCategoryPromotions);
router.get('/category-promotions/category/:categoryId', getPromotionsByCategoryId);
router.get('/category-promotions/:id', getCategoryPromotionById);
router.post('/category-promotions', createCategoryPromotion);
router.put('/category-promotions/:id', updateCategoryPromotion);
router.delete('/category-promotions/:id', deleteCategoryPromotion);

// Legacy Discount Routes
router.get('/discounts', getActiveDiscounts);
router.get('/discounts/product/:productId', getDiscountsByProductId);
router.get('/discounts/category/:categoryId', getDiscountsByCategoryId);
router.get('/discounts/:id', getDiscountById);
router.post('/discounts', createDiscount);
router.put('/discounts/:id', updateDiscount);
router.delete('/discounts/:id', deleteDiscount);

export const promotionBusinessApiRouter = router;
