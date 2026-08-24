# Segment Module

## Overview

The Segment module provides customer data platform (CDP) capabilities — customer profiles with LTV/frequency/behaviour aggregates, dynamic segment definitions, and membership tracking.

---

## Public API (`index.ts`)

| Export | Type | Description |
|---|---|---|
| `SegmentDefinition` | Entity | Dynamic segment with conditions and membership rules |
| `CustomerProfile` | Entity | Aggregated customer profile with metrics |
| `ConditionEvaluator` | Service | Evaluates segment conditions against profiles |
| `SegmentRepository` | Port | Repository interface |
| `SegmentErrors` | Errors | Domain error classes |

---

## Domain Entities

| Entity | Description |
|---|---|
| `SegmentDefinition` | `segmentId`, `organizationId`, name, description, conditions[], status (active/paused/archived), memberCount |
| `CustomerProfile` | `customerProfileId`, `customerId`, `organizationId`, LTV, orderCount, lastOrderAt, avgOrderValue, tags[], segments[] |

## Domain Errors

| Error | Code | Status |
|---|---|---|
| `SegmentNotFoundError` | `segment.not_found` | 404 |
| `SegmentValidationError` | `segment.validation_error` | 400 |
| `CustomerProfileNotFoundError` | `segment.profile_not_found` | 404 |

## Events

| Direction | Events |
|---|---|
| Publishes | `segment.member_added`, `segment.member_removed` |
| Subscribes | `order.created`, `order.completed`, `customer.registered` |

## Tables

| Table | Description |
|---|---|
| `segmentDefinition` | Segment definitions with conditions and status |
| `segmentMembership` | Membership records linking customers to segments |
| `customerProfile` | Aggregated customer profiles with metrics |

## Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/business/segment/segments` | List segments |
| POST | `/business/segment/segments` | Create segment |
| GET | `/business/segment/segments/:id` | Get segment details |
| PUT | `/business/segment/segments/:id` | Update segment |
| DELETE | `/business/segment/segments/:id` | Delete segment |
| GET | `/business/segment/segments/:id/members` | List segment members |
| GET | `/business/segment/profiles` | List customer profiles |
| GET | `/business/segment/profiles/:customerId` | Get customer profile |
