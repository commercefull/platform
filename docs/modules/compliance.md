# Compliance Module

## Overview

The Compliance module provides SOC2 audit logging, key rotation policy management, and CCPA data subject request (DSR) processing.

---

## Public API (`index.ts`)

| Export | Type | Description |
|---|---|---|
| `AuditLog` | Entity | Immutable audit log entry with hash-chain integrity |
| `CcpaDataSubjectRequest` | Entity | CCPA DSR with type, status, verification |
| `KeyRotationPolicy` | Entity | Key rotation schedule and history |
| `AuditLogRepository` | Port | Repository interface for audit logs |
| `CcpaDsrRepository` | Port | Repository interface for DSR records |
| `KeyRotationPolicyRepository` | Port | Repository interface for key rotation policies |
| `ComplianceErrors` | Errors | Domain error classes |
| `soc2ControlCatalogue` | Service | SOC2 control definitions and mapping |

---

## Domain Entities

| Entity | Description |
|---|---|
| `AuditLog` | `auditLogId`, `organizationId`, `actorId`, `actorType`, `category`, `outcome`, `severity`, `resourceName`, `previousState`, `newState`, `metadata`, hash-chain fields |
| `CcpaDataSubjectRequest` | `ccpaDsrId`, `organizationId`, `customerEmail`, `requestType` (access/delete/opt-out), `status` (pending/verified/in_progress/completed/denied), `verificationToken`, timestamps |
| `KeyRotationPolicy` | `keyRotationPolicyId`, `organizationId`, `keyIdentifier`, `rotationIntervalDays`, `lastRotatedAt`, `nextRotationAt`, `status` (active/disabled) |

## Domain Errors

| Error | Code | Status |
|---|---|---|
| `ComplianceValidationError` | `compliance.validation_error` | 400 |
| `AuditLogNotFoundError` | `compliance.audit_not_found` | 404 |
| `DsrNotFoundError` | `compliance.dsr_not_found` | 404 |
| `KeyRotationNotFoundError` | `compliance.key_rotation_not_found` | 404 |

## Events

| Direction | Events |
|---|---|
| Publishes | `compliance.audit_log.created`, `compliance.key_rotation.scheduled`, `compliance.key_rotation.completed`, `compliance.ccpa.dsr_created`, `compliance.ccpa.dsr_completed` |
| Subscribes | (none) |

## Tables

| Table | Description |
|---|---|
| `auditLog` | Immutable audit log entries with SOC2 columns and hash-chain |
| `keyRotationPolicy` | Key rotation schedules and history |
| `ccpaDsr` | CCPA data subject request records |

## Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/business/compliance/audit` | List audit logs |
| GET | `/business/compliance/audit/:id` | Get audit log entry |
| GET | `/business/compliance/key-rotation` | List key rotation policies |
| POST | `/business/compliance/key-rotation` | Create key rotation policy |
| GET | `/business/compliance/ccpa/dsr` | List DSR records |
| POST | `/business/compliance/ccpa/dsr` | Create DSR record |
| PUT | `/business/compliance/ccpa/dsr/:id` | Update DSR status |
