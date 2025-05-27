import express from 'express';
import { isAdmin } from '../../libs/auth';

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

// Keeping the existing imports for backward compatibility
import { applyPromotion, getPromotionById as getCartPromotionById, getPromotionsByCartId, removePromotion, updatePromotion as updateCartPromotion } from './controllers/cartPromotionController';
import { getActivePromotions as getActiveCategoryPromotions, getPromotionsByCategoryId, getPromotionById as getCategoryPromotionById, createPromotion as createCategoryPromotion, updatePromotion as updateCategoryPromotion, deletePromotion as deleteCategoryPromotion } from './controllers/categoryPromotionController';
import { getActiveDiscounts, getDiscountById, getDiscountsByCategoryId, getDiscountsByProductId, createDiscount, updateDiscount, deleteDiscount } from './controllers/discountController';

const router = express.Router();

// -------------------- Enhanced Coupon Routes --------------------
router.get('/coupons', isAdmin, getActiveCoupons);
router.get('/coupons/:id', isAdmin, getCouponById);
router.get('/coupons/code/:code', isAdmin, getCouponByCode);
router.post('/coupons', isAdmin, createCoupon);
router.put('/coupons/:id', isAdmin, updateCoupon);
router.delete('/coupons/:id', isAdmin, deleteCoupon);
router.post('/coupons/validate', isAdmin, validateCoupon);
router.get('/coupons/:id/usage', isAdmin, getCouponUsage);
router.post('/coupons/calculate-discount', isAdmin, calculateCouponDiscount);

// -------------------- New Unified Promotion Routes --------------------
router.get('/promotions', isAdmin, getPromotions);
router.get('/promotions/active', isAdmin, getActivePromotions);
router.get('/promotions/:id', isAdmin, getPromotionById);
router.post('/promotions', isAdmin, createPromotion);
router.put('/promotions/:id', isAdmin, updatePromotion);
router.delete('/promotions/:id', isAdmin, deletePromotion);
router.post('/promotions/apply', isAdmin, applyPromotionToCart);
router.delete('/promotions/cart/:cartId/promotion/:promotionId', isAdmin, removePromotionFromCart);
router.post('/promotions/validate', isAdmin, validatePromotionForCart);

// -------------------- Legacy Routes (for backward compatibility) --------------------
// Legacy Cart Promotion Routes
router.get('/cart-promotions/cart/:cartId', isAdmin, getPromotionsByCartId);
router.get('/cart-promotions/:id', isAdmin, getCartPromotionById);
router.post('/cart-promotions', isAdmin, applyPromotion);
router.put('/cart-promotions/:id', isAdmin, updateCartPromotion);
router.delete('/cart-promotions/:id', isAdmin, removePromotion);

// Legacy Category Promotion Routes
router.get('/category-promotions', isAdmin, getActiveCategoryPromotions);
router.get('/category-promotions/category/:categoryId', isAdmin, getPromotionsByCategoryId);
router.get('/category-promotions/:id', isAdmin, getCategoryPromotionById);
router.post('/category-promotions', isAdmin, createCategoryPromotion);
router.put('/category-promotions/:id', isAdmin, updateCategoryPromotion);
router.delete('/category-promotions/:id', isAdmin, deleteCategoryPromotion);

// Legacy Discount Routes
router.get('/discounts', isAdmin, getActiveDiscounts);
router.get('/discounts/product/:productId', isAdmin, getDiscountsByProductId);
router.get('/discounts/category/:categoryId', isAdmin, getDiscountsByCategoryId);
router.get('/discounts/:id', isAdmin, getDiscountById);
router.post('/discounts', isAdmin, createDiscount);
router.put('/discounts/:id', isAdmin, updateDiscount);
router.delete('/discounts/:id', isAdmin, deleteDiscount);

export const promotionBusinessApiRouter = router;
