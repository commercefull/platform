# PCI-DSS SAQ Boundary — CommerceFull Platform

## Scope

CommerceFull is a **SAQ A-EP** environment. The platform never receives, processes, or stores Primary Account Numbers (PAN). All cardholder data interaction is delegated to PCI-DSS-certified third-party payment service providers (PSPs) via tokenisation.

## Architecture

```
Customer Browser
    │
    ▼
┌──────────────────────────────────┐
│  CommerceFull Platform           │
│  (SAQ A-EP scope)                │
│                                  │
│  ┌─────────────┐  ┌───────────┐  │
│  │ Checkout    │  │ Payment   │  │
│  │ Module      │──│ Module    │  │
│  │             │  │           │  │
│  │ Sends token │  │ Sends     │  │
│  │ to PSP via  │  │ token +   │  │
│  │ redirect/   │  │ amount    │  │
│  │ iframe      │  │ to PSP    │  │
│  └─────────────┘  └───────────┘  │
│                                  │
│  NO PAN storage                  │
│  NO card data in DB              │
│  NO card data in logs            │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  PSP (Stripe / Adyen / PayPal)   │
│  (PCI-DSS Level 1 certified)     │
│                                  │
│  Hosts card input (iframe/SDK)   │
│  Tokenises card data             │
│  Processes payment               │
│  Returns token to platform       │
└──────────────────────────────────┘
```

## What CommerceFull DOES handle

- **Payment method tokens** — PSP-issued opaque tokens (e.g. `pm_1AbCdE...`, `tok_abc123`)
- **Last 4 digits** — For display purposes only (e.g. "Visa ending in 4242")
- **Card brand** — Visa, Mastercard, Amex, etc.
- **Expiry month/year** — For display ("expires 12/2026")
- **PSP transaction IDs** — For reconciliation and refund processing

## What CommerceFull does NOT handle

- **PAN** — Full card numbers are never transmitted to or stored by the platform
- **CVV/CVC** — Never transmitted to or stored by the platform
- **Track data** — Never received
- **Cardholder name on card** — Never received (customer name from checkout is separate)

## SAQ A-EP Requirements Addressed

| Requirement | Status | Implementation |
|---|---|---|
| 3.4 — PAN is masked or tokenised | ✅ | Only PSP tokens stored; last 4 digits for display |
| 4.1 — Strong cryptography in transit | ✅ | TLS 1.2+ enforced; HSTS headers; no mixed content |
| 6.5 — Secure coding practices | ✅ | Parameterised SQL only; input validation; ESLint security rules |
| 8.2 — Unique user IDs | ✅ | Identity module enforces unique emails; no shared accounts |
| 10.1 — Audit logs | ✅ | Audit log module (Phase 7.2) records all payment operations |
| 12.3 — Key-rotation policy | ✅ | Key-rotation module (below) enforces 90-day rotation |

## Tokenisation Flow

1. Customer enters card data in PSP-hosted iframe/SDK (Stripe Elements, Adyen Drop-in)
2. PSP tokenises card data and returns a `paymentMethodToken` to the browser
3. Browser sends `paymentMethodToken` + order details to CommerceFull checkout API
4. CommerceFull payment module forwards token + amount to PSP for processing
5. PSP returns transaction result (success/failed) + `externalTransactionId`
6. CommerceFull stores: token, externalTransactionId, last4, brand, expiry — never PAN

## Assertion Tests

Tokenisation-only assertion tests are in:
- `modules/payment/compliance/tokenisationAssertions.test.ts`

These tests verify at the code level that:
- No field in any payment entity, repository, or DTO contains PAN
- `PaymentRequest` only accepts `paymentMethodToken`, never card fields
- `PaymentTransaction` entity stores only last4/brand/expiry, never full card numbers
- Database migrations for payment tables do not include PAN columns
- Logger output never includes card-related sensitive fields

## Key-Rotation Policy

Key-rotation is managed by:
- `modules/compliance/domain/entities/KeyRotationPolicy.ts`
- `modules/compliance/application/useCases/ManageKeyRotation.ts`

Default rotation schedule:
- Payment webhook secrets: 90 days
- API keys (PSP configs): 90 days
- JWT signing keys: 30 days
- HMAC signing keys: 90 days

---

**Last Updated**: August 2026
**Review Cycle**: Quarterly
**Owner**: Platform Engineering
