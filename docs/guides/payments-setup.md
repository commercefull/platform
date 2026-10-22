# Payments Setup

How to configure payment gateways, payment methods, PSP routing, fraud
screening, and refunds. All routes below are under `/business` unless marked
`/customer`.

## Model

```
PaymentGateway        an integrated PSP (Stripe, Adyen, generic…)
├── MethodConfig      which payment methods the gateway exposes (card, wallet, COD…)
├── PSPRoute          routing rules: country, currency, method → gateway
└── Transaction       initiated payments, captures, refunds
```

`PaymentCapabilityService` decides what can be offered in checkout from the
route's `supportedCountries`, `supportedCurrencies`, and method list — so a
new market only needs route rows, not code.

## 1. Gateways and method configs

| Method | Path                            | Purpose                      |
| ------ | ------------------------------- | ---------------------------- |
| `GET`  | `/business/gateways`            | List gateways                |
| `POST` | `/business/gateways`            | Create a gateway             |
| `PUT`  | `/business/gateways/:gatewayId` | Update credentials/status    |
| `GET`  | `/business/method-configs`      | List payment-method configs  |
| `POST` | `/business/method-configs`      | Enable a method on a gateway |
| `PUT`  | `/business/method-configs/:id`  | Update a method config       |

Gateway credentials are stored server-side — never expose them in responses
or logs.

## 2. Transactions and refunds

| Method  | Path                                            | Purpose                     |
| ------- | ----------------------------------------------- | --------------------------- |
| `GET`   | `/business/transactions`                        | List transactions           |
| `GET`   | `/business/transactions/:transactionId`         | Transaction detail          |
| `POST`  | `/business/transactions/:transactionId/refund`  | Refund (full or partial)    |
| `GET`   | `/business/transactions/:transactionId/refunds` | Refund history              |
| `GET`   | `/business/payment/balance`                     | Gateway balance             |
| `GET`   | `/business/payment/fees`                        | Fee ledger                  |
| `GET`   | `/business/payment/disputes`                    | Disputes / chargebacks      |
| `PATCH` | `/business/payment/disputes/:disputeId`         | Update dispute status       |
| `GET`   | `/customer/payment/transactions`                | Customer's own transactions |

Settlement and FX provenance (`settlementCurrencyCode`, `exchangeRate`,
`settlementAmount`) is persisted on each transaction, so cross-currency
payouts stay explainable.

## 3. Fraud screening

Checkout screens each payment via `ScreenForFraud` before initiation.

| Method | Path                                | Purpose                 |
| ------ | ----------------------------------- | ----------------------- |
| `GET`  | `/business/fraud/rules`             | List fraud rules        |
| `POST` | `/business/fraud/rules`             | Create a rule           |
| `PUT`  | `/business/fraud/rules/:id`         | Update a rule           |
| `GET`  | `/business/fraud/reviews`           | Pending manual reviews  |
| `POST` | `/business/fraud/checks/:id/review` | Approve/decline a check |
| `GET`  | `/business/fraud/blacklist`         | Blacklist entries       |
| `POST` | `/business/fraud/blacklist`         | Add blacklist entry     |

Fraud rules are one of the 12 market-readiness dimensions — a market cannot
launch without at least one configured rule.

## 4. Market-facing surface

`GET /payment/methods` (customer API) returns only the methods a resolved
`CommerceContext` supports — filtered by market, country, currency, and
store. Declaring `paymentMethods` on a `Market` plus a matching PSP route is
all a new market needs; see [Market Launch](./market-launch.md).
