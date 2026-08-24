# Reporting Module

## Overview

The Reporting module provides scheduled report generation and on-demand report execution. It supports eight standard report types (sales summary, product performance, customer summary, inventory, tax, order detail, payment, fulfillment) with configurable schedules, multiple output formats (PDF, Excel, CSV, HTML), and delivery to specified recipients.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-RPT-001 | Generate Report | Merchant/Admin | Generate a report on-demand with a report type and parameters |
| UC-RPT-002 | Get Report Templates | Merchant/Admin | List all available report templates with required/optional parameters |
| UC-RPT-003 | Create Report Schedule | Merchant/Admin | Create a scheduled report with frequency, parameters, recipients, and format |
| UC-RPT-004 | List Report Schedules | Merchant/Admin | List report schedules optionally filtered by organization |
| UC-RPT-005 | Get Report Schedule | Merchant/Admin | Retrieve a specific report schedule by ID |
| UC-RPT-006 | Update Report Schedule | Merchant/Admin | Update a report schedule's name, frequency, parameters, recipients, format, or active status |
| UC-RPT-007 | Delete Report Schedule | Merchant/Admin | Delete a report schedule by ID |
| UC-RPT-008 | List Report Executions | Merchant/Admin | List execution history for a specific report schedule |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-RPT-001 | POST | `/business/reports/generate` |
| UC-RPT-002 | GET | `/business/reports/templates` |
| UC-RPT-003 | POST | `/business/reports/schedules` |
| UC-RPT-004 | GET | `/business/reports/schedules` |
| UC-RPT-005 | GET | `/business/reports/schedules/:scheduleId` |
| UC-RPT-006 | PUT | `/business/reports/schedules/:scheduleId` |
| UC-RPT-007 | DELETE | `/business/reports/schedules/:scheduleId` |
| UC-RPT-008 | GET | `/business/reports/schedules/:scheduleId/executions` |

---

## Domain Errors

| Error Class | Code | Status | Description |
|---|---|---|---|
| `ReportScheduleNotFoundError` | `reporting.schedule_not_found` | 404 | Report schedule not found |
| `ReportExecutionNotFoundError` | `reporting.execution_not_found` | 404 | Report execution not found |
| `ReportNotFoundError` | `reporting.report_not_found` | 404 | Report not found |
| `InvalidScheduleFrequencyError` | `reporting.invalid_frequency` | 400 | Invalid schedule frequency |
| `ReportGenerationFailedError` | `reporting.generation_failed` | 500 | Report generation failed |
| `FailedToCreateScheduleError` | `reporting.schedule_creation_failed` | 500 | Failed to create report schedule |
| `FailedToCreateExecutionError` | `reporting.execution_creation_failed` | 500 | Failed to create report execution |
| `UnknownReportTypeError` | `reporting.unknown_report_type` | 400 | Unknown report type |

---

## Events Emitted

The reporting module does not currently emit domain events.

---

## Domain Entities

- **`ReportScheduleProps`** — Schedule definition with report type, frequency (daily/weekly/monthly/quarterly/yearly), parameters, recipients, format, and active status.
- **`ReportExecutionProps`** — Execution record with status (pending/running/completed/failed), timing, file URL, and error info.
- **`ReportData`** — Generated report data with summary, rows, and metadata.
- **`ReportTemplate`** — Template definition with required/optional parameters and default format.
- **`REPORT_TEMPLATES`** — Constant map of all 8 report type templates.

## Repository Ports

- **`ReportingRepository`** — `createSchedule`, `findScheduleById`, `listSchedules`, `listActiveSchedules`, `updateSchedule`, `deleteSchedule`, `markScheduleRun`, `createExecution`, `updateExecution`, `listExecutions`, `findExecutionById`, `generateReport`

## Provider Contract

`index.ts` exports:
- Repository port: `ReportingRepository`
- Domain errors: all error classes listed above

> **Note**: Use cases are not exported from `index.ts` yet. They are available via `application/useCases/index.ts`.

---

## Owned Tables

| Table | Purpose |
|---|---|
| `reportingReportSchedule` | Report schedule definitions |
| `reportingReportExecution` | Report execution history records |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|---|---|---|
| UC-RPT-001 | — | ❌ |
| UC-RPT-002 | — | ❌ |
| UC-RPT-003 | — | ❌ |
| UC-RPT-004 | — | ❌ |
| UC-RPT-005 | — | ❌ |
| UC-RPT-006 | — | ❌ |
| UC-RPT-007 | — | ❌ |
| UC-RPT-008 | — | ❌ |

> **Note**: No integration tests exist yet for this module.

---

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| POST | `/business/reports/generate` | `generateReport` | Generate a report on-demand |
| GET | `/business/reports/templates` | `getReportTemplates` | List available report templates |
| GET | `/business/reports/schedules` | `listSchedules` | List report schedules |
| POST | `/business/reports/schedules` | `createSchedule` | Create a report schedule |
| GET | `/business/reports/schedules/:scheduleId` | `getSchedule` | Get a report schedule by ID |
| PUT | `/business/reports/schedules/:scheduleId` | `updateSchedule` | Update a report schedule |
| DELETE | `/business/reports/schedules/:scheduleId` | `deleteSchedule` | Delete a report schedule |
| GET | `/business/reports/schedules/:scheduleId/executions` | `listExecutions` | List executions for a schedule |

<!-- GENERATED:ENDPOINTS:END -->
