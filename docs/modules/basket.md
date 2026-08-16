# Basket Feature

## Overview

The Basket (Shopping Cart) feature manages customer shopping sessions, allowing items to be added, modified, and removed before checkout. Supports both authenticated customers and anonymous sessions.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-BSK-001 | Get or Create Basket | Customer/Guest | Return an existing basket or create a new one for authenticated or anonymous users |
| UC-BSK-002 | Get My Basket | Customer | Retrieve the authenticated customer's active basket with all items and totals |
| UC-BSK-003 | Get Basket by ID | Customer/Guest | Retrieve a specific basket by ID with real-time pricing calculations |
| UC-BSK-004 | Get Basket Summary | Customer/Guest | Retrieve a lightweight basket summary (item count, totals) for header cart widgets |
| UC-BSK-005 | Add Item to Basket | Customer/Guest | Add a product/variant to the basket, merging duplicates and recalculating totals |
| UC-BSK-006 | Update Item Quantity | Customer/Guest | Change the quantity of a basket item and recalculate line and basket totals |
| UC-BSK-007 | Remove Item from Basket | Customer/Guest | Completely remove an item from the basket and recalculate totals |
| UC-BSK-008 | Clear Basket | Customer/Guest | Remove all items from the basket while keeping the basket itself active |
| UC-BSK-009 | Merge Guest Basket with Customer Basket | Customer | Merge anonymous guest basket items into the customer's basket upon login |
| UC-BSK-010 | Assign Basket to Customer | System/Customer | Associate an anonymous basket with a customer after registration or login |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-BSK-001 | POST | `/basket` |
| UC-BSK-002 | GET | `/basket/me` |
| UC-BSK-003 | GET | `/basket/:basketId` |
| UC-BSK-004 | GET | `/basket/:basketId/summary` |
| UC-BSK-005 | POST | `/basket/:basketId/items` |
| UC-BSK-006 | PATCH | `/basket/:basketId/items/:basketItemId` |
| UC-BSK-007 | DELETE | `/basket/:basketId/items/:basketItemId` |
| UC-BSK-008 | DELETE | `/basket/:basketId/items` |
| UC-BSK-009 | POST | `/basket/:basketId/merge` |
| UC-BSK-010 | POST | `/basket/:basketId/assign` |

---

## Events Emitted

| Event                         | Trigger                  | Payload                         |
| ----------------------------- | ------------------------ | ------------------------------- |
| `basket.created`              | New basket created       | basketId, customerId, sessionId |
| `basket.item_added`           | Item added               | basketId, productId, quantity   |
| `basket.item_removed`         | Item removed             | basketId, productId             |
| `basket.item_updated`         | Quantity changed         | basketId, itemId, quantity      |
| `basket.cleared`              | All items removed        | basketId                        |
| `basket.abandoned`            | Basket expired/abandoned | basketId, value                 |
| `basket.converted_to_order`   | Checkout completed       | basketId, orderId               |
| `basket.merged`               | Baskets merged           | sourceId, targetId              |
| `basket.assigned_to_customer` | Assigned to customer     | basketId, customerId            |

---

## Integration Test Coverage

| Use Case   | Test File               | Status |
| ---------- | ----------------------- | ------ |
| UC-BSK-001 | `basket/basket.test.ts` | ✅     |
| UC-BSK-002 | `basket/basket.test.ts` | ✅     |
| UC-BSK-003 | `basket/basket.test.ts` | ✅     |
| UC-BSK-004 | `basket/basket.test.ts` | 🟡     |
| UC-BSK-005 | `basket/basket.test.ts` | ✅     |
| UC-BSK-006 | `basket/basket.test.ts` | ✅     |
| UC-BSK-007 | `basket/basket.test.ts` | ✅     |
| UC-BSK-008 | `basket/basket.test.ts` | 🟡     |
| UC-BSK-009 | `basket/basket.test.ts` | ❌     |
| UC-BSK-010 | `basket/basket.test.ts` | ❌     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/` | `getBasket` | List/search baskets (admin) |
| GET | `/business/:basketId` | `getBasket` | Get basket by ID |
| DELETE | `/business/:basketId` | `deleteBasket` | Delete basket |
| POST | `/business/:basketId/assign` | `assignToCustomer` | Assign basket to customer |
| POST | `/business/:basketId/coupon` | `applyCoupon` | Apply coupon (admin override) |
| DELETE | `/business/:basketId/coupon` | `removeCoupon` | Remove coupon |
| PUT | `/business/:basketId/expiration` | `extendExpiration` | Extend expiration |
| GET | `/business/:basketId/summary` | `getBasketSummary` | Get basket summary |
| POST | `/customer/basket` | `getOrCreateBasket` | Get or create basket for current user/session
POST /basket |
| GET | `/customer/basket/:basketId` | `getBasket` | Get basket by ID
GET /basket/:basketId |
| DELETE | `/customer/basket/:basketId` | `deleteBasket` | Delete basket
DELETE /basket/:basketId |
| POST | `/customer/basket/:basketId/assign` | `assignToCustomer` | Assign basket to customer
POST /basket/:basketId/assign |
| POST | `/customer/basket/:basketId/coupon` | `applyCoupon` | Apply coupon to basket
POST /basket/:basketId/coupon |
| DELETE | `/customer/basket/:basketId/coupon` | `removeCoupon` | Remove coupon from basket
DELETE /basket/:basketId/coupon |
| PUT | `/customer/basket/:basketId/expiration` | `extendExpiration` | Extend basket expiration
PUT /basket/:basketId/expiration |
| POST | `/customer/basket/:basketId/items` | `addItem` | Add item to basket
POST /basket/:basketId/items |
| DELETE | `/customer/basket/:basketId/items` | `clearBasket` | Clear all items from basket
DELETE /basket/:basketId/items |
| PATCH | `/customer/basket/:basketId/items/:basketItemId` | `updateItemQuantity` | Update item quantity
PATCH /basket/:basketId/items/:basketItemId |
| DELETE | `/customer/basket/:basketId/items/:basketItemId` | `removeItem` | Remove item from basket
DELETE /basket/:basketId/items/:basketItemId |
| POST | `/customer/basket/:basketId/items/:basketItemId/gift` | `setItemAsGift` | Set item as gift
POST /basket/:basketId/items/:basketItemId/gift |
| GET | `/customer/basket/:basketId/summary` | `getBasketSummary` | Get basket summary (lightweight response)
GET /basket/:basketId/summary |
| GET | `/customer/basket/me` | `getMyBasket` | Get current user's basket
GET /basket/me |
| POST | `/customer/basket/merge` | `mergeBaskets` | Merge baskets (typically when guest logs in)
POST /basket/merge |

<!-- GENERATED:ENDPOINTS:END -->
