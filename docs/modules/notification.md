# Notification Feature

## Overview

The Notification feature manages in-app notifications for merchants and administrators. It provides real-time alerts for important events like new orders, low stock, and customer inquiries.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-NOT-001 | Get Unread Notifications | Merchant/Admin | Retrieve the merchant's unread notifications with pagination |
| UC-NOT-002 | Get Recent Notifications | Merchant/Admin | Retrieve recent notifications (both read and unread) with pagination |
| UC-NOT-003 | Get Unread Count | Merchant/Admin | Retrieve the count of unread notifications for badge display |
| UC-NOT-004 | Mark Notification as Read | Merchant/Admin | Mark a specific notification as read |
| UC-NOT-005 | Mark All as Read | Merchant/Admin | Mark all unread notifications as read |
| UC-NOT-006 | Delete Notification | Merchant/Admin | Permanently delete a notification |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-NOT-001 | GET | `/business/notifications/unread` |
| UC-NOT-002 | GET | `/business/notifications/recent` |
| UC-NOT-003 | GET | `/business/notifications/count` |
| UC-NOT-004 | PUT | `/business/notifications/:id/read` |
| UC-NOT-005 | PUT | `/business/notifications/read-all` |
| UC-NOT-006 | DELETE | `/business/notifications/:id` |

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

| Use Case                 | Test File                                  | Status |
| ------------------------ | ------------------------------------------ | ------ |
| UC-NOT-001 to UC-NOT-006 | `notification/notificationExpanded.test.ts` | ✅    |
