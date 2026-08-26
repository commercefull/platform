# CommerceFull

> E-commerce platform — Admin, Storefront, Customer API & Business API

CommerceFull is a modular e-commerce platform built with Express 5, TypeScript, and PostgreSQL. It follows a DDD architecture with 42 bounded contexts, server-rendered EJS views, and REST + GraphQL APIs.

## Explore

- **[Getting Started](#/guides/getting-started)** — set up your dev environment
- **[Adding a New Module](#/guides/adding-a-module)** — step-by-step guide for engineers
- **[Module Registry & Feature Flags](#/guides/module-registry)** — toggle modules on/off
- **[Architecture Overview](#/architecture/overview)** — system design, module map, boot sequence
- **[API Reference](#/generated/api-reference)** — interactive OpenAPI explorer
- **[Configuration](#/guides/configuration)** — environment variables
- **[Engineering Standards](#/guidelines/modules-ddd)** — coding conventions
- **[Module Specs](#/modules/product)** — per-module documentation

## Key Features

- **Storefront** — server-rendered product browsing, cart, checkout, account
- **Admin Panel** — full platform management (Tabler UI)
- **Customer API** — JWT-authenticated REST + GraphQL at `/customer`
- **Business API** — merchant management at `/business`
- **42 Modules** — product, order, basket, checkout, payment, fulfillment, shipping, inventory, coupon, promotion, loyalty, membership, subscription, tracking, audit, integration, automation, returns, theme, page builder, segment, marketplace, webhook, SSO/SCIM, and more
- **Durable Event Bus** — transactional outbox with at-least-once delivery, dead-letter queue, and retry
- **Module Registry** — feature-flag any of 36 optional modules via env vars or DB-backed provider
- **Internationalization** — 15+ locales via i18next
- **Performance Testing** — k6 smoke, load, stress, and spike tests

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+, TypeScript 5.x |
| Framework | Express 5 |
| Database | PostgreSQL 18, Knex migrations, raw SQL via `pg` |
| Event Bus | Transactional outbox with `FOR UPDATE SKIP LOCKED` dispatcher |
| Admin UI | EJS + Tabler |
| Storefront UI | EJS + Tailwind CSS |
| Payments | Stripe |
| Testing | Jest, k6 |
| Docs | Docsify + OpenAPI/Swagger UI |
