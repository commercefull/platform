# Order Management & Returns

The order lifecycle after checkout: status transitions, fulfillment,
refunds, notes, returns, and store credit — plus the explainability
endpoint that answers "why did this order price out this way?".
All routes are under `/business`.

## 1. Order lifecycle

| Method | Path                                           | Purpose                  |
| ------ | ---------------------------------------------- | ------------------------ |
| `GET`  | `/business/orders`                             | List orders (filterable) |
| `GET`  | `/business/orders/stats`                       | Aggregate stats          |
| `GET`  | `/business/orders/:orderId`                    | Order detail             |
| `GET`  | `/business/orders/number/:orderNumber`         | Lookup by number         |
| `PUT`  | `/business/orders/:orderId/status`             | Advance order status     |
| `POST` | `/business/orders/:orderId/cancel`             | Cancel (releases stock)  |
| `PUT`  | `/business/orders/:orderId/payment-status`     | Payment status           |
| `PUT`  | `/business/orders/:orderId/fulfillment-status` | Fulfillment status       |

History endpoints (`/history`, `/status-history`, `/payment-history`,
`/fulfillment-history`) return the full audit trail per order.

## 2. Items, packages, notes

| Method | Path                                                     | Purpose              |
| ------ | -------------------------------------------------------- | -------------------- |
| `GET`  | `/business/orders/:orderId/items`                        | Order lines          |
| `POST` | `/business/order-items`                                  | Add a line           |
| `PUT`  | `/business/order-items/:orderItemId`                     | Update a line        |
| `GET`  | `/business/orders/:orderId/packages`                     | Fulfillment packages |
| `POST` | `/business/orders/:orderId/packages`                     | Create package       |
| `POST` | `/business/orders/:orderId/packages/:packageId/tracking` | Update tracking      |
| `GET`  | `/business/orders/:orderId/notes`                        | Internal notes       |
| `POST` | `/business/orders/:orderId/notes`                        | Add note             |

## 3. Refunds

| Method | Path                                | Purpose             |
| ------ | ----------------------------------- | ------------------- |
| `GET`  | `/business/orders/:orderId/refunds` | Refund history      |
| `POST` | `/business/orders/:orderId/refunds` | Create order refund |
| `POST` | `/business/orders/:orderId/refund`  | Process via payment |

Refunds replay against the order's stored `versionSnapshot` and `TaxDecision`
— historical rules apply, not today's configuration.

## 4. Returns workflow & store credit

| Method | Path                                     | Purpose                  |
| ------ | ---------------------------------------- | ------------------------ |
| `GET`  | `/business/returns`                      | List return requests     |
| `POST` | `/business/returns`                      | Create request           |
| `POST` | `/business/returns/:returnId/approve`    | Approve                  |
| `POST` | `/business/returns/:returnId/deny`       | Deny                     |
| `POST` | `/business/returns/:returnId/in-transit` | Mark shipped back        |
| `POST` | `/business/returns/:returnId/received`   | Mark received            |
| `POST` | `/business/returns/:returnId/inspect`    | Complete inspection      |
| `POST` | `/business/returns/:returnId/complete`   | Complete → credit/refund |
| `GET`  | `/business/store-credit/balance`         | Customer credit balance  |
| `GET`  | `/business/store-credit/ledger`          | Credit ledger            |

A `returnRule` row per organization is a market-readiness dimension — a new
market cannot launch without a return policy configured.

## 5. Explainability

`GET /business/orders/:orderId/decisions` returns the order's global context:

- resolved **market** (code, countries, contracting entity)
- `versionSnapshot` — market version, rule versions, pricing/tax engine
- `decisionLog` — ordered `PolicyDecisionRecord`s (promotions, tax, fraud, FX)
- `orderDiscount` / `orderTax` provenance rows and exchange-rate snapshots

Use it for support escalations and compliance audits — it reconstructs
exactly which rules and versions produced the order's totals.
