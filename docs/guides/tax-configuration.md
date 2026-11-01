# Tax Configuration

Zones, rates, categories, exemptions, VAT registrations, and how the tax
engine produces an explainable `TaxDecision` per order. All routes are under
`/business` unless noted.

## Model

```
TaxZone        countries/regions covered by a rate set
TaxRate        percentage applied inside a zone, per category
TaxCategory    product classification (standard, reduced, food, digital…)
TaxExemption   customer-level relief (resale, non-profit…)
VatRegistration  B2B VAT IDs → reverse-charge eligibility
TaxSettings    org-level defaults (display mode, nexus rules)
```

The engine evaluates shipping origin/destination, buyer VAT status, and
product categories to produce a `TaxDecision` — regime (`destination`,
`origin`, `reverse_charge`, `export`, …), jurisdiction, applied rates, and a
`PolicyDecisionRecord` persisted on the order for audit/replay.

## 1. Zones, rates, categories

| Method   | Path                       | Purpose                     |
| -------- | -------------------------- | --------------------------- |
| `GET`    | `/business/tax/zones`      | List tax zones              |
| `POST`   | `/business/tax/zones`      | Create zone (countries[])   |
| `PUT`    | `/business/tax/zones/:id`  | Update zone                 |
| `DELETE` | `/business/tax/zones/:id`  | Delete zone                 |
| `GET`    | `/business/tax/rates`      | List rates                  |
| `POST`   | `/business/tax/rates`      | Create rate                 |
| `PUT`    | `/business/tax/rates/:id`  | Update rate                 |
| `GET`    | `/business/tax/categories` | List product tax categories |
| `POST`   | `/business/tax/categories` | Create category             |

Country membership data (EU/EEA groups, VAT regimes) lives in `libs/geo` —
zones reference ISO alpha-2 codes, never hardcode member lists in code.

## 2. Calculation and exemptions

| Method | Path                                       | Purpose                     |
| ------ | ------------------------------------------ | --------------------------- |
| `POST` | `/business/tax/calculate`                  | Dry-run a line item         |
| `POST` | `/business/tax/calculate/basket/:basketId` | Quote a basket              |
| `POST` | `/business/tax/zones/find`                 | Resolve zone for an address |
| `GET`  | `/business/tax/exemption/:customerId`      | Check exemption status      |
| `GET`  | `/business/tax/settings/:organizationId`   | Org tax settings            |

## 3. Display modes and multi-market behavior

Each `Store`/`Market` declares `taxDisplayMode`:

- `exclusive_tax` — tax added at checkout (US sales tax style)
- `inclusive_tax` — tax embedded in displayed prices (UK/EU VAT style)

B2B buyers with a validated VAT registration get reverse-charge treatment in
intra-EU flows; the decision is recorded per order line. Tax coverage is one
of the 12 market-readiness dimensions — a new market launches only when a
zone covers its selling countries. See [Market Launch](./market-launch.md).

## 4. Explainability

Every order persists `orderTax` rows with the decision record and regime —
inspect them via `GET /business/orders/:orderId/decisions`. Historical
orders replay correctly because the engine version is snapshotted at order
time.
