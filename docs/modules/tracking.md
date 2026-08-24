# Tracking Module

The tracking module provides consent-gated server-side tracking with GTM Server container and Meta Conversions API (CAPI) support. It subscribes to the platform event bus and routes e-commerce events to configured tracking providers, respecting GDPR cookie consent.

## Overview

- **Module path**: `modules/tracking`
- **Route prefix**: `/business/tracking`
- **Auth**: `isOrganizationLoggedIn`
- **Dependency**: `gdpr` (for consent checking)
- **Requirement**: Optional (toggleable in module manifest)

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-TRK-001 | Manage Tracking Config | Admin | Create, update, activate/deactivate tracking configuration for a store |
| UC-TRK-002 | Process Tracking Event | System | Route a platform event to configured tracking providers after consent check |
| UC-TRK-003 | Get Tracking Status | Admin | Check tracking configuration status and provider health |
| UC-TRK-004 | Manage Event Mappings | Admin | Configure which platform events map to which provider-specific event names |
| UC-TRK-005 | Manage GTM Config | Admin | Configure Google Tag Manager Server-Side container settings |
| UC-TRK-006 | Manage Meta CAPI Config | Admin | Configure Meta Conversions API settings including PII hashing |

## API Endpoints

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/tracking/config` | `trackingController.getConfig` | Get tracking configuration |
| POST | `/business/tracking/config` | `trackingController.createConfig` | Create tracking configuration |
| PUT | `/business/tracking/config` | `trackingController.updateConfig` | Update tracking configuration |
| DELETE | `/business/tracking/config` | `trackingController.deleteConfig` | Delete tracking configuration |
| POST | `/business/tracking/config/activate` | `trackingController.activateConfig` | Activate tracking |
| POST | `/business/tracking/config/disable` | `trackingController.disableConfig` | Disable tracking |
| GET | `/business/tracking/status` | `trackingController.getStatus` | Get tracking status |
| PUT | `/business/tracking/config/gtm` | `trackingController.updateGtmConfig` | Update GTM Server config |
| PUT | `/business/tracking/config/meta-capi` | `trackingController.updateMetaCapiConfig` | Update Meta CAPI config |
| GET | `/business/tracking/config/event-mappings` | `trackingController.getEventMappings` | Get event mappings |
| PUT | `/business/tracking/config/event-mappings` | `trackingController.updateEventMappings` | Update event mappings |
| POST | `/business/tracking/config/hash-pii` | `trackingController.setHashPii` | Toggle PII hashing |
| POST | `/business/tracking/config/server-side` | `trackingController.setServerSide` | Toggle server-side tracking |
| POST | `/business/tracking/process-event` | `trackingController.processEvent` | Manually process a tracking event |

## Domain Entities

### TrackingConfig

Per-store tracking configuration (`modules/tracking/domain/entities/TrackingConfig.ts`):

- `configId`, `organizationId`, `storeId`
- `gtmConfig`: GTM Server-Side container config (container URL, measurement ID, API secret)
- `metaCapiConfig`: Meta Conversions API config (pixel ID, access token, test event code, API version)
- `eventMappings`: Map of platform event types to provider-specific event names
- `hashPii`: Whether to SHA-256 hash PII before sending (default: true)
- `serverSideEnabled`: Whether server-side tracking is active (default: true)
- `isActive`: Lifecycle flag
- `createdAt`, `updatedAt`

### TrackingEvent

Normalized tracking event (`modules/tracking/domain/entities/TrackingEvent.ts`):

- `eventId`, `eventType`, `organizationId`, `storeId`
- `userId`, `email`, `phone` (PII fields, hashed if hashPii enabled)
- `ecommerceData`: Product/order data for e-commerce events
- `consentContext`: User's consent state for analytics/marketing/thirdParty
- `providerRouting`: Which providers should receive this event

## Domain Errors

All errors defined in `modules/tracking/domain/errors/TrackingErrors.ts`:

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `TrackingValidationError` | `tracking.validation_error` | 400 | Configuration validation error |
| `TrackingConfigNotFoundError` | `tracking.config_not_found` | 404 | Tracking config not found for store |
| `TrackingConfigAlreadyExistsError` | `tracking.config_already_exists` | 409 | Tracking config already exists for store |
| `TrackingProviderError` | `tracking.provider_error` | 502 | Error from tracking provider (GTM or Meta) |
| `TrackingConsentNotGrantedError` | `tracking.consent_not_granted` | 403 | User has not granted consent for the required category |
| `TrackingEventNotMappedError` | `tracking.event_not_mapped` | 404 | Platform event has no mapping to provider event |

## Tracking Adapters

### GTM Server-Side Adapter

`modules/tracking/domain/services/GTMServerAdapter.ts`

- Sends events to GTM Server-Side container via GA4 Measurement Protocol
- Builds payload with client ID, event name, event parameters
- Validates container URL, measurement ID, and API secret

### Meta Conversions API Adapter

`modules/tracking/domain/services/MetaCAPIAdapter.ts`

- Sends events to Meta Graph API Conversions endpoint
- SHA-256 hashes PII (email, phone) before sending when `hashPii` is enabled
- Supports test event code for validation
- Validates pixel ID, access token, and API version

### Default Event Mappings

`modules/tracking/domain/services/defaultEventMappings.ts`

| Platform Event | Provider Event Name | Consent Category |
|---|---|---|
| `order.paid` | `Purchase` | analytics |
| `checkout.started` | `InitiateCheckout` | analytics |
| `checkout.completed` | `CompleteCheckout` | analytics |
| `basket.item_added` | `AddToCart` | analytics |
| `basket.item_removed` | `RemoveFromCart` | analytics |
| `product.viewed` | `ViewContent` | analytics |
| `product.list_viewed` | `ViewItemList` | analytics |
| `product.searched` | `Search` | analytics |
| `customer.registered` | `CompleteRegistration` | marketing |
| `order.refunded` | `Refund` | analytics |

## Event Bus Integration

The module subscribes to 10 platform events via `modules/tracking/application/eventHandlers/trackingEventHandlers.ts`:

1. Checks if tracking is active for the organization
2. Checks GDPR consent for the required category
3. Builds a `TrackingEvent` from the platform event
4. Routes to each enabled adapter (GTM, Meta CAPI)
5. Fire-and-forget: tracking errors never break the main request flow

## Database

| Table | Description |
|---|---|
| `trackingConfig` | Per-store tracking configuration with JSONB columns for GTM config, Meta CAPI config, and event mappings |

**Migration**: `migrations/20260824100005_createTrackingConfigTable.js`

## Events Published

| Event Type | Description |
|---|---|
| `tracking.config.created` | Tracking config created |
| `tracking.config.updated` | Tracking config updated |
| `tracking.config.activated` | Tracking activated |
| `tracking.config.disabled` | Tracking disabled |
| `tracking.event.processed` | Event successfully sent to providers |
| `tracking.event.failed` | Event failed to send to one or more providers |
| `tracking.event.consent_blocked` | Event blocked due to missing consent |
| `tracking.event.unmapped` | Event had no mapping and was skipped |

## Key Design Decisions

- **Consent gating**: Events are only sent when the user has granted consent for the required category (analytics/marketing/thirdParty) via the GDPR cookie consent repository
- **PII hashing**: SHA-256 hashing of email and phone before sending to Meta CAPI (configurable per store)
- **Dual provider support**: Each store can configure GTM Server-Side, Meta CAPI, or both
- **Fire-and-forget**: Tracking errors never break the main request flow (error boundary in event handler)
- **Default mappings**: 10 standard e-commerce events pre-mapped out of the box

## Tests

- `TrackingConfig.test.ts` — 24 tests (create, reconstitute, event mappings, shouldSendToProvider, getConsentCategory, lifecycle, provider management, toJSON)
- `TrackingAdapters.test.ts` — 12 tests (GTM send/validate, Meta CAPI send/validate, TrackingEvent consent gating + PII hashing)
- **Total**: 36 tests pass
