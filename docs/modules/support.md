# Support Feature

## Overview

The Support feature manages customer service operations including support tickets, FAQ/knowledge base, and product alerts (stock and price). It enables both customer self-service and agent-assisted support.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-SUP-001 | List Agents | Merchant/Admin | List all support agents |
| UC-SUP-002 | Get Agent | Merchant/Admin | Retrieve a specific support agent by ID |
| UC-SUP-003 | Create Agent | Merchant/Admin | Create a support agent with department and skills |
| UC-SUP-004 | Update Agent | Merchant/Admin | Update an existing agent's details or skills |
| UC-SUP-005 | List Tickets | Merchant/Admin | List all support tickets with optional status/priority/agent/customer filtering |
| UC-SUP-006 | Get Ticket | Merchant/Admin | Retrieve a specific support ticket by ID |
| UC-SUP-007 | Update Ticket | Merchant/Admin | Update a ticket's priority, category, or tags |
| UC-SUP-008 | Assign Ticket | Merchant/Admin | Assign a ticket to a specific support agent |
| UC-SUP-009 | Resolve Ticket | Merchant/Admin | Mark an open ticket as resolved with a resolution note |
| UC-SUP-010 | Close Ticket | Merchant/Admin | Close a resolved ticket |
| UC-SUP-011 | Escalate Ticket | Merchant/Admin | Escalate a ticket with a reason and optional target |
| UC-SUP-012 | Add Agent Message | Merchant/Admin | Add an agent reply or internal note to a ticket |
| UC-SUP-013 | List FAQ Categories | Merchant/Admin | List all FAQ categories |
| UC-SUP-014 | Create FAQ Category | Merchant/Admin | Create a FAQ category with optional parent and sort order |
| UC-SUP-015 | Update FAQ Category | Merchant/Admin | Update an existing FAQ category |
| UC-SUP-016 | Delete FAQ Category | Merchant/Admin | Permanently delete a FAQ category |
| UC-SUP-017 | List FAQ Articles | Merchant/Admin | List FAQ articles with optional category/status filtering |
| UC-SUP-018 | Create FAQ Article | Merchant/Admin | Create a FAQ article with title, content, category, and tags |
| UC-SUP-019 | Update FAQ Article | Merchant/Admin | Update an existing FAQ article's content or metadata |
| UC-SUP-020 | Publish FAQ Article | Merchant/Admin | Publish a FAQ article to make it publicly visible |
| UC-SUP-021 | Unpublish FAQ Article | Merchant/Admin | Unpublish a FAQ article |
| UC-SUP-022 | Delete FAQ Article | Merchant/Admin | Permanently delete a FAQ article |
| UC-SUP-023 | Get Stock Alerts | Merchant/Admin | List stock alerts with optional product/status filtering |
| UC-SUP-024 | Get Price Alerts | Merchant/Admin | List price alerts with optional product/status filtering |
| UC-SUP-025 | Notify Stock Alerts | Merchant/Admin | Trigger stock alert notifications for a product |
| UC-SUP-026 | Notify Price Alerts | Merchant/Admin | Trigger price alert notifications for a product |
| UC-SUP-027 | Browse FAQ Categories | Customer/Guest | Browse FAQ categories, featured categories, or category by slug |
| UC-SUP-028 | Browse FAQ Articles | Customer/Guest | Browse popular FAQ articles or article by slug |
| UC-SUP-029 | Search FAQ | Customer/Guest | Search FAQ articles by text query |
| UC-SUP-030 | Submit FAQ Feedback | Customer/Guest | Submit helpful/not helpful feedback on a FAQ article |
| UC-SUP-031 | Create Ticket | Customer | Create a support ticket with subject, message, and optional category/order/priority |
| UC-SUP-032 | Get My Tickets | Customer | Retrieve the authenticated customer's own support tickets |
| UC-SUP-033 | Get My Ticket | Customer | Retrieve a specific ticket belonging to the customer |
| UC-SUP-034 | Add Customer Message | Customer | Add a customer reply to an existing ticket |
| UC-SUP-035 | Submit Ticket Feedback | Customer | Submit a rating and optional comment for a resolved ticket |
| UC-SUP-036 | Create Stock Alert | Customer | Create a stock alert to be notified when an out-of-stock product is back |
| UC-SUP-037 | Get My Stock Alerts | Customer | Retrieve the customer's own stock alerts |
| UC-SUP-038 | Cancel Stock Alert | Customer | Cancel an existing stock alert |
| UC-SUP-039 | Create Price Alert | Customer | Create a price alert to be notified when a product's price drops to a target |
| UC-SUP-040 | Get My Price Alerts | Customer | Retrieve the customer's own price alerts |
| UC-SUP-041 | Cancel Price Alert | Customer | Cancel an existing price alert |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-SUP-001 | GET | `/business/support/agents` |
| UC-SUP-002 | GET | `/business/support/agents/:id` |
| UC-SUP-003 | POST | `/business/support/agents` |
| UC-SUP-004 | PUT | `/business/support/agents/:id` |
| UC-SUP-005 | GET | `/business/support/tickets` |
| UC-SUP-006 | GET | `/business/support/tickets/:id` |
| UC-SUP-007 | PUT | `/business/support/tickets/:id` |
| UC-SUP-008 | POST | `/business/support/tickets/:id/assign` |
| UC-SUP-009 | POST | `/business/support/tickets/:id/resolve` |
| UC-SUP-010 | POST | `/business/support/tickets/:id/close` |
| UC-SUP-011 | POST | `/business/support/tickets/:id/escalate` |
| UC-SUP-012 | POST | `/business/support/tickets/:id/messages` |
| UC-SUP-013 | GET | `/business/support/faq/categories` |
| UC-SUP-014 | POST | `/business/support/faq/categories` |
| UC-SUP-015 | PUT | `/business/support/faq/categories/:id` |
| UC-SUP-016 | DELETE | `/business/support/faq/categories/:id` |
| UC-SUP-017 | GET | `/business/support/faq/articles` |
| UC-SUP-018 | POST | `/business/support/faq/articles` |
| UC-SUP-019 | PUT | `/business/support/faq/articles/:id` |
| UC-SUP-020 | POST | `/business/support/faq/articles/:id/publish` |
| UC-SUP-021 | POST | `/business/support/faq/articles/:id/unpublish` |
| UC-SUP-022 | DELETE | `/business/support/faq/articles/:id` |
| UC-SUP-023 | GET | `/business/support/alerts/stock` |
| UC-SUP-024 | GET | `/business/support/alerts/price` |
| UC-SUP-025 | POST | `/business/support/alerts/stock/notify` |
| UC-SUP-026 | POST | `/business/support/alerts/price/notify` |
| UC-SUP-027 | GET | `/support/faq/categories` or `/support/faq/categories/featured` or `/support/faq/categories/:slug` |
| UC-SUP-028 | GET | `/support/faq/articles/popular` or `/support/faq/articles/:slug` |
| UC-SUP-029 | GET | `/support/faq/search` |
| UC-SUP-030 | POST | `/support/faq/articles/:id/feedback` |
| UC-SUP-031 | POST | `/support/tickets` |
| UC-SUP-032 | GET | `/support/tickets/mine` |
| UC-SUP-033 | GET | `/support/tickets/mine/:id` |
| UC-SUP-034 | POST | `/support/tickets/mine/:id/messages` |
| UC-SUP-035 | POST | `/support/tickets/mine/:id/feedback` |
| UC-SUP-036 | POST | `/support/alerts/stock` |
| UC-SUP-037 | GET | `/support/alerts/stock/mine` |
| UC-SUP-038 | DELETE | `/support/alerts/stock/mine/:id` |
| UC-SUP-039 | POST | `/support/alerts/price` |
| UC-SUP-040 | GET | `/support/alerts/price/mine` |
| UC-SUP-041 | DELETE | `/support/alerts/price/mine/:id` |

---

## Events Emitted

| Event                   | Trigger               | Payload                      |
| ----------------------- | --------------------- | ---------------------------- |
| `ticket.created`        | Ticket created        | ticketId, customerId         |
| `ticket.assigned`       | Ticket assigned       | ticketId, agentId            |
| `ticket.replied`        | Agent replied         | ticketId, messageId          |
| `ticket.resolved`       | Ticket resolved       | ticketId                     |
| `ticket.closed`         | Ticket closed         | ticketId                     |
| `alert.stock.created`   | Stock alert created   | alertId, productId           |
| `alert.stock.triggered` | Product back in stock | alertId, productId           |
| `alert.price.created`   | Price alert created   | alertId, productId           |
| `alert.price.triggered` | Price dropped         | alertId, productId, newPrice |

---

## Integration Test Coverage

| Use Case                 | Test File                      | Status |
| ------------------------ | ------------------------------ | ------ |
| UC-SUP-001 to UC-SUP-004 | `support/support.test.ts`      | 🟡     |
| UC-SUP-005 to UC-SUP-012 | `support/support.test.ts`      | ✅     |
| UC-SUP-013 to UC-SUP-022 | `support/support.test.ts`      | ✅     |
| UC-SUP-023 to UC-SUP-026 | `support/support.test.ts`      | ✅     |
| UC-SUP-027 to UC-SUP-041 | `support/support.test.ts`      | ✅     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/support/agents` | `getAgents` | — |
| POST | `/business/support/agents` | `createAgent` | — |
| GET | `/business/support/agents/:id` | `getAgent` | — |
| PUT | `/business/support/agents/:id` | `updateAgent` | — |
| GET | `/business/support/alerts/price` | `getPriceAlerts` | — |
| POST | `/business/support/alerts/price/notify` | `notifyPriceAlerts` | — |
| GET | `/business/support/alerts/stock` | `getStockAlerts` | — |
| POST | `/business/support/alerts/stock/notify` | `notifyStockAlerts` | — |
| GET | `/business/support/faq/articles` | `getFaqArticles` | — |
| POST | `/business/support/faq/articles` | `createFaqArticle` | — |
| GET | `/business/support/faq/articles/:id` | `getFaqArticle` | — |
| PUT | `/business/support/faq/articles/:id` | `updateFaqArticle` | — |
| DELETE | `/business/support/faq/articles/:id` | `deleteFaqArticle` | — |
| POST | `/business/support/faq/articles/:id/publish` | `publishFaqArticle` | — |
| POST | `/business/support/faq/articles/:id/unpublish` | `unpublishFaqArticle` | — |
| GET | `/business/support/faq/categories` | `getFaqCategories` | — |
| POST | `/business/support/faq/categories` | `createFaqCategory` | — |
| GET | `/business/support/faq/categories/:id` | `getFaqCategory` | — |
| PUT | `/business/support/faq/categories/:id` | `updateFaqCategory` | — |
| DELETE | `/business/support/faq/categories/:id` | `deleteFaqCategory` | — |
| GET | `/business/support/tickets` | `getTickets` | — |
| GET | `/business/support/tickets/:id` | `getTicket` | — |
| PUT | `/business/support/tickets/:id` | `updateTicket` | — |
| POST | `/business/support/tickets/:id/assign` | `assignTicket` | — |
| POST | `/business/support/tickets/:id/close` | `closeTicket` | — |
| POST | `/business/support/tickets/:id/escalate` | `escalateTicket` | — |
| POST | `/business/support/tickets/:id/messages` | `addAgentMessage` | — |
| POST | `/business/support/tickets/:id/resolve` | `resolveTicket` | — |
| POST | `/customer/support/alerts/price` | `createPriceAlert` | — |
| GET | `/customer/support/alerts/price/mine` | `getMyPriceAlerts` | — |
| DELETE | `/customer/support/alerts/price/mine/:id` | `cancelMyPriceAlert` | — |
| POST | `/customer/support/alerts/stock` | `createStockAlert` | — |
| GET | `/customer/support/alerts/stock/mine` | `getMyStockAlerts` | — |
| DELETE | `/customer/support/alerts/stock/mine/:id` | `cancelMyStockAlert` | — |
| POST | `/customer/support/faq/articles/:id/feedback` | `submitFaqFeedback` | — |
| GET | `/customer/support/faq/articles/:slug` | `getFaqArticleBySlug` | — |
| GET | `/customer/support/faq/articles/popular` | `getPopularFaqArticles` | — |
| GET | `/customer/support/faq/categories` | `getFaqCategories` | — |
| GET | `/customer/support/faq/categories/:slug` | `getFaqCategoryBySlug` | — |
| GET | `/customer/support/faq/categories/featured` | `getFeaturedFaqCategories` | — |
| GET | `/customer/support/faq/search` | `searchFaq` | — |
| POST | `/customer/support/tickets` | `createTicket` | — |
| GET | `/customer/support/tickets/mine` | `getMyTickets` | — |
| GET | `/customer/support/tickets/mine/:id` | `getMyTicket` | — |
| POST | `/customer/support/tickets/mine/:id/feedback` | `submitTicketFeedback` | — |
| POST | `/customer/support/tickets/mine/:id/messages` | `addCustomerMessage` | — |

<!-- GENERATED:ENDPOINTS:END -->
