# GDPR Feature

## Overview

The GDPR (General Data Protection Regulation) feature handles compliance with EU data protection regulations. It manages data subject requests (access, portability, deletion), cookie consent, and data processing records.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-GDP-001 | Record Cookie Consent | Customer/Guest | Record a user's cookie consent preferences across categories (necessary, analytics, marketing, preference) |
| UC-GDP-002 | Get Cookie Consent | Customer/Guest | Retrieve a user's current cookie consent settings by consent ID |
| UC-GDP-003 | Accept All Cookies | Customer/Guest | Enable all cookie categories for a user with a single action |
| UC-GDP-004 | Reject All Optional Cookies | Customer/Guest | Disable all optional cookies, keeping only necessary cookies enabled |
| UC-GDP-005 | Update Cookie Consent | Customer/Guest | Update an existing consent record with new cookie preferences |
| UC-GDP-006 | Create Data Request | Customer | Submit a GDPR data subject request (access, portability, deletion, rectification) |
| UC-GDP-007 | Get My Data Requests | Customer | Retrieve the customer's own GDPR data request history |
| UC-GDP-008 | Cancel Data Request | Customer | Cancel a pending GDPR data request |
| UC-GDP-009 | List Data Requests (Business) | Merchant/Admin | List all GDPR data requests with optional status/type/customer filtering |
| UC-GDP-010 | Get Data Request (Business) | Merchant/Admin | Retrieve a specific GDPR data request with full processing history |
| UC-GDP-011 | Get Overdue Requests | Merchant/Admin | Retrieve GDPR requests past their 30-day processing deadline |
| UC-GDP-012 | Get GDPR Statistics | Merchant/Admin | Retrieve aggregated GDPR metrics (request counts by type/status, avg processing time, compliance rate) |
| UC-GDP-013 | Verify Identity | Merchant/Admin | Verify a customer's identity before processing a sensitive GDPR data request |
| UC-GDP-014 | Process Export Request | Merchant/Admin | Generate a JSON/CSV data export for an access or portability request and notify the customer |
| UC-GDP-015 | Process Deletion Request | Merchant/Admin | Anonymize or delete customer data for a verified deletion request while retaining legally required records |
| UC-GDP-016 | Reject Request | Merchant/Admin | Reject a GDPR data request with a required reason and notify the customer |
| UC-GDP-017 | Get Cookie Consent Statistics | Merchant/Admin | Retrieve cookie consent rates by category for compliance reporting |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-GDP-001 | POST | `/gdpr/cookies/consent` |
| UC-GDP-002 | GET | `/gdpr/cookies/consent` |
| UC-GDP-003 | POST | `/gdpr/cookies/accept-all` |
| UC-GDP-004 | POST | `/gdpr/cookies/reject-all` |
| UC-GDP-005 | PUT | `/gdpr/cookies/consent/:cookieConsentId` |
| UC-GDP-006 | POST | `/gdpr/requests` |
| UC-GDP-007 | GET | `/gdpr/requests` |
| UC-GDP-008 | POST | `/gdpr/requests/:gdprDataRequestId/cancel` |
| UC-GDP-009 | GET | `/business/gdpr/requests` |
| UC-GDP-010 | GET | `/business/gdpr/requests/:gdprDataRequestId` |
| UC-GDP-011 | GET | `/business/gdpr/requests/overdue` |
| UC-GDP-012 | GET | `/business/gdpr/statistics` |
| UC-GDP-013 | POST | `/business/gdpr/requests/:gdprDataRequestId/verify` |
| UC-GDP-014 | POST | `/business/gdpr/requests/:gdprDataRequestId/export` |
| UC-GDP-015 | POST | `/business/gdpr/requests/:gdprDataRequestId/delete` |
| UC-GDP-016 | POST | `/business/gdpr/requests/:gdprDataRequestId/reject` |
| UC-GDP-017 | GET | `/business/gdpr/cookies/statistics` |

---

## Events Emitted

| Event                    | Trigger           | Payload                     |
| ------------------------ | ----------------- | --------------------------- |
| `gdpr.request.created`   | Request created   | requestId, customerId, type |
| `gdpr.request.completed` | Request processed | requestId, completedAt      |
| `gdpr.request.rejected`  | Request rejected  | requestId, reason           |
| `gdpr.data.exported`     | Data exported     | requestId, customerId       |
| `gdpr.data.deleted`      | Data deleted      | requestId, customerId       |
| `gdpr.consent.recorded`  | Consent recorded  | consentId, preferences      |
| `gdpr.consent.updated`   | Consent updated   | consentId, changes          |

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

| Use Case   | Test File           | Status |
| ---------- | ------------------- | ------ |
| UC-GDP-001 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-002 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-003 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-004 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-005 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-006 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-007 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-008 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-009 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-010 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-011 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-012 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-013 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-014 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-015 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-016 | `gdpr/gdpr.test.ts` | ✅     |
| UC-GDP-017 | `gdpr/gdpr.test.ts` | ✅     |
