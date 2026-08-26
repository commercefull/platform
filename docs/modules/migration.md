# Migration Module

## Overview

The Migration module provides the staging infrastructure for importing data from external commerce platforms (Shopify, WooCommerce, Magento, BigCommerce, PrestaShop, Shopware, Wix, Squarespace, or custom CSV/API sources). It tracks each import as a job, maintains a mapping table between source-platform IDs and platform-internal IDs, and logs any errors encountered during the process.

This module does **not** perform the actual data transfer. It provides the orchestration layer — job lifecycle, ID mapping, and error tracking — that an external migration tool or connector calls into as it streams records from the source platform into the platform's domain modules.

---

## How It Works

### Import Workflow

```
1. Create Job          →  POST /business/migration/jobs
2. Start Job           →  POST /business/migration/jobs/:id/start
3. Set Total Records   →  (use case: setTotalRecords)
4. For each record:
   a. Import into platform domain module (product, customer, order, etc.)
   b. Record mapping  →  POST /business/migration/jobs/:id/mappings
   c. On success      →  (use case: recordSuccess)
   d. On error        →  POST /business/migration/jobs/:id/errors + (use case: recordError)
   e. On skip         →  (use case: recordSkipped)
5. Complete Job        →  POST /business/migration/jobs/:id/complete
   OR Fail Job        →  POST /business/migration/jobs/:id/fail
```

### Job Lifecycle

```
pending → running → completed
                   → failed
                   → cancelled
         ↑↓ paused (can resume from paused back to running)
```

- **pending**: Job created but not started
- **running**: Import in progress — records being processed
- **paused**: Temporarily halted — can be resumed via `start`
- **completed**: All records processed (success or error)
- **failed**: Fatal error occurred — `errorMessage` set
- **cancelled**: Manually cancelled by operator

### ID Mapping

The `ImportMapping` entity maps source-platform IDs to platform-internal IDs. This allows:
- **Deduplication**: Check if a source record has already been imported (avoid duplicates on re-runs)
- **Lookups**: Find the platform entity for a given source ID (e.g., when importing orders that reference source customer IDs)
- **Rollback**: Identify which platform entities were created by a specific import job

Each mapping records:
- `entityType`: The type of entity (e.g., `"product"`, `"customer"`, `"order"`)
- `sourceId`: The ID in the source platform (e.g., Shopify product ID `123456`)
- `platformId`: The UUID assigned by the platform
- `sourceData`: Optional snapshot of the original source record (JSONB)

### Error Tracking

The `ImportError` entity logs errors encountered during import. Each error records:
- `entityType` and optional `sourceId` — which record failed
- `severity`: `error`, `warning`, or `info`
- `message` and optional `stackTrace` — what went wrong
- `rawData`: Optional snapshot of the source data that caused the error
- `resolvedAt`: Timestamp when an operator marked the error as resolved

Errors can be filtered by severity and resolution status, allowing operators to triage import issues after the job completes.

---

## Public API (`index.ts`)

| Export | Type | Description |
|---|---|---|
| `ImportJob` | Entity | Import job with status lifecycle and progress tracking |
| `ImportMapping` | Entity | Source-to-platform ID mapping |
| `ImportError` | Entity | Import error log entry |
| `MigrationError` | Error | Base migration error |
| `ImportJobNotFoundError` | Error | Job not found (404) |
| `ImportJobAlreadyExistsError` | Error | Duplicate job type for organization (409) |
| `InvalidImportJobError` | Error | Invalid job parameters (400) |
| `ImportMappingNotFoundError` | Error | Mapping not found (404) |
| `ImportErrorNotFoundError` | Error | Error log entry not found (404) |
| `ImportJobNotRunningError` | Error | Job not in running state (409) |
| `ImportJobRepository` | Port | Repository interface for import jobs |
| `ImportMappingRepository` | Port | Repository interface for mappings |
| `ImportErrorRepository` | Port | Repository interface for errors |
| `ImportJobRepositoryImpl` | Infrastructure | PostgreSQL implementation |
| `ImportMappingRepositoryImpl` | Infrastructure | PostgreSQL implementation |
| `ImportErrorRepositoryImpl` | Infrastructure | PostgreSQL implementation |
| `ManageImportJobsUseCase` | Use Case | Job CRUD + lifecycle management |
| `ManageImportMappingsUseCase` | Use Case | Mapping CRUD + lookups |
| `ManageImportErrorsUseCase` | Use Case | Error logging + resolution |

---

## Domain Entities

### ImportJob

| Property | Type | Description |
|---|---|---|
| `importJobId` | `string` | UUID |
| `organizationId` | `string` | Owning organization |
| `jobType` | `ImportJobType` | What to import (see below) |
| `source` | `ImportSource` | Source platform (see below) |
| `status` | `ImportJobStatus` | Current lifecycle state |
| `sourceStoreUrl` | `string?` | Source store URL |
| `sourceApiKey` | `string?` | API key for source platform |
| `sourceConfig` | `Record?` | Additional source-specific config |
| `stats` | `ImportJobStats` | Progress counters |
| `startedAt` | `Date?` | When job started running |
| `completedAt` | `Date?` | When job completed/failed/cancelled |
| `errorMessage` | `string?` | Error message if failed |
| `dryRun` | `boolean` | If true, validate only — don't write data |
| `autoActivate` | `boolean` | If true, activate imported entities automatically |
| `metadata` | `Record?` | Arbitrary metadata |
| `createdAt` / `updatedAt` | `Date` | Timestamps |

**ImportJobType**: `full`, `products`, `customers`, `orders`, `categories`, `collections`, `inventory`, `coupons`, `tax_rates`, `shipping_zones`, `reviews`, `gift_cards`, `customer_groups`, `cms_pages`, `returns`, `brands`, `custom`

**ImportSource**: `shopify`, `woocommerce`, `magento`, `bigcommerce`, `prestashop`, `shopware`, `wix`, `squarespace`, `csv`, `api`, `custom`

**ImportJobStats**: `{ totalRecords, processedRecords, successCount, errorCount, skippedCount }`

**Key methods**: `start()`, `pause()`, `cancel()`, `complete()`, `fail(msg)`, `setTotalRecords(n)`, `recordSuccess()`, `recordError()`, `recordSkipped()`, `progress` (computed percentage)

### ImportMapping

| Property | Type | Description |
|---|---|---|
| `importMappingId` | `string` | UUID |
| `importJobId` | `string` | Parent import job |
| `entityType` | `string` | Entity type (e.g., `"product"`, `"customer"`) |
| `sourceId` | `string` | ID in source platform |
| `platformId` | `string` | UUID in platform |
| `sourceData` | `Record?` | Snapshot of source record |
| `metadata` | `Record?` | Arbitrary metadata |
| `createdAt` / `updatedAt` | `Date` | Timestamps |

**Unique constraint**: `(importJobId, entityType, sourceId)` — prevents duplicate mappings within a job.

### ImportError

| Property | Type | Description |
|---|---|---|
| `importErrorId` | `string` | UUID |
| `importJobId` | `string` | Parent import job |
| `entityType` | `string` | Entity type that failed |
| `sourceId` | `string?` | Source ID (if known) |
| `severity` | `ImportErrorSeverity` | `error`, `warning`, or `info` |
| `message` | `string` | Error message |
| `stackTrace` | `string?` | Stack trace (if available) |
| `rawData` | `Record?` | Source data that caused the error |
| `resolvedAt` | `Date?` | When operator resolved the error |
| `createdAt` | `Date` | When error was logged |

**Key methods**: `resolve()`, `isResolved` (computed)

---

## Domain Errors

| Error | Code | Status |
|---|---|---|
| `MigrationError` | `migration.error` | 500 |
| `ImportJobNotFoundError` | `migration.job_not_found` | 404 |
| `ImportJobAlreadyExistsError` | `migration.job_already_exists` | 409 |
| `InvalidImportJobError` | `migration.invalid_job` | 400 |
| `ImportMappingNotFoundError` | `migration.mapping_not_found` | 404 |
| `ImportErrorNotFoundError` | `migration.error_not_found` | 404 |
| `ImportJobNotRunningError` | `migration.job_not_running` | 409 |

---

## Events

| Direction | Events |
|---|---|
| Publishes | `migration.job.created`, `migration.job.started`, `migration.job.completed`, `migration.job.failed`, `migration.job.cancelled`, `migration.record.imported`, `migration.record.skipped`, `migration.record.error` |
| Subscribes | _(none)_ |

---

## Tables

| Table | Description |
|---|---|
| `importJob` | Import jobs with status, stats, source config |
| `importMapping` | Source-to-platform ID mappings (unique per job+entity+sourceId) |
| `importError` | Error log entries with severity and resolution tracking |

### Database Schema

**`importJob`**

| Column | Type | Notes |
|---|---|---|
| `importJobId` | UUID PK | |
| `organizationId` | UUID FK → `organization` | CASCADE on delete |
| `jobType` | varchar(50) | |
| `source` | varchar(50) | |
| `status` | enum | `pending`, `running`, `completed`, `failed`, `cancelled`, `paused` |
| `sourceStoreUrl` | varchar(500) | |
| `sourceApiKey` | varchar(500) | |
| `sourceConfig` | JSONB | |
| `stats` | JSONB | Default: `{totalRecords: 0, processedRecords: 0, successCount: 0, errorCount: 0, skippedCount: 0}` |
| `startedAt` | timestamp | |
| `completedAt` | timestamp | |
| `errorMessage` | text | |
| `dryRun` | boolean | Default: `false` |
| `autoActivate` | boolean | Default: `true` |
| `metadata` | JSONB | |
| `createdAt` / `updatedAt` | timestamp | |

Indexes: `organizationId`, `jobType`, `status`, `source`, `createdAt`

**`importMapping`**

| Column | Type | Notes |
|---|---|---|
| `importMappingId` | UUID PK | |
| `importJobId` | UUID FK → `importJob` | CASCADE on delete |
| `entityType` | varchar(100) | |
| `sourceId` | varchar(255) | |
| `platformId` | UUID | |
| `sourceData` | JSONB | |
| `metadata` | JSONB | |
| `createdAt` / `updatedAt` | timestamp | |

Indexes: `importJobId`, `entityType`, `sourceId`, `platformId`
Unique: `(importJobId, entityType, sourceId)`

**`importError`**

| Column | Type | Notes |
|---|---|---|
| `importErrorId` | UUID PK | |
| `importJobId` | UUID FK → `importJob` | CASCADE on delete |
| `entityType` | varchar(100) | |
| `sourceId` | varchar(255) | |
| `severity` | enum | `error`, `warning`, `info` |
| `message` | text | |
| `stackTrace` | text | |
| `rawData` | JSONB | |
| `resolvedAt` | timestamp | |
| `createdAt` | timestamp | |

Indexes: `importJobId`, `entityType`, `severity`, `createdAt`

---

## Routes

All routes are mounted under `/business/migration` and require organization authentication (`isOrganizationLoggedIn`).

### Import Jobs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/business/migration/jobs` | Create a new import job |
| GET | `/business/migration/jobs` | List jobs (filter by `status`, `jobType`) |
| GET | `/business/migration/jobs/:importJobId` | Get job details |
| POST | `/business/migration/jobs/:importJobId/start` | Start a pending or paused job |
| POST | `/business/migration/jobs/:importJobId/complete` | Mark job as completed |
| POST | `/business/migration/jobs/:importJobId/fail` | Mark job as failed (body: `errorMessage`) |
| POST | `/business/migration/jobs/:importJobId/pause` | Pause a running job |
| POST | `/business/migration/jobs/:importJobId/cancel` | Cancel a job |
| DELETE | `/business/migration/jobs/:importJobId` | Delete a job |

### Import Mappings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/business/migration/jobs/:importJobId/mappings` | List mappings (filter by `entityType`) |
| POST | `/business/migration/jobs/:importJobId/mappings` | Create a mapping |
| GET | `/business/migration/jobs/:importJobId/mappings/lookup` | Lookup mapping by `entityType` + `sourceId` |

### Import Errors

| Method | Endpoint | Description |
|---|---|---|
| GET | `/business/migration/jobs/:importJobId/errors` | List errors (filter by `severity`, `resolved`) |
| POST | `/business/migration/errors/:importErrorId/resolve` | Mark an error as resolved |

---

## Use Cases

### ManageImportJobsUseCase

| Method | Description |
|---|---|
| `createJob(params)` | Create a new import job (status: `pending`) |
| `getJob(id)` | Get job by ID (throws `ImportJobNotFoundError` if not found) |
| `listJobs(orgId, filters?)` | List jobs for an organization |
| `startJob(id)` | Transition to `running` |
| `completeJob(id)` | Transition to `completed` |
| `failJob(id, msg)` | Transition to `failed` with error message |
| `pauseJob(id)` | Transition to `paused` |
| `cancelJob(id)` | Transition to `cancelled` |
| `setTotalRecords(id, count)` | Set the total record count for progress tracking |
| `recordSuccess(id)` | Increment success counter |
| `recordError(id)` | Increment error counter |
| `recordSkipped(id)` | Increment skipped counter |
| `deleteJob(id)` | Delete a job |

### ManageImportMappingsUseCase

| Method | Description |
|---|---|
| `createMapping(params)` | Create a new source-to-platform mapping |
| `getMapping(id)` | Get mapping by ID |
| `findByJobAndSource(jobId, entityType, sourceId)` | Lookup mapping by source ID |
| `findByJob(jobId, entityType?)` | List all mappings for a job |
| `findByPlatformId(entityType, platformId)` | Reverse lookup: platform ID → source |
| `deleteByJob(jobId)` | Delete all mappings for a job |

### ManageImportErrorsUseCase

| Method | Description |
|---|---|
| `createError(params)` | Log a new import error |
| `getError(id)` | Get error by ID |
| `findByJob(jobId, filters?)` | List errors for a job (filter by severity/resolved) |
| `resolveError(id)` | Mark an error as resolved |
| `deleteByJob(jobId)` | Delete all errors for a job |

---

## Module Manifest

| Property | Value |
|---|---|
| Name | `migration` |
| Requirement | `optional` |
| Depends on | `identity`, `organization` |
| Feature flag | `module.migration.enabled` |
| GraphQL | Disabled |

---

## Integration Notes

- **External migration tool**: The migration tool (a separate application) calls these API endpoints to orchestrate the import. It creates a job, processes records from the source platform, creates mappings and errors as it goes, and updates job stats.
- **Dry run mode**: When `dryRun=true`, the migration tool should validate source data without writing to platform domain tables. Mappings and errors are still recorded for reporting.
- **Auto-activate**: When `autoActivate=true`, imported entities should be set to active status immediately. When `false`, entities are created in a draft/inactive state for review.
- **Re-runs**: The mapping table enables idempotent re-runs. The migration tool can check `findByJobAndSource` before importing a record to skip already-imported items.
- **Rollback**: To roll back an import, find all mappings via `findByJob`, delete the corresponding platform entities, then delete the job (which cascades to mappings and errors).
