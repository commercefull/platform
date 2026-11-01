# Inventory & Warehousing

Warehouses, inventory locations, stock transactions, reservations,
transfers, pools, and store dispatches. All routes are under `/business`.

## Model

```
Warehouse            a physical facility (fulfillment or return center)
└── InventoryLocation  a stock-holding location inside it
    └── InventoryItem    stock of a variant (tracked / unlimited / backorderable)
        ├── Reservations   stock held for checkout sessions
        └── Transactions   every stock movement, audited
InventoryPool        a logical shared pool allocations draw from
StoreDispatch        store-to-store replenishment transfer
```

## 1. Warehouses & locations

| Method | Path                                | Purpose               |
| ------ | ----------------------------------- | --------------------- |
| `GET`  | `/business/warehouses`              | List warehouses       |
| `POST` | `/business/warehouses`              | Create warehouse      |
| `PUT`  | `/business/warehouses/:id`          | Update                |
| `POST` | `/business/warehouses/:id/default`  | Set default           |
| `POST` | `/business/warehouses/:id/activate` | Activate              |
| `GET`  | `/business/warehouses/nearest`      | Nearest to an address |
| `GET`  | `/business/inventory/locations`     | List locations        |
| `POST` | `/business/inventory/locations`     | Create location       |

## 2. Stock operations

| Method | Path                                                      | Purpose                    |
| ------ | --------------------------------------------------------- | -------------------------- |
| `POST` | `/business/inventory/locations/:id/adjust`                | Adjust stock (restock etc) |
| `POST` | `/business/inventory/locations/:id/reserve`               | Manual reservation         |
| `POST` | `/business/inventory/locations/:id/release`               | Release reservation        |
| `POST` | `/business/inventory/reservations/:reservationId/confirm` | Confirm reservation        |
| `POST` | `/business/inventory/transfer`                            | Location-to-location move  |
| `GET`  | `/business/inventory/locations/low-stock`                 | Low-stock report           |
| `PUT`  | `/business/inventory/products/:productId/threshold`       | Low-stock threshold        |
| `GET`  | `/business/inventory/transactions/product/:productId`     | Movement audit             |
| `GET`  | `/business/inventory/availability/:sku`                   | Sellable availability      |

Checkout reserves stock atomically against the store's best-stocked
location under a lock — reservations release on abandonment, payment
failure, cancellation, or expiry, and link to order lines.

## 3. Pools & store dispatch

| Method | Path                                          | Purpose                |
| ------ | --------------------------------------------- | ---------------------- |
| `POST` | `/business/inventory/pools`                   | Create a shared pool   |
| `POST` | `/business/inventory/pools/allocate`          | Allocate from pool     |
| `POST` | `/business/inventory/transfer-between-stores` | Cross-store transfer   |
| `GET`  | `/business/dispatches`                        | List store dispatches  |
| `POST` | `/business/dispatches`                        | Create dispatch        |
| `PUT`  | `/business/dispatches/:id/approve`            | Approve                |
| `PUT`  | `/business/dispatches/:id/dispatch`           | Mark dispatched        |
| `PUT`  | `/business/dispatches/:id/receive`            | Receive at destination |

## 4. Variant inventory policy

Each product variant declares a policy on the product record:

- `tracked` — finite stock, overselling prevented
- `unlimited` — digital goods; always purchasable
- `backorderable` — sells below zero, flagged for replenishment

Storefront availability reads from the inventory module, so what customers
see matches what checkout can reserve.
