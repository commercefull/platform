# Module Stability Checklist

> A module may be marked **stable** only when **all** of the following hold.
> This is the gate for Phase 3 module-by-module work and for marking any module "done".

## Checklist

1. **Structure** — has `domain/`, `application/`, `infrastructure/`, `interface/`; no `services/` directory; exports a curated `index.ts`.

2. **Ports** — at least one `domain/repositories/*Repository.ts` interface; every infrastructure repository implements one.

3. **Isolation** — zero imports from another module's `infrastructure/`; zero foreign domain-model imports; every cross-module need expressed as a shared-kernel type, an ACL port injected at the composition root, or a subscribed domain event.

4. **ACL compliance** — every outbound dependency has a consumer-owned port, a translating adapter, a contract test, and a row in the dependency register; outbound port count ≤ 5.

5. **Provider contract** — the module's `index.ts` publishes the surface its consumers' adapters translate from, and that surface is documented in `docs/modules/<name>.md`.

6. **Layering** — `domain` imports nothing but `domain`; `application` imports `domain` + ports only; `interface` imports `application` + `domain` only.

7. **Web parity** — no `web/` controller touches this module's repositories; all admin/storefront paths go through use cases.

8. **Transactions** — every multi-write use case has an explicit transaction boundary.

9. **Errors** — has `domain/errors/<Module>Errors.ts`; every failure is a typed domain error with a stable `code`, `statusCode` and `severity`; no `throw new Error('...')`; no empty `catch` blocks; no `message.includes(...)` status derivation; no hand-rolled controller `try/catch` (central boundary only).

10. **Observability** — no expected `4xx` outcome logged at `error`; all logs structured with an operation name + correlation ID; no `console.*`; error codes published in `docs/modules/<name>.md`.

11. **Events** — emitted events are declared and documented; the module's `EventType` entries all actually fire.

12. **Tests** — unit tests for every use case (happy + one failure path), integration tests for every route, ≥ 70% coverage on `application` + `domain`.

13. **Data** — owned tables documented; migrations attributable to the module; camelCase, parameterised SQL only.

14. **Docs** — `docs/modules/<name>.md` exists and matches reality.

## Usage

- Run this checklist against each module during its Phase 3 wave.
- A module is **not** stable until every box is checked.
- Once stable, add a regression test that asserts the structural invariants (layering, no `services/` dir, `index.ts` exports) so stability does not silently erode.
