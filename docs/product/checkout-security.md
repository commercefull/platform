# Checkout Security — PCI Compliance Without Sandbox Lock-in

> **The one-line answer:** CommerceFull is SAQ A-EP compliant — card data never touches the platform. PSP-hosted iframes (Stripe Elements, Adyen Drop-in) collect card input, tokenise it, and return only an opaque token. You control the checkout code; the PSP handles the card.

---

## How It Works

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

---

## The Difference

| | Shopify | CommerceFull |
|---|---|---|
| **Checkout control** | Sandboxed — scripts/pixels stripped on non-Plus (Aug 26, 2026) | Full control — you own the checkout code |
| **Card data handling** | PSP-hosted iframe (SAQ A-EP) | PSP-hosted iframe (SAQ A-EP) — same standard |
| **Custom scripts/pixels** | Blocked on non-Plus; requires Plus ($2,000+/mo) | No restrictions — run any script, pixel, or GTM container |
| **PCI scope** | SAQ A-EP | SAQ A-EP — identical compliance, no extra burden |
| **PSP choice** | Stripe, Shop Pay, limited others | Stripe, Adyen, PayPal, Klarna, Apple Pay, Affirm — any PSP |

---

## Why This Is Secure Without Sandboxing

Shopify sandboxes checkout to *reduce their PCI scope and control the script surface*. CommerceFull achieves the same PCI compliance through tokenisation — the platform never receives, processes, or stores Primary Account Numbers (PAN). The security boundary is at the PSP iframe, not at a checkout sandbox.

**What the platform handles:** PSP-issued tokens, last 4 digits (display only), card brand, expiry, transaction IDs.

**What the platform never handles:** PAN, CVV/CVC, track data, cardholder name on card.

---

## Compliance Documentation

- Full PCI-DSS SAQ boundary documentation: [compliance/pci-dss-saq-boundary.md](../compliance/pci-dss-saq-boundary.md)
- Tokenisation assertion tests: `modules/payment/compliance/tokenisationAssertions.test.ts`
- Key rotation policy: 90-day rotation for webhook secrets, API keys, and HMAC signing keys

## Supported PSPs

CommerceFull's payment failover system supports multiple PSPs with circuit breakers and health checks:

- Stripe
- Adyen
- PayPal
- Klarna
- Apple Pay
- Affirm

Add any PSP by implementing the `PaymentGatewayAdapter` interface — no platform modification needed.
