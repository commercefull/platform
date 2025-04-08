import express from 'express';
import { getActiveCoupons, getCouponByCode, getCouponById, createCoupon, updateCoupon, deleteCoupon } from './controllers/couponController';
import { applyPromotion, getPromotionById, getPromotionsByCartId, removePromotion, updatePromotion } from './controllers/cartPromotionController';
import { getActivePromotions, getPromotionsByCategoryId, getPromotionById as getCategoryPromotionById, createPromotion, updatePromotion as updateCategoryPromotion, deletePromotion } from './controllers/categoryPromotionController';
import { getActiveDiscounts, getDiscountById, getDiscountsByCategoryId, getDiscountsByProductId, createDiscount, updateDiscount, deleteDiscount } from './controllers/discountController';
import { isAdmin } from '../../libs/auth';

const router = express.Router();

// Coupon Routes
router.get('/coupons', isAdmin, getActiveCoupons);
router.get('/coupons/:id', isAdmin, getCouponById);
router.get('/coupons/code/:code', isAdmin, getCouponByCode);
router.post('/coupons', isAdmin, createCoupon);
router.put('/coupons/:id', isAdmin, updateCoupon);
router.delete('/coupons/:id', isAdmin, deleteCoupon);

// Cart Promotion Routes
router.get('/cart-promotions/cart/:cartId', isAdmin, getPromotionsByCartId);
router.get('/cart-promotions/:id', isAdmin, getPromotionById);
router.post('/cart-promotions', isAdmin, applyPromotion);
router.put('/cart-promotions/:id', isAdmin, updatePromotion);
router.delete('/cart-promotions/:id', isAdmin, removePromotion);

// Category Promotion Routes
router.get('/category-promotions', isAdmin, getActivePromotions);
router.get('/category-promotions/category/:categoryId', isAdmin, getPromotionsByCategoryId);
router.get('/category-promotions/:id', isAdmin, getCategoryPromotionById);
router.post('/category-promotions', isAdmin, createPromotion);
router.put('/category-promotions/:id', isAdmin, updateCategoryPromotion);
router.delete('/category-promotions/:id', isAdmin, deletePromotion);

// Discount Routes
router.get('/discounts', isAdmin, getActiveDiscounts);
router.get('/discounts/product/:productId', isAdmin, getDiscountsByProductId);
router.get('/discounts/category/:categoryId', isAdmin, getDiscountsByCategoryId);
router.get('/discounts/:id', isAdmin, getDiscountById);
router.post('/discounts', isAdmin, createDiscount);
router.put('/discounts/:id', isAdmin, updateDiscount);
router.delete('/discounts/:id', isAdmin, deleteDiscount);

export const promotionRouterAdmin = router;
