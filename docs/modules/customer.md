# Customer Feature

## Overview

The Customer feature manages customer accounts, profiles, and addresses. It handles customer registration, profile management, and address book functionality.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-CUS-001 | Register Customer | Guest | Create a new customer account with email verification and optional guest basket merge |
| UC-CUS-002 | Get My Profile | Customer | Retrieve the authenticated customer's profile data without sensitive fields |
| UC-CUS-003 | Update My Profile | Customer | Update the authenticated customer's profile fields (name, phone, preferences) |
| UC-CUS-004 | Get My Addresses | Customer | Retrieve the customer's address book with default address flagged |
| UC-CUS-005 | Add Address | Customer | Add a new address to the customer's address book with optional default flag |
| UC-CUS-006 | Update Address | Customer | Update an existing address in the customer's address book |
| UC-CUS-007 | Delete Address | Customer | Remove an address from the customer's address book (soft delete, blocked if used in active orders) |
| UC-CUS-008 | Set Default Address | Customer | Set a specific address as the default for checkout auto-fill |
| UC-CUS-009 | Get Customer (Business) | Merchant/Admin | Retrieve a customer's full profile with order history, address book, and account status |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-CUS-001 | POST | `/customers/register` |
| UC-CUS-002 | GET | `/customers/me` |
| UC-CUS-003 | PUT | `/customers/me` |
| UC-CUS-004 | GET | `/customers/me/addresses` |
| UC-CUS-005 | POST | `/customers/me/addresses` |
| UC-CUS-006 | PUT | `/customers/me/addresses/:addressId` |
| UC-CUS-007 | DELETE | `/customers/me/addresses/:addressId` |
| UC-CUS-008 | POST | `/customers/me/addresses/:addressId/default` |
| UC-CUS-009 | GET | `/business/customers/:customerId` |

---

## Events Emitted

| Event                 | Trigger               | Payload             |
| --------------------- | --------------------- | ------------------- |
| `customer.created`    | Registration          | customerId, email   |
| `customer.registered` | Registration complete | customerId          |
| `customer.updated`    | Profile updated       | customerId, changes |

---

## Integration Test Coverage

| Use Case   | Test File                         | Status |
| ---------- | --------------------------------- | ------ |
| UC-CUS-001 | `customer/customer.test.ts`       | ✅     |
| UC-CUS-002 | `customer/customer.test.ts`       | ✅     |
| UC-CUS-003 | `customer/customer.test.ts`       | ✅     |
| UC-CUS-004 | `customer/customer.test.ts`       | ✅     |
| UC-CUS-005 | `customer/customer.test.ts`       | ✅     |
| UC-CUS-006 | `customer/customer.test.ts`       | ✅     |
| UC-CUS-007 | `customer/customer.test.ts`       | ✅     |
| UC-CUS-008 | `customer/customer.test.ts`       | ✅     |
| UC-CUS-009 | `customer/customerActions.test.ts`| ✅     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/customers` | `listCustomers` | List all customers
GET /business/customers |
| POST | `/business/customers` | `createCustomer` | Create a new customer
POST /business/customers |
| GET | `/business/customers/:customerId` | `getCustomer` | Get customer by ID
GET /business/customers/:customerId |
| PUT | `/business/customers/:customerId` | `updateCustomer` | Update customer
PUT /business/customers/:customerId |
| DELETE | `/business/customers/:customerId` | `deleteCustomer` | Delete customer
DELETE /business/customers/:customerId |
| GET | `/business/customers/:customerId/addresses` | `getCustomerAddresses` | Get customer addresses
GET /business/customers/:customerId/addresses |
| POST | `/business/customers/:customerId/addresses` | `addCustomerAddress` | Add customer address
POST /business/customers/:customerId/addresses |
| POST | `/business/customers/:customerId/deactivate` | `deactivateCustomer` | Deactivate customer
POST /business/customers/:customerId/deactivate |
| POST | `/business/customers/:customerId/reactivate` | `reactivateCustomer` | Reactivate customer
POST /business/customers/:customerId/reactivate |
| POST | `/business/customers/:customerId/verify` | `verifyCustomer` | Verify customer
POST /business/customers/:customerId/verify |
| GET | `/me` | `getMyProfile` | Get my profile
GET /customers/me |
| PUT | `/me` | `updateMyProfile` | Update my profile
PUT /customers/me |
| GET | `/me/addresses` | `getAddresses` | Get my addresses
GET /customers/me/addresses |
| POST | `/me/addresses` | `addAddress` | Add a new address
POST /customers/me/addresses |
| PUT | `/me/addresses/:addressId` | `updateAddress` | Update an address
PUT /customers/me/addresses/:addressId |
| DELETE | `/me/addresses/:addressId` | `deleteAddress` | Delete an address
DELETE /customers/me/addresses/:addressId |
| POST | `/me/addresses/:addressId/default` | `setDefaultAddress` | Set default address
POST /customers/me/addresses/:addressId/default |
| POST | `/register` | `registerCustomer` | Register a new customer
POST /customers/register |

<!-- GENERATED:ENDPOINTS:END -->
