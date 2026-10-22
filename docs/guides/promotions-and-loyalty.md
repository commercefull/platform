# Promotions, Coupons & Loyalty

The discount and retention toolkit: automatic promotions, coupons, gift
cards, loyalty tiers/rewards, and membership benefits. All routes are under
`/business` unless marked customer-facing.

## 1. Promotions

Promotions are rule-driven (store, channel, country, currency, cart total,
customer group/tier) and apply automatically at checkout.

| Method   | Path                                | Purpose           |
| -------- | ----------------------------------- | ----------------- |
| `GET`    | `/business/promotions`              | List promotions   |
| `GET`    | `/business/promotions/active`       | Active promotions |
| `POST`   | `/business/promotions`              | Create promotion  |
| `PUT`    | `/business/promotions/:id`          | Update promotion  |
| `POST`   | `/business/promotions/:id/activate` | Activate          |
| `POST`   | `/business/promotions/:id/pause`    | Pause             |
| `DELETE` | `/business/promotions/:id`          | Delete            |

Category- and product-scoped variants live under
`/business/category-promotions` and `/business/discounts`.

## 2. Coupons

Coupons are code-redeemed discounts, optionally linked to a promotion
(inheriting its targeting).

| Method | Path                          | Purpose                 |
| ------ | ----------------------------- | ----------------------- |
| `GET`  | `/business/coupons`           | Active coupons          |
| `POST` | `/business/coupons`           | Create coupon           |
| `POST` | `/business/coupons/validate`  | Dry-validate a code     |
| `POST` | `/business/coupons/calculate` | Preview discount amount |
| `GET`  | `/business/coupons/:id/usage` | Usage/redemption report |
| `PUT`  | `/business/coupons/:id`       | Update                  |

## 3. Gift cards

| Method | Path                                | Purpose                |
| ------ | ----------------------------------- | ---------------------- |
| `GET`  | `/business/gift-cards`              | List gift cards        |
| `POST` | `/business/gift-cards`              | Issue a gift card      |
| `POST` | `/business/gift-cards/:id/activate` | Activate               |
| `POST` | `/business/gift-cards/:id/assign`   | Assign to a customer   |
| `POST` | `/business/gift-cards/:id/refund`   | Refund to card balance |
| `POST` | `/business/gift-cards/:id/cancel`   | Cancel                 |

Customers check balance (`GET /customer/.../balance`) and redeem
(`POST /customer/.../redeem`) from the storefront.

## 4. Loyalty

| Method | Path                                                    | Purpose                   |
| ------ | ------------------------------------------------------- | ------------------------- |
| `GET`  | `/business/loyalty/tiers`                               | List tiers                |
| `POST` | `/business/loyalty/tiers`                               | Create tier               |
| `GET`  | `/business/loyalty/rewards`                             | List rewards              |
| `POST` | `/business/loyalty/rewards`                             | Create reward             |
| `GET`  | `/business/loyalty/customers/:customerId/points`        | Customer balance          |
| `POST` | `/business/loyalty/customers/:customerId/points/adjust` | Manual adjustment         |
| `POST` | `/business/loyalty/orders/:orderId/points`              | Award points for an order |

Points can be redeemed at checkout — the reward applies to the session
total, points debit once at payment initiation, and restore on cancel.
Customer endpoints: `GET /loyalty/my-status`, `POST /loyalty/redeem`.

## 5. Provenance

Applied discounts are recorded on the checkout session as structured
`appliedPromotions` (id, type, amount, rule version) and persisted as
`orderDiscount` rows — inspect via `GET /business/orders/:orderId/decisions`.
A market can disable coupons entirely via `MarketCapabilities.coupons`.
