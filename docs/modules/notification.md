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
| Preferences              | `notification/preference.skip.test.ts`     | 🟡    |
| Templates                | `notification/template.skip.test.ts`       | 🟡    |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/notification-preferences` | `getAllPreferences` | ============================================================================ Admin preference routes ============================================================================ |
| PUT | `/business/notification-preferences/:id` | `updatePreferenceAdmin` | — |
| GET | `/business/notification-preferences/user/:userId` | `getPreferencesByUser` | — |
| GET | `/business/notification-templates` | `getAllTemplates` | ============================================================================ Template routes ============================================================================ |
| POST | `/business/notification-templates` | `createTemplate` | — |
| GET | `/business/notification-templates/:id` | `getTemplateById` | — |
| PUT | `/business/notification-templates/:id` | `updateTemplate` | — |
| DELETE | `/business/notification-templates/:id` | `deleteTemplate` | — |
| POST | `/business/notification-templates/:id/preview` | `previewTemplate` | — |
| GET | `/business/notification-templates/type/:type` | `getTemplatesByType` | — |
| GET | `/business/notifications` | `getAllNotifications` | ============================================================================ Admin CRUD routes for notifications ============================================================================ |
| POST | `/business/notifications` | `createNotification` | — |
| GET | `/business/notifications/:id` | `getNotificationById` | — |
| PUT | `/business/notifications/:id` | `updateNotification` | — |
| DELETE | `/business/notifications/:id` | `deleteNotification` | — |
| PUT | `/business/notifications/:id/read` | `markNotificationAsRead` | — |
| POST | `/business/notifications/:id/send` | `markNotificationAsSent` | — |
| GET | `/business/notifications/batches` | `listBatches` | ============================================================================ Batch routes ============================================================================ |
| POST | `/business/notifications/batches` | `sendBatch` | — |
| GET | `/business/notifications/batches/:batchId` | `getBatch` | — |
| GET | `/business/notifications/count` | `getUnreadCount` | — |
| PUT | `/business/notifications/read-all` | `markAllNotificationsAsRead` | — |
| GET | `/business/notifications/recent` | `getRecentNotifications` | — |
| GET | `/business/notifications/templates/:templateId/translations` | `listTranslations` | ============================================================================ Template translation routes ============================================================================ |
| POST | `/business/notifications/templates/:templateId/translations` | `upsertTranslation` | — |
| GET | `/business/notifications/unread` | `getUnreadNotifications` | ============================================================================ User-specific routes (for logged-in merchant viewing their own notifications) ============================================================================ |
| GET | `/business/notifications/webhooks` | `listWebhooks` | ============================================================================ Webhook routes ============================================================================ |
| POST | `/business/notifications/webhooks` | `createWebhook` | — |
| DELETE | `/business/notifications/webhooks/:webhookId` | `deactivateWebhook` | — |
| GET | `/customer/notifications` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| GET | `/customer/notifications/:id` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| PUT | `/customer/notifications/:notificationId/read` | `async (req, res) => {
  try {
    const useCase = new MarkAs` | — |
| PATCH | `/customer/notifications/:notificationId/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| GET | `/customer/notifications/count` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| GET | `/customer/notifications/devices` | `listDevices` | — |
| POST | `/customer/notifications/devices` | `registerDevice` | — |
| DELETE | `/customer/notifications/devices/:deviceToken` | `deleteDevice` | — |
| GET | `/customer/notifications/preferences` | `getPreferences` | — |
| POST | `/customer/notifications/preferences` | `createPreference` | — |
| GET | `/customer/notifications/preferences/:id` | `getPreferenceById` | — |
| PUT | `/customer/notifications/preferences/:id` | `updatePreference` | — |
| DELETE | `/customer/notifications/preferences/:id` | `deletePreference` | — |
| PUT | `/customer/notifications/preferences/:id/schedule` | `updateSchedule` | — |
| POST | `/customer/notifications/preferences/bulk` | `bulkUpdatePreferences` | — |
| GET | `/customer/notifications/preferences/type/:type` | `getPreferenceByType` | — |
| PUT | `/customer/notifications/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| POST | `/customer/notifications/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| GET | `/customer/notifications/unread-count` | `async (req, res) => {
  try {
    const customerId = req.use` | — |

<!-- GENERATED:ENDPOINTS:END -->
