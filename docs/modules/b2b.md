# B2B Module

## Overview

The B2B module provides business-to-business commerce capabilities — company hierarchy, multi-user spending limits, price books, RFQ→quote→order flow, Net-15/30/60 payment terms, and approval workflows.

---

## Public API (`index.ts`)

| Export | Type | Description |
|---|---|---|
| `Company` | Entity | B2B company with credit limit, payment terms, status |
| `B2BUser` | Entity | Company user with spending limits and roles |
| `Quote` | Entity | RFQ quote with line items, validity, status |
| `ApprovalWorkflow` | Entity | Multi-step approval workflow for orders/quotes |
| `B2BRepository` | Port | Repository interface |
| `B2BErrors` | Errors | Domain error classes |
| `b2bController` | Controller | Wired controller instance |
| `b2bBusinessRouter` | Router | Express router at `/business/b2b` |

---

## Domain Entities

| Entity | Description |
|---|---|
| `Company` | `b2bCompanyId`, name, taxId, creditLimit, paymentTerms (Net-15/30/60), status (pending/approved/suspended/terminated) |
| `B2BUser` | `b2bUser`, `b2bCompanyId`, userId, role (admin/buyer/approver), spendingLimit, status |
| `Quote` | `b2bQuoteId`, `b2bCompanyId`, line items, validity period, status (draft/sent/viewed/accepted/rejected/converted/expired) |
| `ApprovalWorkflow` | `approvalWorkflowId`, `b2bCompanyId`, threshold, approvers, status (pending/approved/rejected/escalated) |

## Domain Errors

| Error | Code | Status |
|---|---|---|
| `CompanyNotFoundError` | `b2b.company_not_found` | 404 |
| `B2BValidationError` | `b2b.validation_error` | 400 |
| `QuoteNotFoundError` | `b2b.quote_not_found` | 404 |
| `ApprovalNotFoundError` | `b2b.approval_not_found` | 404 |

## Events

| Direction | Events |
|---|---|
| Publishes | `company.registered`, `company.approved`, `company.suspended`, `company.user.invited`, `b2b_user.activated`, `quote.created`, `quote.sent`, `quote.viewed`, `quote.accepted`, `quote.rejected`, `quote.converted`, `approval.requested`, `approval.approved`, `approval.rejected`, `b2b.request_escalated` |
| Subscribes | (none) |

## Tables

| Table | Description |
|---|---|
| `b2bCompany` | Company registrations with credit and payment terms |
| `b2bUser` | Company users with roles and spending limits |
| `b2bQuote` | Quotes with line items and status lifecycle |
| `b2bApprovalWorkflow` | Approval workflows with thresholds and approvers |

## Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/business/b2b/companies` | Register a new B2B company |
| GET | `/business/b2b/companies` | List companies |
| GET | `/business/b2b/companies/:id` | Get company details |
| PUT | `/business/b2b/companies/:id/approve` | Approve company |
| PUT | `/business/b2b/companies/:id/suspend` | Suspend company |
| POST | `/business/b2b/quotes` | Create a quote |
| GET | `/business/b2b/quotes` | List quotes |
| GET | `/business/b2b/quotes/:id` | Get quote details |
| POST | `/business/b2b/quotes/:id/send` | Send quote to customer |
| POST | `/business/b2b/approvals` | Create approval workflow |
| PUT | `/business/b2b/approvals/:id/approve` | Approve request |
| PUT | `/business/b2b/approvals/:id/reject` | Reject request |
