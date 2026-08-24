/**
 * Promotion Business Router
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as giftCardController from '../controllers/giftCardBusinessController';
import * as discountController from '../controllers/discountController';
import * as couponController from '../controllers/couponController';
import * as promotionController from '../controllers/promotionController';
import * as cartPromotionController from '../controllers/cartPromotionController';
import * as categoryPromotionController from '../controllers/categoryPromotionController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();
router.use(isOrganizationLoggedIn);

// Promotion routes
router.get('/promotions', asyncHandler(promotionController.getPromotions));
router.get('/promotions/active', asyncHandler(promotionController.getActivePromotions));
router.post('/promotions', asyncHandler(promotionController.createPromotion));
router.get('/promotions/:id', asyncHandler(promotionController.getPromotionById));
router.put('/promotions/:id', asyncHandler(promotionController.updatePromotion));
router.delete('/promotions/:id', asyncHandler(promotionController.deletePromotion));
router.post('/promotions/:id/activate', asyncHandler(promotionController.activatePromotion));
router.post('/promotions/:id/pause', asyncHandler(promotionController.pausePromotion));

// Cart Promotion routes
router.get('/cart-promotions/:id', asyncHandler(cartPromotionController.getCartPromotionById));
router.get('/cart-promotions/cart/:cartId', asyncHandler(cartPromotionController.getPromotionsByCartId));
router.post('/cart-promotions', asyncHandler(cartPromotionController.applyPromotion));
router.put('/cart-promotions/:id', asyncHandler(cartPromotionController.updateCartPromotion));
router.delete('/cart-promotions/:id', asyncHandler(cartPromotionController.removePromotion));

// Category Promotion routes
router.get('/category-promotions/active', asyncHandler(categoryPromotionController.getActiveCategoryPromotions));
router.get('/category-promotions/category/:categoryId', asyncHandler(categoryPromotionController.getPromotionsByCategoryId));
router.get('/category-promotions/:id', asyncHandler(categoryPromotionController.getCategoryPromotionById));
router.post('/category-promotions', asyncHandler(categoryPromotionController.createCategoryPromotion));
router.put('/category-promotions/:id', asyncHandler(categoryPromotionController.updateCategoryPromotion));
router.delete('/category-promotions/:id', asyncHandler(categoryPromotionController.deleteCategoryPromotion));

// Gift Card routes
router.get('/gift-cards', asyncHandler(giftCardController.getGiftCards));
router.get('/gift-cards/:id', asyncHandler(giftCardController.getGiftCard));
router.post('/gift-cards', asyncHandler(giftCardController.createGiftCard));
router.post('/gift-cards/:id/activate', asyncHandler(giftCardController.activateGiftCard));
router.post('/gift-cards/:id/refund', asyncHandler(giftCardController.refundToGiftCard));
router.post('/gift-cards/:id/cancel', asyncHandler(giftCardController.cancelGiftCard));

// Discount routes
router.get('/discounts', asyncHandler(discountController.getActiveDiscounts));
router.get('/discounts/:id', asyncHandler(discountController.getDiscountById));
router.get('/discounts/product/:productId', asyncHandler(discountController.getDiscountsByProductId));
router.get('/discounts/category/:categoryId', asyncHandler(discountController.getDiscountsByCategoryId));
router.post('/discounts', asyncHandler(discountController.createDiscount));
router.put('/discounts/:id', asyncHandler(discountController.updateDiscount));
router.delete('/discounts/:id', asyncHandler(discountController.deleteDiscount));

// Coupon routes
router.get('/coupons', asyncHandler(couponController.getActiveCoupons));
router.get('/coupons/:id', asyncHandler(couponController.getCouponById));
router.get('/coupons/code/:code', asyncHandler(couponController.getCouponByCode));
router.post('/coupons', asyncHandler(couponController.createCoupon));
router.put('/coupons/:id', asyncHandler(couponController.updateCoupon));
router.delete('/coupons/:id', asyncHandler(couponController.deleteCoupon));
router.post('/coupons/validate', asyncHandler(couponController.validateCoupon));
router.get('/coupons/:id/usage', asyncHandler(couponController.getCouponUsage));
router.post('/coupons/calculate', asyncHandler(couponController.calculateCouponDiscount));

export const promotionBusinessRouter = router;
