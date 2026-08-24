# Configuration Module

## Overview

The Configuration module manages system-wide configuration settings and feature flags. It supports hierarchical configuration scoping (global, store, organization, channel) with inheritance, system mode management (marketplace, multi-store, single-store), and feature flag toggling with rollout percentage and conditions.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-CFG-001 | Create System Configuration | Admin | Create a new system configuration entry with platform settings and system mode |
| UC-CFG-002 | Update System Configuration | Admin | Update an existing system configuration's platform settings, features, security, notifications, integrations, or metadata |
| UC-CFG-003 | Get System Configuration | Admin | Retrieve a specific system configuration by ID |
| UC-CFG-004 | Get Active System Configuration | Admin | Retrieve the currently active system configuration |
| UC-CFG-005 | List System Configurations | Admin | List all system configurations |
| UC-CFG-006 | Get Configuration Value | System | Retrieve a configuration value by key with scope inheritance (falls back to parent scopes) |
| UC-CFG-007 | Get Feature Flags | System | List feature flags with optional scope and disabled filtering |
| UC-CFG-008 | Toggle Feature Flag | Admin | Enable or disable a feature flag with optional rollout percentage and conditions |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-CFG-001 | POST | `/business/configuration` |
| UC-CFG-002 | PUT | `/business/configuration/:configId` |
| UC-CFG-003 | GET | `/business/configuration/:configId` |
| UC-CFG-004 | GET | `/business/configuration/active` |
| UC-CFG-005 | GET | `/business/configuration` |

> **Note**: UC-CFG-006, UC-CFG-007, and UC-CFG-008 are internal use cases not yet exposed via HTTP endpoints.

---

## Domain Errors

| Error Class | Code | Status | Description |
|---|---|---|---|
| `ConfigurationNotFoundError` | `configuration.not_found` | 404 | Configuration key or ID not found |
| `InvalidConfigurationValueError` | `configuration.invalid_value` | 400 | Invalid value for a configuration key |
| `ConfigurationKeyRequiredError` | `configuration.key_required` | 400 | Configuration key is missing |
| `ConfigurationValidationError` | `configuration.validation_error` | 400 | General validation error |

---

## Events Emitted

The configuration module does not currently emit domain events.

---

## Domain Entities

- **`SystemConfiguration`** — Aggregate root managing platform settings, features, organization settings, security settings, notification settings, and integration settings. Supports system mode changes (`marketplace`, `multi_store`, `single_store`) with automatic feature adjustment.

## Repository Ports

- **`SystemConfigurationRepository`** — `findById`, `findActive`, `save`, `delete`, `findAll`, `count`

## Provider Contract

`index.ts` exports:
- Use cases: `GetConfigurationUseCase`, `GetFeatureFlagsUseCase`, `ToggleFeatureFlagUseCase`, `UpdateSystemConfigurationUseCase`
- Repository port: `SystemConfigurationRepository`
- Domain errors: `ConfigurationNotFoundError`, `InvalidConfigurationValueError`, `ConfigurationKeyRequiredError`, `ConfigurationValidationError`

---

## Owned Tables

| Table | Purpose |
|---|---|
| `systemConfiguration` | System configuration records |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|---|---|---|
| UC-CFG-001 | — | ❌ |
| UC-CFG-002 | — | ❌ |
| UC-CFG-003 | — | ❌ |
| UC-CFG-004 | — | ❌ |
| UC-CFG-005 | — | ❌ |
| UC-CFG-006 | — | ❌ |
| UC-CFG-007 | — | ❌ |
| UC-CFG-008 | — | ❌ |

> **Note**: No integration tests exist yet for this module.

---

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| POST | `/business/configuration` | `createSystemConfiguration` | Create system configuration |
| PUT | `/business/configuration/:configId` | `updateSystemConfiguration` | Update system configuration |
| GET | `/business/configuration/active` | `getActiveSystemConfiguration` | Get active system configuration |
| GET | `/business/configuration/:configId` | `getSystemConfiguration` | Get system configuration by ID |
| GET | `/business/configuration` | `listSystemConfigurations` | List all system configurations |

<!-- GENERATED:ENDPOINTS:END -->
