# Integration Module

## Overview

The Integration module manages third-party system integrations for posting data to external platforms such as marketing automation (Mailchimp, Klaviyo, HubSpot), email notification (SendGrid), accounting (QuickBooks, Xero), and other services (Stripe, Slack, Zapier, custom). It provides secure credential storage with AES-256-GCM encryption, event-driven data dispatch with payload transformation, and a full admin UI for managing integrations, credentials, and event subscriptions.

The integration module is **separate from the webhook module** — webhooks forward raw event payloads to registered endpoints with HMAC signatures, while integrations provide provider-specific, credentialed dispatch with payload mapping and provider endpoint resolution.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-INT-001 | Create Integration | Merchant/Admin | Register a new third-party integration with provider, name, description, webhook URL, and config |
| UC-INT-002 | List Integrations | Merchant/Admin | List all integrations for the organization |
| UC-INT-003 | Get Integration | Merchant/Admin | Retrieve a single integration with details |
| UC-INT-004 | Update Integration | Merchant/Admin | Update integration name, description, or webhook URL |
| UC-INT-005 | Activate Integration | Merchant/Admin | Activate an integration to start dispatching events |
| UC-INT-006 | Deactivate Integration | Merchant/Admin | Deactivate an integration to pause event dispatch |
| UC-INT-007 | Delete Integration | Merchant/Admin | Permanently delete an integration and its credentials, subscriptions, and logs |
| UC-INT-008 | Add Credential | Merchant/Admin | Store encrypted credentials (API key, OAuth token, basic auth, etc.) for an integration |
| UC-INT-009 | List Credentials | Merchant/Admin | List credentials for an integration (encrypted data not exposed) |
| UC-INT-010 | Update Credential | Merchant/Admin | Update credential label, type, or expiration |
| UC-INT-011 | Delete Credential | Merchant/Admin | Remove a credential from an integration |
| UC-INT-012 | Create Subscription | Merchant/Admin | Subscribe an integration to a platform event with target action and payload mapping |
| UC-INT-013 | List Subscriptions | Merchant/Admin | List event subscriptions for an integration |
| UC-INT-014 | Update Subscription | Merchant/Admin | Update subscription target action or active status |
| UC-INT-015 | Delete Subscription | Merchant/Admin | Remove an event subscription from an integration |
| UC-INT-016 | List Logs | Merchant/Admin | View dispatch attempt logs with status, response, and duration |
| UC-INT-017 | Delete Logs | Merchant/Admin | Clear dispatch logs for an integration |
| UC-INT-018 | Dispatch Events | System | Listen to eventBus `*` events, match subscriptions, transform payloads, POST to third-party, log results |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-INT-001 | POST | `/business/integration` |
| UC-INT-002 | GET | `/business/integration` |
| UC-INT-003 | GET | `/business/integration/:integrationId` |
| UC-INT-004 | PUT | `/business/integration/:integrationId` |
| UC-INT-005 | POST | `/business/integration/:integrationId/activate` |
| UC-INT-006 | POST | `/business/integration/:integrationId/deactivate` |
| UC-INT-007 | DELETE | `/business/integration/:integrationId` |
| UC-INT-008 | POST | `/business/integration/:integrationId/credentials` |
| UC-INT-009 | GET | `/business/integration/:integrationId/credentials` |
| UC-INT-010 | PUT | `/business/integration/:integrationId/credentials/:credentialId` |
| UC-INT-011 | DELETE | `/business/integration/:integrationId/credentials/:credentialId` |
| UC-INT-012 | POST | `/business/integration/:integrationId/subscriptions` |
| UC-INT-013 | GET | `/business/integration/:integrationId/subscriptions` |
| UC-INT-014 | PUT | `/business/integration/:integrationId/subscriptions/:subscriptionId` |
| UC-INT-015 | DELETE | `/business/integration/:integrationId/subscriptions/:subscriptionId` |
| UC-INT-016 | GET | `/business/integration/:integrationId/logs` |
| UC-INT-017 | DELETE | `/business/integration/:integrationId/logs` |

### Admin UI Routes

| Method | Path | Description |
|---|---|---|
| GET | `/admin/integrations` | Integration list page |
| GET | `/admin/integrations/create` | Create integration form |
| POST | `/admin/integrations` | Create integration |
| GET | `/admin/integrations/:integrationId` | Integration detail (tabbed: settings, credentials, subscriptions, logs) |
| POST | `/admin/integrations/:integrationId` | Update integration settings |
| POST | `/admin/integrations/:integrationId/activate` | Activate integration |
| POST | `/admin/integrations/:integrationId/deactivate` | Deactivate integration |
| POST | `/admin/integrations/:integrationId/delete` | Delete integration |
| POST | `/admin/integrations/:integrationId/credentials` | Add credential |
| POST | `/admin/integrations/:integrationId/credentials/:credentialId/delete` | Delete credential |
| POST | `/admin/integrations/:integrationId/subscriptions` | Create event subscription |
| POST | `/admin/integrations/:integrationId/subscriptions/:subscriptionId` | Update subscription |
| POST | `/admin/integrations/:integrationId/subscriptions/:subscriptionId/delete` | Delete subscription |

---

## Domain Errors

| Error Class | Code | Status | Description |
|---|---|---|---|
| `IntegrationNotFoundError` | `integration.not_found` | 404 | Integration not found |
| `IntegrationAlreadyExistsError` | `integration.already_exists` | 409 | Integration already exists |
| `CredentialNotFoundError` | `integration.credential_not_found` | 404 | Credential not found |
| `SubscriptionNotFoundError` | `integration.subscription_not_found` | 404 | Event subscription not found |
| `IntegrationError` | `integration.error` | 500 | General integration error |
| `CredentialEncryptionError` | `integration.credential_encryption_error` | 500 | Credential encryption/decryption failed |

---

## Events Emitted

| Event Type | Trigger | Payload |
|---|---|---|
| `integration.created` | New integration created | `{ integrationId, organizationId, provider, name }` |
| `integration.updated` | Integration updated | `{ integrationId, organizationId, changes }` |
| `integration.activated` | Integration activated | `{ integrationId, organizationId }` |
| `integration.deactivated` | Integration deactivated | `{ integrationId, organizationId }` |
| `integration.deleted` | Integration deleted | `{ integrationId, organizationId }` |
| `integration.credential.added` | Credential added | `{ integrationId, credentialId, type }` |
| `integration.credential.updated` | Credential updated | `{ integrationId, credentialId }` |
| `integration.credential.expired` | Credential expired | `{ integrationId, credentialId }` |
| `integration.subscription.created` | Subscription created | `{ integrationId, subscriptionId, eventType }` |
| `integration.subscription.updated` | Subscription updated | `{ integrationId, subscriptionId }` |
| `integration.dispatch.success` | Successful dispatch | `{ integrationId, subscriptionId, eventType, responseStatus, durationMs }` |
| `integration.dispatch.failed` | Failed dispatch | `{ integrationId, subscriptionId, eventType, error }` |

---

## Domain Entities

- **`Integration`** — Aggregate root. Properties: `integrationId`, `organizationId`, `name`, `provider`, `description`, `status` (pending/active/inactive/error), `webhookUrl`, `config` (JSONB), `lastSyncAt`, `lastError`. Domain methods: `activate`, `deactivate`, `update`, `recordSync`, `recordError`, `toJSON`.
- **`IntegrationCredential`** — Encrypted credential. Properties: `credentialId`, `integrationId`, `type` (api_key/oauth_token/basic_auth/webhook_secret/custom), `label`, `encryptedData`, `iv`, `authTag`, `isActive`, `expiresAt`. Domain methods: `activate`, `deactivate`, `isExpired`, `toJSON` (encrypted data excluded).
- **`IntegrationEventSubscription`** — Event-to-action mapping. Properties: `subscriptionId`, `integrationId`, `eventType`, `targetAction`, `description`, `payloadMapping` (JSONB), `headers` (JSONB), `isActive`. Domain methods: `activate`, `deactivate`, `update`, `subscribesToEvent`, `toJSON`.
- **`IntegrationLog`** — Dispatch attempt record. Properties: `logId`, `integrationId`, `subscriptionId`, `eventType`, `targetAction`, `status` (success/failed/retrying), `requestPayload` (JSONB), `responseStatus`, `responseBody`, `errorMessage`, `durationMs`, `createdAt`. Domain methods: `recordSuccess`, `recordFailure`, `recordRetry`, `toJSON`.

## Domain Services

- **`CredentialCrypto`** — AES-256-GCM encryption/decryption using `INTEGRATION_ENCRYPTION_KEY` environment variable (hex-encoded 256-bit key). Provides `encryptCredential` and `decryptCredential` functions.

## Application Services

- **`IntegrationEventDispatcher`** — Listens to eventBus `*` events, finds matching active subscriptions, decrypts credentials, transforms payloads using dot-notation mapping, resolves provider endpoints, sends HTTP POST with auth headers, logs results. Registered at boot via `registerEventHandlers.ts`.

## Repository Ports

- **`IntegrationRepository`** — `create`, `findById`, `findByOrganization`, `findAll`, `update`, `delete`
- **`IntegrationCredentialRepository`** — `create`, `findById`, `findByIntegration`, `findActiveByIntegration`, `update`, `delete`
- **`IntegrationSubscriptionRepository`** — `create`, `findById`, `findByIntegration`, `findByEventType`, `update`, `delete`
- **`IntegrationLogRepository`** — `create`, `findByIntegration`, `findAll`, `delete`

## Provider Contract

`index.ts` exports:
- Repository ports: `IntegrationRepository`, `IntegrationCredentialRepository`, `IntegrationSubscriptionRepository`, `IntegrationLogRepository`
- Domain errors: all error classes listed above
- Domain entities: `Integration`, `IntegrationCredential`, `IntegrationEventSubscription`, `IntegrationLog`

---

## Owned Tables

| Table | Purpose |
|---|---|
| `integration` | Integration registrations with provider, status, config |
| `integrationCredential` | Encrypted credentials for integrations |
| `integrationSubscription` | Event-to-action mappings for integrations |
| `integrationLog` | Dispatch attempt logs |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `INTEGRATION_ENCRYPTION_KEY` | Yes | Hex-encoded 256-bit AES key for credential encryption |

---

## Integration vs Webhook Module

| Aspect | Webhook Module | Integration Module |
|---|---|---|
| **Purpose** | Forward raw events to registered URLs | Provider-specific, credentialed dispatch |
| **Auth** | HMAC-SHA256 signature | Encrypted credentials (API key, OAuth, basic auth) |
| **Payload** | Raw event data as-is | Transformed via payload mapping |
| **Endpoint** | User-provided URL | Provider API endpoint or custom webhook URL |
| **Config** | URL, events, retry policy | Provider, credentials, event subscriptions, payload mapping |
| **Use case** | Generic event forwarding | Marketing automation, email, accounting integration |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|---|---|---|
| UC-INT-001 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-002 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-003 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-004 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-005 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-006 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-007 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-008 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-009 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-011 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-012 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-013 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-015 | `tests/integration/integration/integration.test.ts` | ✅ |
| UC-INT-016 | `tests/integration/integration/integration.test.ts` | ✅ |

---

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| POST | `/business/integration` | `createIntegration` | Create a new integration |
| GET | `/business/integration` | `listIntegrations` | List integrations for organization |
| GET | `/business/integration/:integrationId` | `getIntegration` | Get a single integration |
| PUT | `/business/integration/:integrationId` | `updateIntegration` | Update integration details |
| POST | `/business/integration/:integrationId/activate` | `activateIntegration` | Activate integration |
| POST | `/business/integration/:integrationId/deactivate` | `deactivateIntegration` | Deactivate integration |
| DELETE | `/business/integration/:integrationId` | `deleteIntegration` | Delete integration |
| POST | `/business/integration/:integrationId/credentials` | `addCredential` | Add encrypted credential |
| GET | `/business/integration/:integrationId/credentials` | `listCredentials` | List credentials |
| PUT | `/business/integration/:integrationId/credentials/:credentialId` | `updateCredential` | Update credential |
| DELETE | `/business/integration/:integrationId/credentials/:credentialId` | `deleteCredential` | Delete credential |
| POST | `/business/integration/:integrationId/subscriptions` | `createSubscription` | Create event subscription |
| GET | `/business/integration/:integrationId/subscriptions` | `listSubscriptions` | List event subscriptions |
| PUT | `/business/integration/:integrationId/subscriptions/:subscriptionId` | `updateSubscription` | Update subscription |
| DELETE | `/business/integration/:integrationId/subscriptions/:subscriptionId` | `deleteSubscription` | Delete subscription |
| GET | `/business/integration/:integrationId/logs` | `listLogs` | List dispatch logs |
| DELETE | `/business/integration/:integrationId/logs` | `deleteLogs` | Clear dispatch logs |

<!-- GENERATED:ENDPOINTS:END -->
