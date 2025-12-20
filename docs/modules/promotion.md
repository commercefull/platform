# Promotion Feature

## Overview

The Promotion feature manages discounts, coupons, gift cards, and promotional campaigns. It supports various discount types including percentage, fixed amount, buy-X-get-Y, and cart-level promotions.

---

## Use Cases

### Promotions (Business)

### UC-PRO-001: List Promotions (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request promotions  
**Then** the system returns all promotional campaigns

#### API Endpoint
```
GET /business/promotions
Query: status?, type?, limit, offset
```

---

### UC-PRO-002: Create Promotion (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid promotion configuration  
**When** they create a promotion  
**Then** the promotion is created

#### API Endpoint
```
POST /business/promotions
Body: {
  name, description,
  promotionType: 'percentage'|'fixed'|'buy_x_get_y'|'free_shipping',
  discountValue,
  conditions: {
    minOrderAmount?, productIds?, categoryIds?,
    customerGroups?, dateRange?, usageLimit?
  },
  isActive
}
```

#### Business Rules
- Various promotion types supported
- Can apply conditions (min order, specific products, etc.)
- Can have usage limits
- Can be scheduled with date ranges

---

### UC-PRO-003: Get Promotion (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/promotions/:promotionId
```

---

### UC-PRO-004: Update Promotion (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/promotions/:promotionId
```

---

### UC-PRO-005: Delete Promotion (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/promotions/:promotionId
```

---

### UC-PRO-006: Activate Promotion (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a paused/inactive promotion  
**When** they activate it  
**Then** the promotion becomes active

#### API Endpoint
```
POST /business/promotions/:promotionId/activate
```

---

### UC-PRO-007: Pause Promotion (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/promotions/:promotionId/pause
```

---

### Gift Cards (Business)

### UC-PRO-008: List Gift Cards (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request gift cards  
**Then** the system returns all gift cards

#### API Endpoint
```
GET /business/promotions/gift-cards
Query: status?, limit, offset
```

---

### UC-PRO-009: Get Gift Card (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/promotions/gift-cards/:id
```

---

### UC-PRO-010: Create Gift Card (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid gift card data  
**When** they create a gift card  
**Then** the gift card is generated

#### API Endpoint
```
POST /business/promotions/gift-cards
Body: {
  initialBalance,
  expiresAt?,
  recipientEmail?,
  recipientName?,
  personalMessage?,
  isActive
}
```

#### Business Rules
- Unique code is generated
- Can be physical or digital
- Optional expiration date
- Can be sent to recipient via email

---

### UC-PRO-011: Activate Gift Card (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an inactive gift card  
**When** it is activated  
**Then** it can be used for purchases

#### API Endpoint
```
POST /business/promotions/gift-cards/:id/activate
```

---

### UC-PRO-012: Refund to Gift Card (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** a return/refund situation  
**When** refunding to gift card  
**Then** the gift card balance is increased

#### API Endpoint
```
POST /business/promotions/gift-cards/:id/refund
Body: { amount, reason }
```

---

### UC-PRO-013: Cancel Gift Card (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
POST /business/promotions/gift-cards/:id/cancel
Body: { reason }
```

---

### Coupons (Customer)

### UC-PRO-014: Apply Coupon (Customer)
**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** a customer with items in cart  
**And** a valid coupon code  
**When** they apply the coupon  
**Then** the discount is applied to the cart

#### API Endpoint
```
POST /checkout/coupon
Body: { code }
```

#### Business Rules
- Validates coupon exists and is active
- Checks conditions (min order, eligible products)
- Checks usage limits
- Only one coupon per order (configurable)

---

### UC-PRO-015: Remove Coupon (Customer)
**Actor:** Customer  
**Priority:** Medium

#### API Endpoint
```
DELETE /checkout/coupon
```

---

### Gift Card Usage (Customer)

### UC-PRO-016: Check Gift Card Balance (Customer)
**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** a gift card code  
**When** checking the balance  
**Then** the current balance is returned

#### API Endpoint
```
GET /gift-cards/:code/balance
```

---

### UC-PRO-017: Apply Gift Card (Customer)
**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** a customer at checkout  
**And** a valid gift card  
**When** they apply the gift card  
**Then** the balance is applied to the order

#### API Endpoint
```
POST /checkout/gift-card
Body: { code }
```

#### Business Rules
- Partial redemption supported
- Remaining balance available for future orders
- Can combine with other payment methods

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `promotion.created` | Promotion created | promotionId, type |
| `promotion.activated` | Promotion activated | promotionId |
| `promotion.paused` | Promotion paused | promotionId |
| `promotion.used` | Promotion applied to order | promotionId, orderId, discount |
| `coupon.created` | Coupon created | couponId, code |
| `coupon.redeemed` | Coupon used | couponId, orderId |
| `giftcard.created` | Gift card created | giftCardId |
| `giftcard.activated` | Gift card activated | giftCardId |
| `giftcard.redeemed` | Gift card used | giftCardId, amount, orderId |
| `giftcard.refunded` | Refund to gift card | giftCardId, amount |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-PRO-001 to UC-PRO-007 | `promotion/promotion.test.ts` | 🟡 |
| UC-PRO-008 to UC-PRO-013 | `promotion/giftcard.test.ts` | ❌ |
| UC-PRO-014 to UC-PRO-015 | `promotion/coupon.test.ts` | 🟡 |
| UC-PRO-016 to UC-PRO-017 | `promotion/giftcard-customer.test.ts` | ❌ |
