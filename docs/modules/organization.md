# Organization Module

## Overview

The Organization module manages organization accounts. It handles organization profiles, addresses, and payment information. This module replaced the former Merchant module.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-ORG-001 | List Organizations | Admin | List all organization accounts with optional status/search filtering |
| UC-ORG-002 | Create Organization | Admin | Create a new organization account with unique email |
| UC-ORG-003 | Get Organization | Admin | Retrieve a specific organization account by ID |
| UC-ORG-004 | Update Organization | Admin | Update an organization's name, email, or status |
| UC-ORG-005 | Delete Organization | Admin | Permanently delete an organization account |
| UC-ORG-006 | Get Organization Addresses | Admin | Retrieve all addresses associated with an organization |
| UC-ORG-007 | Add Organization Address | Admin | Add a business, warehouse, or return address to an organization |
| UC-ORG-008 | Get Organization Payment Info | Admin | Retrieve an organization's payment method details |
| UC-ORG-009 | Add Organization Payment Info | Admin | Add a payment method (bank transfer, PayPal, Stripe) |
| UC-ORG-010 | Get Organization Stores | Admin/Organization | List all stores belonging to an organization |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-ORG-001 | GET | `/business/organizations` |
| UC-ORG-002 | POST | `/business/organizations` |
| UC-ORG-003 | GET | `/business/organizations/:id` |
| UC-ORG-004 | PUT | `/business/organizations/:id` |
| UC-ORG-005 | DELETE | `/business/organizations/:id` |
| UC-ORG-006 | GET | `/business/organizations/:organizationId/addresses` |
| UC-ORG-007 | POST | `/business/organizations/:organizationId/addresses` |
| UC-ORG-008 | GET | `/business/organizations/:organizationId/payment-info` |
| UC-ORG-009 | POST | `/business/organizations/:organizationId/payment-info` |
| UC-ORG-010 | GET | `/business/organizations/:id/stores` |

---

## Events Emitted

| Event | Trigger | Payload |
|---|---|---|
| `organization.created` | Organization created | organizationId, name, email |
| `organization.login` | Organization login | organizationId, email, name |
| `organization.registered` | Organization registered | organizationId, email, name, status |

---

## Integration Test Coverage

| Use Case   | Test File                        | Status |
| ---------- | -------------------------------- | ------ |
| UC-ORG-001 | `organization/organization.test.ts` | ✅     |
| UC-ORG-002 | `organization/organization.test.ts` | ✅     |
| UC-ORG-003 | `organization/organization.test.ts` | ✅     |
| UC-ORG-004 | `organization/organization.test.ts` | ✅     |
| UC-ORG-005 | `organization/organization.test.ts` | ✅     |
| UC-ORG-006 | `organization/organization.test.ts` | ✅     |
| UC-ORG-007 | `organization/organization.test.ts` | ✅     |
| UC-ORG-008 | `organization/organization.test.ts` | ✅     |
| UC-ORG-009 | `organization/organization.test.ts` | ✅     |
| UC-ORG-010 | `organization/organization.test.ts` | ✅     |

---

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/organizations` | `getOrganizations` | — |
| POST | `/business/organizations` | `createOrganization` | — |
| GET | `/business/organizations/:id` | `getOrganizationById` | — |
| PUT | `/business/organizations/:id` | `updateOrganization` | — |
| DELETE | `/business/organizations/:id` | `deleteOrganization` | — |
| GET | `/business/organizations/:id/stores` | `getOrganizationStores` | — |
| GET | `/business/organizations/:organizationId/addresses` | `getOrganizationAddresses` | — |
| POST | `/business/organizations/:organizationId/addresses` | `addOrganizationAddress` | — |
| PUT | `/business/organizations/:organizationId/addresses/:addressId` | `updateOrganizationAddress` | — |
| GET | `/business/organizations/:organizationId/payment-info` | `getOrganizationPaymentInfo` | — |
| POST | `/business/organizations/:organizationId/payment-info` | `addOrganizationPaymentInfo` | — |
| PUT | `/business/organizations/:organizationId/payment-info/:paymentInfoId` | `updateOrganizationPaymentInfo` | — |

<!-- GENERATED:ENDPOINTS:END -->
