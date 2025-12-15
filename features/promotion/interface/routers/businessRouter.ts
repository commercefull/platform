/**
 * Promotion Business Router
 */

import express from 'express';
import * as giftCardController from '../../controllers/giftCardBusinessController';
import * as discountController from '../../controllers/discountController';
import * as couponController from '../../controllers/couponController';
import * as promotionController from '../../controllers/promotionController';
import * as cartPromotionController from '../../controllers/cartPromotionController';
import * as categoryPromotionController from '../../controllers/categoryPromotionController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();
router.use(isMerchantLoggedIn);

// Promotion routes
router.get('/promotions', promotionController.getPromotions);
router.get('/promotions/active', promotionController.getActivePromotions);
router.post('/promotions', promotionController.createPromotion);
router.get('/promotions/:id', promotionController.getPromotionById);
router.put('/promotions/:id', promotionController.updatePromotion);
router.delete('/promotions/:id', promotionController.deletePromotion);
router.post('/promotions/:id/activate', promotionController.activatePromotion);
router.post('/promotions/:id/pause', promotionController.pausePromotion);

// Cart Promotion routes
router.get('/cart-promotions/:id', cartPromotionController.getCartPromotionById);
router.get('/cart-promotions/cart/:cartId', cartPromotionController.getPromotionsByCartId);
router.post('/cart-promotions', cartPromotionController.applyPromotion);
router.put('/cart-promotions/:id', cartPromotionController.updateCartPromotion);
router.delete('/cart-promotions/:id', cartPromotionController.removePromotion);

// Category Promotion routes
router.get('/category-promotions/active', categoryPromotionController.getActiveCategoryPromotions);
router.get('/category-promotions/category/:categoryId', categoryPromotionController.getPromotionsByCategoryId);
router.get('/category-promotions/:id', categoryPromotionController.getCategoryPromotionById);
router.post('/category-promotions', categoryPromotionController.createCategoryPromotion);
router.put('/category-promotions/:id', categoryPromotionController.updateCategoryPromotion);
router.delete('/category-promotions/:id', categoryPromotionController.deleteCategoryPromotion);

// Gift Card routes
router.get('/gift-cards', giftCardController.getGiftCards);
router.get('/gift-cards/:id', giftCardController.getGiftCard);
router.post('/gift-cards', giftCardController.createGiftCard);
router.post('/gift-cards/:id/activate', giftCardController.activateGiftCard);
router.post('/gift-cards/:id/refund', giftCardController.refundToGiftCard);
router.post('/gift-cards/:id/cancel', giftCardController.cancelGiftCard);

// Discount routes
router.get('/discounts', discountController.getActiveDiscounts);
router.get('/discounts/:id', discountController.getDiscountById);
router.get('/discounts/product/:productId', discountController.getDiscountsByProductId);
router.get('/discounts/category/:categoryId', discountController.getDiscountsByCategoryId);
router.post('/discounts', discountController.createDiscount);
router.put('/discounts/:id', discountController.updateDiscount);
router.delete('/discounts/:id', discountController.deleteDiscount);

// Coupon routes
router.get('/coupons', couponController.getActiveCoupons);
router.get('/coupons/:id', couponController.getCouponById);
router.get('/coupons/code/:code', couponController.getCouponByCode);
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);
router.post('/coupons/validate', couponController.validateCoupon);
router.get('/coupons/:id/usage', couponController.getCouponUsage);
router.post('/coupons/calculate', couponController.calculateCouponDiscount);

export const promotionBusinessRouter = router;
