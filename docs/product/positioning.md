# Why CommerceFull

> **Own your store. Not just rent it.**
>
> Your data. Your checkout. Your rules. Your exit.

---

## The Problem

Every merchant eventually hits the same wall with the two dominant platforms:

### Shopify — Convenience, at a cost

1. **Checkout is sandboxed.** Non-Plus stores had legacy scripts, pixels, and GTM containers stripped automatically on August 26, 2026, breaking ad tracking with no warning.
2. **Data lives on Shopify's servers** with limited export.
3. **App tax compounds.** Loyalty, subscriptions, membership — each requires a separate paid app ($500–2,000+/mo stacked).
4. **Deep checkout customization requires Shopify Plus** ($2,000+/mo).

### WooCommerce — Control, alone

1. **No single vendor to call** when something breaks — you're stuck between your hosting provider, a plugin developer, and forums.
2. **Plugin conflicts** cause unpredictable breakage — blank checkout, missing emails, vanishing products.
3. **Performance degrades** as plugins and inventory pile up over time.
4. **Security is diffused** — most serious vulnerabilities live in the plugin ecosystem, not the core.
5. **Poor trust signal** — low independent review ratings tied to maintenance complaints.

**The insight:** Shopify's failure mode is *lock-in*. WooCommerce's failure mode is *abandonment*. CommerceFull solves both without inheriting either.

---

## The Five Pillars

| Pillar | The Problem It Solves | The Commitment |
|---|---|---|
| **Your Data** | Shopify's lock-in | Self-hosted, fully exportable, never held hostage |
| **Your Checkout** | Shopify's pixel/script sandbox | No restrictions — scripts run because you control the code |
| **Your Cost** | Shopify's app tax | Loyalty, subscriptions, membership, compliance built in natively |
| **Your Stability** | WooCommerce's plugin fragility | Native modules built to work together by design |
| **Your Support** | WooCommerce's "figure it out yourself" | Real support included at every tier, not just managed |

---

## Three Ways to Run It

Each tier preserves full data and code ownership.

### 1. Self-Hosted

Free, open-source core platform. Full ownership. **Support included** — no forum-hunting required. This is what fixes WooCommerce's core weakness.

### 2. Managed Hosting

Separate agreement. We run infrastructure, updates, and uptime. You retain data and code ownership. This is what competes with Shopify's convenience without the lock-in.

### 3. Tailored Development

Custom-built modules and workflows for specific business needs — compliance, unique loyalty logic, bespoke integrations. This is where "tailor-made" becomes a credible, provable claim rather than a vague headline.

---

## Comparison

| Dimension | Shopify | WooCommerce | CommerceFull |
|---|---|---|---|
| **Data ownership** | Limited export, lives on their servers | Full, but fragile | Full, self-hosted, fully exportable |
| **Checkout control** | Sandboxed (Plus for customization) | Full, but plugin-fragile | Full, no restrictions |
| **App cost** | Stacked paid apps ($500–2,000+/mo) | Free plugins, but maintenance cost | Loyalty, subscriptions, membership built in |
| **Stability** | High (managed) | Degrades with plugins | Native modules, designed together |
| **Support** | Tiered, Plus-only for real support | Forums and community | Included at every tier |
| **Migration** | Hard to leave | Easy to leave, hard to maintain | Your choice of who maintains it |

---

## Who It's For

- **New and growing merchants** evaluating platforms from scratch
- **Merchants actively trying to leave Shopify** — already paying for Plus or stacking apps, price-sensitive to platform tax, searching for alternatives

---

## The Evidence

Each pillar is backed by provable documentation — not just claims.

### Your Cost — the app tax, quantified

A full Shopify DTC app stack runs $300–$800/month near $1M revenue and $2,500–$6,000/month near $10M. CommerceFull ships loyalty, subscriptions, membership, reviews, returns, analytics, and compliance natively — zero app tax.

→ [Cost comparison with real Shopify app pricing](./cost-comparison.md)

### Your Exit — a real migration path

The migration module supports imports from Shopify, WooCommerce, Magento, BigCommerce, and 7 other sources. Full job lifecycle, ID mapping, error tracking, and deduplication. Step-by-step Shopify migration guide with API examples and a cutover checklist.

→ [Migrating from Shopify](../guides/migrating-from-shopify.md) · [Migration module reference](../modules/migration.md)

### Your Checkout — secure without sandboxing

SAQ A-EP compliant — same PCI standard as Shopify. Card data never touches the platform; PSP-hosted iframes (Stripe Elements, Adyen Drop-in) handle tokenisation. The difference: you control the checkout code. No script stripping, no Plus paywall for pixels.

→ [Checkout security and PCI compliance](./checkout-security.md) · [PCI-DSS SAQ boundary](../compliance/pci-dss-saq-boundary.md)

### Tailored Development — ownership without lock-in

Apache-2.0 core. Bespoke modules are standard TypeScript + PostgreSQL + Express — no proprietary runtime, no license server, no phone-home. Full source delivered. You own it, you can port it, you can hire anyone to maintain it.

→ [Tailored development ownership guarantees](./tailored-development.md)
