# Tailored Development — Ownership Without Lock-in

> **The concern:** Does custom development quietly recreate the lock-in you left Shopify to escape?
>
> **The answer:** No. CommerceFull is Apache-2.0 licensed. Bespoke modules are yours — full source, full ownership, full portability. The platform cannot revoke, restrict, or meter your access to code you paid to build.

---

## How Tailored Development Works

Tailored development is the third tier in CommerceFull's offering:

1. **Self-Hosted** — free, open-source core, support included
2. **Managed Hosting** — we run infrastructure, you own data and code
3. **Tailored Development** — custom-built modules for specific business needs

Tailored development produces new modules that follow the same DDD architecture as the 43 built-in modules. Each module is:

- **Self-contained** — follows the `domain → application → infrastructure → interface` layer structure
- **Independently deployable** — no hidden coupling to other modules (enforced by dependency-cruiser)
- **Standard PostgreSQL** — uses the same Knex migration system and parameterised SQL patterns
- **Standard TypeScript** — no proprietary framework, no platform-specific DSL

---

## Ownership Guarantees

| Question | Answer |
|---|---|
| Who owns the bespoke code? | **You do.** Work is delivered under your choice of license. |
| Can the platform revoke access? | **No.** The core platform is Apache-2.0. Bespoke modules are separate works. |
| Can you take the code to another platform? | **Yes.** It's standard TypeScript + PostgreSQL + Express. No proprietary runtime. |
| Can you modify the code yourself? | **Yes.** Full source is delivered. No obfuscation, no compiled binaries. |
| Is there a dependency on CommerceFull's servers? | **No.** Self-hosted means self-hosted. No phone-home, no license server, no telemetry requirement. |
| Can you hire another team to maintain it? | **Yes.** The codebase follows documented DDD conventions (see [AGENTS.md](../../AGENTS.md) and [engineering standards](../guidelines/README.md)). |

---

## How Lock-in Is Prevented

### 1. Open-source core

The platform itself is Apache-2.0. You can fork it, audit it, and run it forever — no vendor can pull the license.

### 2. Standard technology stack

| Layer | Technology | Proprietary? |
|---|---|---|
| Language | TypeScript | No |
| Framework | Express 5 | No |
| Database | PostgreSQL 18 | No |
| Migrations | Knex | No |
| Build | esbuild | No |
| Templates | EJS | No |
| CSS | Tailwind | No |

There is no CommerceFull-specific runtime, DSL, or proprietary abstraction layer. A developer who knows Node.js, TypeScript, and PostgreSQL can work with the codebase.

### 3. Module isolation

Dependency-cruiser enforces module boundaries at build time. Custom modules cannot create hidden coupling to other modules' internals — they communicate through documented ACL ports. This means a bespoke module can be removed or replaced without breaking the rest of the platform.

### 4. Data portability

All data lives in standard PostgreSQL tables with documented schemas. No proprietary data formats, no encrypted-at-rest-by-vendor storage, no API-only access to your own data. You can export everything via SQL.

---

## What Tailored Development Does NOT Include

- No proprietary frameworks or libraries you must license to run the code
- No compiled or obfuscated deliverables
- No dependency on CommerceFull's infrastructure to function
- No "managed runtime" that only CommerceFull can operate
- No contractual lock-in to ongoing maintenance payments

Tailored development is a service engagement, not a subscription. Once delivered, the code is yours.
