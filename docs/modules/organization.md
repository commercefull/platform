# Organization Module

## Overview

The Organization module manages business/organization accounts. It handles organization profiles, addresses, and payment information. This module replaced the former Merchant module.

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
| UC-ORG-010 | Get Organization Stores | Admin/Business | List all stores belonging to an organization |

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
| `merchant.created` | Organization created | merchantId, name, email |
| `merchant.login` | Organization login | merchantId, email, name |
| `merchant.registered` | Organization registered | merchantId, email, name, status |

---

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/organizations` | `listOrganizations` | List all organizations |
| POST | `/business/organizations` | `createOrganization` | Create a new organization |
| GET | `/business/organizations/:id` | `viewOrganization` | Get organization by ID |
| PUT | `/business/organizations/:id` | `updateOrganization` | Update organization |
| DELETE | `/business/organizations/:id` | `deleteOrganization` | Delete organization |
| GET | `/business/organizations/:organizationId/addresses` | `getOrganizationAddresses` | Get organization addresses |
| POST | `/business/organizations/:organizationId/addresses` | `addOrganizationAddress` | Add organization address |
| PUT | `/business/organizations/:organizationId/addresses/:addressId` | `updateOrganizationAddress` | Update organization address |
| GET | `/business/organizations/:organizationId/payment-info` | `getOrganizationPaymentInfo` | Get organization payment info |
| POST | `/business/organizations/:organizationId/payment-info` | `addOrganizationPaymentInfo` | Add organization payment info |
| PUT | `/business/organizations/:organizationId/payment-info/:paymentInfoId` | `updateOrganizationPaymentInfo` | Update organization payment info |
| GET | `/business/organizations/:id/stores` | `getOrganizationStores` | Get stores by organization |

<!-- GENERATED:ENDPOINTS:END -->
