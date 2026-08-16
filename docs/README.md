# CommerceFull

> E-commerce platform — Admin, Storefront, Customer API & Business API

CommerceFull is a modular e-commerce platform built with Express 5, TypeScript, and PostgreSQL. It follows a DDD architecture with 36 bounded contexts, server-rendered EJS views, and REST + GraphQL APIs.

## Explore

- **[Getting Started](#/guides/getting-started)** — set up your dev environment
- **[Architecture Overview](#/architecture/overview)** — system design and module map
- **[API Reference](#/generated/api-reference)** — interactive OpenAPI explorer
- **[Configuration](#/guides/configuration)** — environment variables
- **[Engineering Standards](#/guidelines/modules-ddd)** — coding conventions
- **[Module Specs](#/modules/product)** — per-module documentation

## Key Features

- **Storefront** — server-rendered product browsing, cart, checkout, account
- **Admin Panel** — full platform management (Tabler UI)
- **Customer API** — JWT-authenticated REST + GraphQL at `/customer`
- **Business API** — merchant management at `/business`
- **36 Modules** — product, order, basket, checkout, payment, fulfillment, shipping, inventory, coupon, promotion, loyalty, membership, subscription, and more
- **Internationalization** — 15+ locales via i18next
- **Performance Testing** — k6 smoke, load, stress, and spike tests

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+, TypeScript 5.x |
| Framework | Express 5 |
| Database | PostgreSQL 18, Knex migrations, raw SQL via `pg` |
| Admin UI | EJS + Tabler |
| Storefront UI | EJS + Tailwind CSS |
| Payments | Stripe |
| Testing | Jest, k6 |
| Docs | Docsify + OpenAPI/Swagger UI |
