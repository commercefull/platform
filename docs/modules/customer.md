# Customer Feature

## Overview

The Customer feature manages customer accounts, profiles, and addresses. It handles customer registration, profile management, and address book functionality.

---

## Use Cases

### UC-CUS-001: Register Customer

**Actor:** Guest  
**Priority:** High

#### Given-When-Then

**Given** a guest user  
**And** valid registration data  
**When** they register an account  
**Then** the system creates a customer account  
**And** sends a verification email  
**And** emits customer.created event

#### API Endpoint

```
POST /customers/register
Body: { email, password, firstName, lastName, phone? }
```

#### Business Rules

- Email must be unique and valid
- Password must meet strength requirements
- Email verification may be required
- Can optionally merge guest basket

---

### UC-CUS-002: Get My Profile

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**When** they request their profile  
**Then** the system returns their customer data

#### API Endpoint

```
GET /customers/me
```

#### Business Rules

- Returns customer profile without sensitive data
- Includes preferences and settings
- Password is never returned

---

### UC-CUS-003: Update My Profile

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**And** valid profile data  
**When** they update their profile  
**Then** the system saves the changes  
**And** emits customer.updated event

#### API Endpoint

```
PUT /customers/me
Body: { firstName?, lastName?, phone?, preferences? }
```

#### Business Rules

- Email change may require verification
- Only provided fields are updated
- Some fields may be read-only

---

### UC-CUS-004: Get My Addresses

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**When** they request their addresses  
**Then** the system returns their address book

#### API Endpoint

```
GET /customers/me/addresses
```

#### Business Rules

- Returns all customer addresses
- Default address is flagged
- Sorted by default first, then by name

---

### UC-CUS-005: Add Address

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**And** valid address data  
**When** they add an address  
**Then** the system creates the address

#### API Endpoint

```
POST /customers/me/addresses
Body: {
  label?, firstName, lastName, addressLine1, addressLine2?,
  city, state?, postalCode, country, phone?, isDefault?
}
```

#### Business Rules

- First address becomes default automatically
- Can optionally set as default
- Address is validated

---

### UC-CUS-006: Update Address

**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated customer  
**And** an existing address  
**When** they update the address  
**Then** the system saves the changes

#### API Endpoint

```
PUT /customers/me/addresses/:addressId
Body: { firstName?, addressLine1?, city?, ... }
```

#### Business Rules

- Only customer's own addresses
- Only provided fields are updated

---

### UC-CUS-007: Delete Address

**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated customer  
**And** an existing address  
**When** they delete the address  
**Then** the system removes the address

#### API Endpoint

```
DELETE /customers/me/addresses/:addressId
```

#### Business Rules

- Cannot delete address used in active orders
- If default is deleted, another becomes default
- Soft delete for audit trail

---

### UC-CUS-008: Set Default Address

**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated customer  
**And** an existing address  
**When** they set it as default  
**Then** the address becomes the default

#### API Endpoint

```
POST /customers/me/addresses/:addressId/default
```

#### Business Rules

- Removes default from previous address
- Used for checkout auto-fill

---

### UC-CUS-009: Get Customer (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid customer ID  
**When** they request customer details  
**Then** the system returns the customer profile

#### API Endpoint

```
GET /business/customers/:customerId
```

#### Business Rules

- Returns full customer profile
- Includes order history summary
- Includes address book
- Includes account status

---

## Events Emitted

| Event                 | Trigger               | Payload             |
| --------------------- | --------------------- | ------------------- |
| `customer.created`    | Registration          | customerId, email   |
| `customer.registered` | Registration complete | customerId          |
| `customer.updated`    | Profile updated       | customerId, changes |

---

## Integration Test Coverage

| Use Case   | Test File                   | Status |
| ---------- | --------------------------- | ------ |
| UC-CUS-001 | `customer/customer.test.ts` | ✅     |
| UC-CUS-002 | `customer/customer.test.ts` | ✅     |
| UC-CUS-003 | `customer/customer.test.ts` | ✅     |
| UC-CUS-004 | `customer/customer.test.ts` | 🟡     |
| UC-CUS-005 | `customer/customer.test.ts` | 🟡     |
| UC-CUS-006 | `customer/customer.test.ts` | ❌     |
| UC-CUS-007 | `customer/customer.test.ts` | ❌     |
| UC-CUS-008 | `customer/customer.test.ts` | ❌     |
| UC-CUS-009 | `customer/customer.test.ts` | 🟡     |
