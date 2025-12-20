# Support Feature

## Overview

The Support feature manages customer service operations including support tickets, FAQ/knowledge base, and product alerts (stock and price). It enables both customer self-service and agent-assisted support.

---

## Use Cases

### Agent Management (Business)

### UC-SUP-001: List Agents (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request support agents  
**Then** the system returns all agents

#### API Endpoint
```
GET /business/support/agents
```

---

### UC-SUP-002: Get Agent (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/support/agents/:id
```

---

### UC-SUP-003: Create Agent (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/support/agents
Body: { userId, name, email, department?, skills: [] }
```

---

### UC-SUP-004: Update Agent (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
PUT /business/support/agents/:id
```

---

### Ticket Management (Business)

### UC-SUP-005: List Tickets (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request support tickets  
**Then** the system returns all tickets

#### API Endpoint
```
GET /business/support/tickets
Query: status?, priority?, agentId?, customerId?, limit, offset
```

---

### UC-SUP-006: Get Ticket (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
GET /business/support/tickets/:id
```

---

### UC-SUP-007: Update Ticket (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
PUT /business/support/tickets/:id
Body: { priority?, category?, tags? }
```

---

### UC-SUP-008: Assign Ticket (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an unassigned ticket  
**When** assigning to an agent  
**Then** the agent is notified

#### API Endpoint
```
POST /business/support/tickets/:id/assign
Body: { agentId }
```

---

### UC-SUP-009: Resolve Ticket (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an open ticket  
**When** marking as resolved  
**Then** the customer is notified

#### API Endpoint
```
POST /business/support/tickets/:id/resolve
Body: { resolution }
```

---

### UC-SUP-010: Close Ticket (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/support/tickets/:id/close
```

---

### UC-SUP-011: Escalate Ticket (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/support/tickets/:id/escalate
Body: { reason, escalateTo? }
```

---

### UC-SUP-012: Add Agent Message (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an open ticket  
**When** an agent replies  
**Then** the customer is notified

#### API Endpoint
```
POST /business/support/tickets/:id/messages
Body: { message, isInternal? }
```

---

### FAQ Categories (Business)

### UC-SUP-013: List FAQ Categories (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/support/faq/categories
```

---

### UC-SUP-014: Create FAQ Category (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/support/faq/categories
Body: { name, slug, description?, parentId?, sortOrder }
```

---

### UC-SUP-015: Update FAQ Category (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
PUT /business/support/faq/categories/:id
```

---

### UC-SUP-016: Delete FAQ Category (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/support/faq/categories/:id
```

---

### FAQ Articles (Business)

### UC-SUP-017: List FAQ Articles (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/support/faq/articles
Query: categoryId?, status?, limit, offset
```

---

### UC-SUP-018: Create FAQ Article (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/support/faq/articles
Body: { title, slug, content, categoryId, tags: [] }
```

---

### UC-SUP-019: Update FAQ Article (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/support/faq/articles/:id
```

---

### UC-SUP-020: Publish FAQ Article (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/support/faq/articles/:id/publish
```

---

### UC-SUP-021: Unpublish FAQ Article (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
POST /business/support/faq/articles/:id/unpublish
```

---

### UC-SUP-022: Delete FAQ Article (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/support/faq/articles/:id
```

---

### Alert Management (Business)

### UC-SUP-023: Get Stock Alerts (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/support/alerts/stock
Query: productId?, status?, limit, offset
```

---

### UC-SUP-024: Get Price Alerts (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/support/alerts/price
Query: productId?, status?, limit, offset
```

---

### UC-SUP-025: Notify Stock Alerts (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/support/alerts/stock/notify
Body: { productId }
```

---

### UC-SUP-026: Notify Price Alerts (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/support/alerts/price/notify
Body: { productId }
```

---

### Customer-Facing Use Cases

### UC-SUP-027: Browse FAQ Categories (Customer)
**Actor:** Customer/Guest  
**Priority:** High

#### API Endpoint
```
GET /support/faq/categories
GET /support/faq/categories/featured
GET /support/faq/categories/:slug
```

---

### UC-SUP-028: Browse FAQ Articles (Customer)
**Actor:** Customer/Guest  
**Priority:** High

#### API Endpoint
```
GET /support/faq/articles/popular
GET /support/faq/articles/:slug
```

---

### UC-SUP-029: Search FAQ (Customer)
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a search query  
**When** searching the FAQ  
**Then** matching articles are returned

#### API Endpoint
```
GET /support/faq/search
Query: q
```

---

### UC-SUP-030: Submit FAQ Feedback (Customer)
**Actor:** Customer/Guest  
**Priority:** Low

#### API Endpoint
```
POST /support/faq/articles/:id/feedback
Body: { helpful: boolean, comment? }
```

---

### UC-SUP-031: Create Ticket (Customer)
**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**And** a support issue  
**When** they create a ticket  
**Then** the ticket is created and assigned

#### API Endpoint
```
POST /support/tickets
Body: { subject, message, category?, orderId?, priority? }
```

---

### UC-SUP-032: Get My Tickets (Customer)
**Actor:** Customer  
**Priority:** High

#### API Endpoint
```
GET /support/tickets/mine
```

---

### UC-SUP-033: Get My Ticket (Customer)
**Actor:** Customer  
**Priority:** High

#### API Endpoint
```
GET /support/tickets/mine/:id
```

---

### UC-SUP-034: Add Customer Message (Customer)
**Actor:** Customer  
**Priority:** High

#### API Endpoint
```
POST /support/tickets/mine/:id/messages
Body: { message }
```

---

### UC-SUP-035: Submit Ticket Feedback (Customer)
**Actor:** Customer  
**Priority:** Low

#### API Endpoint
```
POST /support/tickets/mine/:id/feedback
Body: { rating, comment? }
```

---

### UC-SUP-036: Create Stock Alert (Customer)
**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an out-of-stock product  
**When** creating a stock alert  
**Then** customer is notified when back in stock

#### API Endpoint
```
POST /support/alerts/stock
Body: { productId, email? }
```

---

### UC-SUP-037: Get My Stock Alerts (Customer)
**Actor:** Customer  
**Priority:** Low

#### API Endpoint
```
GET /support/alerts/stock/mine
```

---

### UC-SUP-038: Cancel Stock Alert (Customer)
**Actor:** Customer  
**Priority:** Low

#### API Endpoint
```
DELETE /support/alerts/stock/mine/:id
```

---

### UC-SUP-039: Create Price Alert (Customer)
**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** a product  
**And** a target price  
**When** creating a price alert  
**Then** customer is notified when price drops

#### API Endpoint
```
POST /support/alerts/price
Body: { productId, targetPrice, email? }
```

---

### UC-SUP-040: Get My Price Alerts (Customer)
**Actor:** Customer  
**Priority:** Low

#### API Endpoint
```
GET /support/alerts/price/mine
```

---

### UC-SUP-041: Cancel Price Alert (Customer)
**Actor:** Customer  
**Priority:** Low

#### API Endpoint
```
DELETE /support/alerts/price/mine/:id
```

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `ticket.created` | Ticket created | ticketId, customerId |
| `ticket.assigned` | Ticket assigned | ticketId, agentId |
| `ticket.replied` | Agent replied | ticketId, messageId |
| `ticket.resolved` | Ticket resolved | ticketId |
| `ticket.closed` | Ticket closed | ticketId |
| `alert.stock.created` | Stock alert created | alertId, productId |
| `alert.stock.triggered` | Product back in stock | alertId, productId |
| `alert.price.created` | Price alert created | alertId, productId |
| `alert.price.triggered` | Price dropped | alertId, productId, newPrice |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-SUP-001 to UC-SUP-004 | `support/agents.test.ts` | ❌ |
| UC-SUP-005 to UC-SUP-012 | `support/tickets.test.ts` | ❌ |
| UC-SUP-013 to UC-SUP-022 | `support/faq.test.ts` | ❌ |
| UC-SUP-023 to UC-SUP-026 | `support/alerts-admin.test.ts` | ❌ |
| UC-SUP-027 to UC-SUP-041 | `support/customer.test.ts` | ❌ |
