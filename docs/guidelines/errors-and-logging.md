# Errors & Logging Guidelines

> Severity policy, domain error rules, and the RFC 7807 target shape for CommerceFull.
> Source: §6 of the gap analysis. This document is the normative reference for all modules.

## 1. Log Level Severity Policy

| Level | Meaning | Alert? | Examples |
|---|---|---|---|
| `error` | **The system failed to keep a promise.** Unexpected, actionable, someone must look | **Yes** | DB connection lost, unhandled exception, PSP returned 5xx, event handler crashed, data-integrity violation, migration failure |
| `warn` | Recoverable degradation, fallback taken, or a condition that will become an error if it persists | Threshold/rate-based | Retry succeeded on attempt 3, no default warehouse so fulfilment deferred, cache miss storm, deprecated endpoint used, ACL provider unavailable and fallback applied |
| `info` | Significant business milestones and state transitions | No | Order placed, refund issued, subscription cancelled, config changed, admin action (also audited) |
| `debug` | Developer detail for local/verbose diagnosis | No | Query shapes, computed pricing steps, event payloads |

### Explicitly NOT `error`

These are correct system behaviour and must be `info` or `debug`, or not logged at all:

- Entity not found (`404`) — the single largest category
- Validation failure (`400`) — the client sent bad input; the system worked
- Unauthenticated / forbidden (`401`/`403`) — authorisation working as designed (log at `warn` only for rate-based brute-force detection)
- Conflict / duplicate (`409`) — an enforced invariant, i.e. a success
- Business-rule rejection — coupon expired, basket expired, insufficient stock, card declined
- Optimistic-concurrency retry that then succeeds

**Rule**: if the outcome maps to a `4xx`, it is **not** an `error`. Only `5xx` and genuine internal faults are.

## 2. Domain Errors

`modules/basket/domain/errors/BasketErrors.ts` is the reference pattern.

### Target base class (`libs/errors.ts`)

```
AppError                       // existing: message, statusCode, details
  + code: string               // stable, e.g. 'customer.not_found'
  + severity: 'error'|'warn'|'info'   // drives log level, set once at definition
  + isExpected: boolean        // derived — true for 4xx
```

### Rules

1. **Every module gets `domain/errors/<Module>Errors.ts`** with an abstract module base extending `AppError`.
2. **Every domain error declares its own `code`, `statusCode` and `severity`.** Severity is decided once, at the error definition — never at the call site.
3. **Domain errors carry data, not prose.** `new CustomerNotFoundError(customerId)` composes its own message; callers never string-match.
4. **Codes are a public API contract** — namespaced `<module>.<condition>`, documented per module, and covered by a test asserting they do not change. Client SDKs branch on `code`, never on `message`.
5. **No `throw new Error('...')` in `domain/` or `application/`.** Lint-enforced.
6. **`libs/errors.ts` keeps only generic transport errors**; anything with business meaning belongs to a module.

## 3. Error Boundary

- Build a single Express error middleware that: maps `AppError.statusCode`, logs at `error.severity`, attaches the correlation ID, and emits RFC 7807.
- Add an `asyncHandler` wrapper so controllers `throw` and stop hand-rolling `try/catch`. **Target: delete ~1,300 catch blocks**, keeping only those that add genuine recovery.
- Mirror the same mapping in the GraphQL layer via a `formatError` hook so REST and GraphQL report identical codes.
- `process.on('uncaughtException')` and `('unhandledRejection')` handlers must exist.

## 4. RFC 7807 Problem Details

Current shape: `{ success: false, error: { message, statusCode } }` — no code, no correlation ID, not a standard.

### Target shape

```json
{
  "type": "https://docs.commercefull.com/errors/customer.not_found",
  "title": "Customer not found",
  "status": 404,
  "detail": "No customer exists with ID 8f3a...",
  "instance": "/customer/profile",
  "code": "customer.not_found",
  "correlationId": "01J8...",
  "errors": [{ "field": "email", "code": "invalid_format" }]
}
```

- Add the problem-details serialiser to `libs/apiResponse.ts`; keep the legacy shape behind a deprecation window.
- Emit `Content-Type: application/problem+json`.
- Publish the error catalogue at the documented `type` URLs, generated from the registered domain errors.
- Never return internal `error.message` verbatim; `detail` is a deliberately authored, safe string.

## 5. Structured Logging & Correlation

- Use `libs/logger` — never `console.*` in production code.
- Default level: `info` in production, `debug` in development.
- Structured calls: `logger.error('payment.capture_failed', { orderId, gateway, err })` — not `logger.error('Error:', error)`.
- Correlation ID via `AsyncLocalStorage`, set per request, auto-attached to every log line, returned in the response and in problem details, and propagated through events and webhook deliveries.
- Redact PII and secrets in a formatter (emails, tokens, card fields, addresses).
- Define alerting on `error` **rate** once severity is trustworthy.

## 6. Lint Rules (Phase 1: `warn`, Phase 2+: `error`)

- `no-console` — already enforced; `console.*` only in `scripts/` and `jobs/`.
- Reject bare `'Error:'`-style log messages (structured logging).
- `no-throw-literal` / `no-throw-new-error` in `domain/` and `application/`.
- Flag empty `catch` blocks.
- Flag `message.includes(...)` for status derivation.

## 7. Migration Sequencing

1. **Phase 0** (done): fix logger levels, service name, `app.ts` handler, process handlers.
2. **Phase 1** (this document): publish guideline; add lint rules as `warn`.
3. **Phase 2**: central error middleware + `asyncHandler` + RFC 7807 alongside legacy shape.
4. **Per module, in Phase 3 wave**: add `domain/errors/`, delete `catch` blocks, remove `message.includes`, ratchet lint rules to `error`.
5. **Phase 4**: correlation IDs through durable event bus and webhook deliveries; alerting thresholds.
