# GDPR Feature

## Overview

The GDPR (General Data Protection Regulation) feature handles compliance with EU data protection regulations. It manages data subject requests (access, portability, deletion), cookie consent, and data processing records.

---

## Use Cases

### Cookie Consent

### UC-GDP-001: Record Cookie Consent
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a user visiting the site  
**When** they respond to the cookie banner  
**Then** the system records their consent preferences  
**And** emits gdpr.consent.recorded event

#### API Endpoint
```
POST /gdpr/cookies/consent
Body: {
  consentId?: string,
  necessaryCookies: boolean,
  analyticsCookies: boolean,
  marketingCookies: boolean,
  preferenceCookies: boolean
}
```

#### Business Rules
- Necessary cookies are always allowed
- Consent is stored with timestamp
- IP and user agent are recorded
- Consent ID is generated for anonymous users

---

### UC-GDP-002: Get Cookie Consent
**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** a user with a consent ID  
**When** they request their consent status  
**Then** the system returns their current consent settings

#### API Endpoint
```
GET /gdpr/cookies/consent
Query: consentId
```

#### Business Rules
- Returns current consent status
- Returns null if no consent recorded

---

### UC-GDP-003: Accept All Cookies
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a user on the site  
**When** they click "Accept All"  
**Then** all cookie categories are enabled

#### API Endpoint
```
POST /gdpr/cookies/accept-all
Body: { consentId?: string }
```

---

### UC-GDP-004: Reject All Optional Cookies
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a user on the site  
**When** they click "Reject All"  
**Then** only necessary cookies remain enabled

#### API Endpoint
```
POST /gdpr/cookies/reject-all
Body: { consentId?: string }
```

---

### UC-GDP-005: Update Cookie Consent
**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** an existing consent record  
**When** the user updates their preferences  
**Then** the consent is updated  
**And** emits gdpr.consent.updated event

#### API Endpoint
```
PUT /gdpr/cookies/consent/:cookieConsentId
Body: { analyticsCookies?, marketingCookies?, preferenceCookies? }
```

---

### Data Subject Requests

### UC-GDP-006: Create Data Request
**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**And** a valid request type  
**When** they create a data request  
**Then** the system creates a GDPR data request  
**And** sends confirmation email  
**And** emits gdpr.request.created event

#### API Endpoint
```
POST /gdpr/requests
Body: { requestType: 'access'|'portability'|'deletion'|'rectification', notes?: string }
```

#### Business Rules
- Request types: access, portability, deletion, rectification
- Must be processed within 30 days (GDPR deadline)
- Identity verification may be required
- Customer is notified of progress

---

### UC-GDP-007: Get My Data Requests
**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated customer  
**When** they request their data requests  
**Then** the system returns their request history

#### API Endpoint
```
GET /gdpr/requests
```

#### Business Rules
- Only returns customer's own requests
- Includes status and history

---

### UC-GDP-008: Cancel Data Request
**Actor:** Customer  
**Priority:** Low

#### Given-When-Then

**Given** an authenticated customer  
**And** a pending data request  
**When** they cancel the request  
**Then** the request is marked as cancelled

#### API Endpoint
```
POST /gdpr/requests/:gdprDataRequestId/cancel
```

#### Business Rules
- Can only cancel pending requests
- Already processed requests cannot be cancelled

---

### Business/Admin Use Cases

### UC-GDP-009: List Data Requests (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated admin  
**When** they request the list of data requests  
**Then** the system returns all GDPR requests

#### API Endpoint
```
GET /business/gdpr/requests
Query: status, requestType, customerId, limit, offset
```

#### Business Rules
- Returns all requests for the merchant
- Supports filtering by status, type
- Ordered by deadline (oldest first)

---

### UC-GDP-010: Get Data Request (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated admin  
**And** a valid request ID  
**When** they request details  
**Then** the system returns the request with full history

#### API Endpoint
```
GET /business/gdpr/requests/:gdprDataRequestId
```

---

### UC-GDP-011: Get Overdue Requests (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated admin  
**When** they request overdue requests  
**Then** the system returns requests past their deadline

#### API Endpoint
```
GET /business/gdpr/requests/overdue
```

#### Business Rules
- Returns requests past 30-day deadline
- Critical for compliance monitoring

---

### UC-GDP-012: Get GDPR Statistics (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated admin  
**When** they request GDPR statistics  
**Then** the system returns aggregated metrics

#### API Endpoint
```
GET /business/gdpr/statistics
```

#### Business Rules
- Returns request counts by type and status
- Includes average processing time
- Includes compliance rate

---

### UC-GDP-013: Verify Identity (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated admin  
**And** a pending data request  
**When** they verify the customer's identity  
**Then** the request is marked as verified

#### API Endpoint
```
POST /business/gdpr/requests/:gdprDataRequestId/verify
Body: { verificationMethod: string, notes?: string }
```

#### Business Rules
- Required before processing sensitive requests
- Documents verification method
- Creates audit trail

---

### UC-GDP-014: Process Export Request (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated admin  
**And** a verified data request (access/portability)  
**When** they process the export  
**Then** the system generates a data export  
**And** notifies the customer  
**And** emits gdpr.data.exported event

#### API Endpoint
```
POST /business/gdpr/requests/:gdprDataRequestId/export
```

#### Business Rules
- Generates JSON/CSV export of customer data
- Includes all data categories
- Secure download link sent to customer
- Link expires after 7 days

---

### UC-GDP-015: Process Deletion Request (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated admin  
**And** a verified deletion request  
**When** they process the deletion  
**Then** the system deletes/anonymizes customer data  
**And** emits gdpr.data.deleted event

#### API Endpoint
```
POST /business/gdpr/requests/:gdprDataRequestId/delete
```

#### Business Rules
- Anonymizes PII in historical records
- Deletes data where legally permitted
- Retains data required for legal compliance
- Documents what was deleted

---

### UC-GDP-016: Reject Request (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated admin  
**And** a data request  
**When** they reject the request with reason  
**Then** the request is marked as rejected  
**And** customer is notified  
**And** emits gdpr.request.rejected event

#### API Endpoint
```
POST /business/gdpr/requests/:gdprDataRequestId/reject
Body: { reason: string }
```

#### Business Rules
- Reason is required
- Customer can appeal
- Creates audit trail

---

### UC-GDP-017: Get Cookie Consent Statistics (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** an authenticated admin  
**When** they request cookie consent statistics  
**Then** the system returns consent metrics

#### API Endpoint
```
GET /business/gdpr/cookies/statistics
```

#### Business Rules
- Returns consent rates by category
- Useful for compliance reporting

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `gdpr.request.created` | Request created | requestId, customerId, type |
| `gdpr.request.completed` | Request processed | requestId, completedAt |
| `gdpr.request.rejected` | Request rejected | requestId, reason |
| `gdpr.data.exported` | Data exported | requestId, customerId |
| `gdpr.data.deleted` | Data deleted | requestId, customerId |
| `gdpr.consent.recorded` | Consent recorded | consentId, preferences |
| `gdpr.consent.updated` | Consent updated | consentId, changes |

---

## Compliance Notes

### GDPR Deadlines
- Data requests must be processed within **30 days**
- Extensions up to **60 days** require notification

### Data Categories
- Personal identifiers (name, email, phone)
- Order history
- Payment methods (masked)
- Addresses
- Preferences
- Activity logs

### Retention Requirements
- Invoice data: 7 years (legal requirement)
- Tax records: 7 years (legal requirement)
- Anonymized analytics: Indefinite

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-GDP-001 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-002 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-003 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-004 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-005 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-006 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-007 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-008 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-009 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-010 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-011 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-012 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-013 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-014 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-015 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-016 | `gdpr/gdpr.test.ts` | ❌ |
| UC-GDP-017 | `gdpr/gdpr.test.ts` | ❌ |
