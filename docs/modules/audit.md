# Audit Module

## Overview

The Audit module provides immutable audit logging capabilities for the platform. It records actor actions, resource changes, and system events with hash-chain integrity for tamper detection.

---

## Public API (`index.ts`)

| Export | Type | Description |
|---|---|---|
| `AuditLog` | Entity | Immutable audit log entry with actor, action, resource, hash-chain fields |
| `AuditRepository` | Port | Repository interface for writing/querying audit logs |
| `AuditErrors` | Errors | Domain error classes (`AuditLogNotFoundError`, etc.) |
| `AuditAction` | Enum | Enumeration of auditable actions |

---

## Domain Entities

| Entity | Description |
|---|---|
| `AuditLog` | Immutable record with `auditLogId`, `organizationId`, `actorId`, `actorType`, `category`, `outcome`, `severity`, `resourceName`, `previousState`, `newState`, `metadata`, hash-chain fields (`previousHash`, `hash`) |

## Domain Errors

| Error | Code | Status |
|---|---|---|
| `AuditLogNotFoundError` | `audit.not_found` | 404 |
| `AuditValidationError` | `audit.validation_error` | 400 |

## Events

| Direction | Events |
|---|---|
| Publishes | (none — audit is a sink) |
| Subscribes | (subscribes to all platform events for recording) |

## Tables

| Table | Description |
|---|---|
| `auditLog` | Immutable audit log entries with hash-chain integrity |

## Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/business/audit` | List audit logs with filtering |
| GET | `/business/audit/:id` | Get a specific audit log entry |
