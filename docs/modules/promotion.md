# Promotion Feature

## Overview

The Promotion feature manages discounts, coupons, gift cards, and promotional campaigns. It supports various discount types including percentage, fixed amount, buy-X-get-Y, and cart-level promotions.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-PRO-001 | List Promotions | Merchant/Admin | List all promotional campaigns with optional status/type filtering |
| UC-PRO-002 | Create Promotion | Merchant/Admin | Create a promotion (percentage, fixed, buy_x_get_y, free_shipping) with conditions and usage limits |
| UC-PRO-003 | Get Promotion | Merchant/Admin | Retrieve a specific promotion by ID |
| UC-PRO-004 | Update Promotion | Merchant/Admin | Update an existing promotion's configuration |
| UC-PRO-005 | Delete Promotion | Merchant/Admin | Permanently delete a promotion |
| UC-PRO-006 | Activate Promotion | Merchant/Admin | Activate a paused or inactive promotion |
| UC-PRO-007 | Pause Promotion | Merchant/Admin | Pause an active promotion |
| UC-PRO-008 | List Gift Cards | Merchant/Admin | List all gift cards with optional status filtering |
| UC-PRO-009 | Get Gift Card | Merchant/Admin | Retrieve a specific gift card by ID |
| UC-PRO-010 | Create Gift Card | Merchant/Admin | Create a gift card with initial balance, optional expiration, and optional recipient email delivery |
| UC-PRO-011 | Activate Gift Card | Merchant/Admin | Activate an inactive gift card so it can be used for purchases |
| UC-PRO-012 | Refund to Gift Card | Merchant/Admin | Increase a gift card's balance as part of a return/refund |
| UC-PRO-013 | Cancel Gift Card | Merchant/Admin | Cancel a gift card with a reason |
| UC-PRO-014 | Apply Coupon | Customer | Apply a valid coupon code to the cart at checkout |
| UC-PRO-015 | Remove Coupon | Customer | Remove an applied coupon from the cart |
| UC-PRO-016 | Check Gift Card Balance | Customer/Guest | Check the current balance of a gift card by code |
| UC-PRO-017 | Apply Gift Card | Customer | Apply a gift card balance to the order at checkout with partial redemption support |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-PRO-001 | GET | `/business/promotions` |
| UC-PRO-002 | POST | `/business/promotions` |
| UC-PRO-003 | GET | `/business/promotions/:promotionId` |
| UC-PRO-004 | PUT | `/business/promotions/:promotionId` |
| UC-PRO-005 | DELETE | `/business/promotions/:promotionId` |
| UC-PRO-006 | POST | `/business/promotions/:promotionId/activate` |
| UC-PRO-007 | POST | `/business/promotions/:promotionId/pause` |
| UC-PRO-008 | GET | `/business/promotions/gift-cards` |
| UC-PRO-009 | GET | `/business/promotions/gift-cards/:id` |
| UC-PRO-010 | POST | `/business/promotions/gift-cards` |
| UC-PRO-011 | POST | `/business/promotions/gift-cards/:id/activate` |
| UC-PRO-012 | POST | `/business/promotions/gift-cards/:id/refund` |
| UC-PRO-013 | POST | `/business/promotions/gift-cards/:id/cancel` |
| UC-PRO-014 | POST | `/checkout/coupon` |
| UC-PRO-015 | DELETE | `/checkout/coupon` |
| UC-PRO-016 | GET | `/gift-cards/:code/balance` |
| UC-PRO-017 | POST | `/checkout/gift-card` |

---

## Events Emitted

| Event                 | Trigger                    | Payload                        |
| --------------------- | -------------------------- | ------------------------------ |
| `promotion.created`   | Promotion created          | promotionId, type              |
| `promotion.activated` | Promotion activated        | promotionId                    |
| `promotion.paused`    | Promotion paused           | promotionId                    |
| `promotion.used`      | Promotion applied to order | promotionId, orderId, discount |
| `coupon.created`      | Coupon created             | couponId, code                 |
| `coupon.redeemed`     | Coupon used                | couponId, orderId              |
| `giftcard.created`    | Gift card created          | giftCardId                     |
| `giftcard.activated`  | Gift card activated        | giftCardId                     |
| `giftcard.redeemed`   | Gift card used             | giftCardId, amount, orderId    |
| `giftcard.refunded`   | Refund to gift card        | giftCardId, amount             |

---

## Integration Test Coverage

| Use Case                 | Test File                             | Status |
| ------------------------ | ------------------------------------- | ------ |
| UC-PRO-001 to UC-PRO-007 | `promotion/promotion.test.ts`         | 🟡     |
| UC-PRO-008 to UC-PRO-013 | `promotion/giftcard.test.ts`          | ✅     |
| UC-PRO-014 to UC-PRO-015 | `promotion/coupon.test.ts`            | ✅     |
| UC-PRO-016 to UC-PRO-017 | `promotion/giftcard-customer.test.ts` | ✅     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| POST | `/business/cart-promotions` | `applyPromotion` | — |
| GET | `/business/cart-promotions/:id` | `getCartPromotionById` | Cart Promotion routes |
| PUT | `/business/cart-promotions/:id` | `updateCartPromotion` | — |
| DELETE | `/business/cart-promotions/:id` | `removePromotion` | — |
| GET | `/business/cart-promotions/cart/:cartId` | `getPromotionsByCartId` | — |
| POST | `/business/category-promotions` | `createCategoryPromotion` | — |
| GET | `/business/category-promotions/:id` | `getCategoryPromotionById` | — |
| PUT | `/business/category-promotions/:id` | `updateCategoryPromotion` | — |
| DELETE | `/business/category-promotions/:id` | `deleteCategoryPromotion` | — |
| GET | `/business/category-promotions/active` | `getActiveCategoryPromotions` | Category Promotion routes |
| GET | `/business/category-promotions/category/:categoryId` | `getPromotionsByCategoryId` | — |
| GET | `/business/coupons` | `getActiveCoupons` | Coupon routes |
| POST | `/business/coupons` | `createCoupon` | — |
| GET | `/business/coupons/:id` | `getCouponById` | — |
| PUT | `/business/coupons/:id` | `updateCoupon` | — |
| DELETE | `/business/coupons/:id` | `deleteCoupon` | — |
| GET | `/business/coupons/:id/usage` | `getCouponUsage` | — |
| POST | `/business/coupons/calculate` | `calculateCouponDiscount` | — |
| GET | `/business/coupons/code/:code` | `getCouponByCode` | — |
| POST | `/business/coupons/validate` | `validateCoupon` | — |
| GET | `/business/discounts` | `getActiveDiscounts` | Discount routes |
| POST | `/business/discounts` | `createDiscount` | — |
| GET | `/business/discounts/:id` | `getDiscountById` | — |
| PUT | `/business/discounts/:id` | `updateDiscount` | — |
| DELETE | `/business/discounts/:id` | `deleteDiscount` | — |
| GET | `/business/discounts/category/:categoryId` | `getDiscountsByCategoryId` | — |
| GET | `/business/discounts/product/:productId` | `getDiscountsByProductId` | — |
| GET | `/business/gift-cards` | `getGiftCards` | Gift Card routes |
| POST | `/business/gift-cards` | `createGiftCard` | — |
| GET | `/business/gift-cards/:id` | `getGiftCard` | — |
| POST | `/business/gift-cards/:id/activate` | `activateGiftCard` | — |
| POST | `/business/gift-cards/:id/cancel` | `cancelGiftCard` | — |
| POST | `/business/gift-cards/:id/refund` | `refundToGiftCard` | — |
| GET | `/business/promotions` | `getPromotions` | Promotion routes |
| POST | `/business/promotions` | `createPromotion` | — |
| GET | `/business/promotions/:id` | `getPromotionById` | — |
| PUT | `/business/promotions/:id` | `updatePromotion` | — |
| DELETE | `/business/promotions/:id` | `deletePromotion` | — |
| POST | `/business/promotions/:id/activate` | `activatePromotion` | — |
| POST | `/business/promotions/:id/pause` | `pausePromotion` | — |
| GET | `/business/promotions/active` | `getActivePromotions` | — |
| GET | `/customer/active` | `(_req, res) => {
  res.json({ success: true, message: 'Get a` | — |
| GET | `/customer/gift-cards/balance/:code` | `checkGiftCardBalance` | Gift Card routes |
| GET | `/customer/gift-cards/mine` | `getMyGiftCards` | — |
| POST | `/customer/gift-cards/redeem` | `redeemGiftCard` | — |
| POST | `/customer/gift-cards/reload` | `reloadGiftCard` | — |
| POST | `/customer/validate` | `(_req, res) => {
  res.json({ success: true, message: 'Valid` | Placeholder routes - implement with DDD controllers |

<!-- GENERATED:ENDPOINTS:END -->
