# Notification Feature

## Overview

The Notification feature manages in-app notifications for merchants and administrators. It provides real-time alerts for important events like new orders, low stock, and customer inquiries.

---

## Use Cases

### Notification Management (Business)

### UC-NOT-001: Get Unread Notifications (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request unread notifications  
**Then** the system returns their unread notifications

#### API Endpoint

```
GET /business/notifications/unread
Query: limit, offset
```

---

### UC-NOT-002: Get Recent Notifications (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request recent notifications  
**Then** the system returns recent notifications (read and unread)

#### API Endpoint

```
GET /business/notifications/recent
Query: limit, offset
```

---

### UC-NOT-003: Get Unread Count (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request unread count  
**Then** the system returns the number of unread notifications

#### API Endpoint

```
GET /business/notifications/count
```

---

### UC-NOT-004: Mark Notification as Read (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** an unread notification  
**When** they mark it as read  
**Then** the notification is marked as read

#### API Endpoint

```
PUT /business/notifications/:id/read
```

---

### UC-NOT-005: Mark All as Read (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** multiple unread notifications  
**When** they mark all as read  
**Then** all notifications are marked as read

#### API Endpoint

```
PUT /business/notifications/read-all
```

---

### UC-NOT-006: Delete Notification (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** an authenticated merchant  
**And** a notification  
**When** they delete it  
**Then** the notification is removed

#### API Endpoint

```
DELETE /business/notifications/:id
```

---

## Notification Types

| Type                          | Trigger                | Priority |
| ----------------------------- | ---------------------- | -------- |
| `order.new`                   | New order placed       | High     |
| `order.cancelled`             | Order cancelled        | High     |
| `order.refund_requested`      | Refund requested       | High     |
| `inventory.low_stock`         | Stock below threshold  | Medium   |
| `inventory.out_of_stock`      | Stock depleted         | High     |
| `support.new_ticket`          | New support ticket     | Medium   |
| `support.ticket_reply`        | Customer replied       | Medium   |
| `review.new`                  | New product review     | Low      |
| `review.flagged`              | Review flagged         | Medium   |
| `b2b.company_registered`      | New B2B company        | Medium   |
| `b2b.quote_requested`         | Quote requested        | Medium   |
| `subscription.payment_failed` | Payment failed         | High     |
| `subscription.cancelled`      | Subscription cancelled | Medium   |

---

## Events Emitted

| Event                  | Trigger              | Payload                      |
| ---------------------- | -------------------- | ---------------------------- |
| `notification.created` | Notification created | notificationId, userId, type |
| `notification.read`    | Notification read    | notificationId               |
| `notification.deleted` | Notification deleted | notificationId               |

---

## Integration Test Coverage

| Use Case                 | Test File                           | Status |
| ------------------------ | ----------------------------------- | ------ |
| UC-NOT-001 to UC-NOT-006 | `notification/notification.test.ts` | 🟡     |
