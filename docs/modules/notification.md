# Notification Feature

## Overview

The Notification feature manages in-app notifications for merchants and administrators. It provides real-time alerts for important events like new orders, low stock, and customer inquiries.

---

## Use Cases

| ID         | Use Case                  | Actor          | Purpose                                                              |
| ---------- | ------------------------- | -------------- | -------------------------------------------------------------------- |
| UC-NOT-001 | Get Unread Notifications  | Merchant/Admin | Retrieve the merchant's unread notifications with pagination         |
| UC-NOT-002 | Get Recent Notifications  | Merchant/Admin | Retrieve recent notifications (both read and unread) with pagination |
| UC-NOT-003 | Get Unread Count          | Merchant/Admin | Retrieve the count of unread notifications for badge display         |
| UC-NOT-004 | Mark Notification as Read | Merchant/Admin | Mark a specific notification as read                                 |
| UC-NOT-005 | Mark All as Read          | Merchant/Admin | Mark all unread notifications as read                                |
| UC-NOT-006 | Delete Notification       | Merchant/Admin | Permanently delete a notification                                    |

### API Endpoints

| ID         | Method | Endpoint                           |
| ---------- | ------ | ---------------------------------- |
| UC-NOT-001 | GET    | `/business/notifications/unread`   |
| UC-NOT-002 | GET    | `/business/notifications/recent`   |
| UC-NOT-003 | GET    | `/business/notifications/count`    |
| UC-NOT-004 | PUT    | `/business/notifications/:id/read` |
| UC-NOT-005 | PUT    | `/business/notifications/read-all` |
| UC-NOT-006 | DELETE | `/business/notifications/:id`      |

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

| Use Case                 | Test File                                   | Status |
| ------------------------ | ------------------------------------------- | ------ |
| UC-NOT-001 to UC-NOT-006 | `notification/notificationExpanded.test.ts` | ✅     |
| Preferences              | `notification/preference.skip.test.ts`      | 🟡     |
| Templates                | `notification/template.skip.test.ts`        | 🟡     |

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/notification-preferences` | `asyncHandler(getAllPreferences)` | ============================================================================ Admin preference routes ============================================================================ |
| PUT | `/notification-preferences/:id` | `asyncHandler(updatePreferenceAdmin)` | — |
| GET | `/notification-preferences/user/:userId` | `asyncHandler(getPreferencesByUser)` | — |
| GET | `/notification-templates` | `asyncHandler(getAllTemplates)` | ============================================================================ Template routes ============================================================================ |
| POST | `/notification-templates` | `asyncHandler(createTemplate)` | — |
| GET | `/notification-templates/:id` | `asyncHandler(getTemplateById)` | — |
| PUT | `/notification-templates/:id` | `asyncHandler(updateTemplate)` | — |
| DELETE | `/notification-templates/:id` | `asyncHandler(deleteTemplate)` | — |
| POST | `/notification-templates/:id/preview` | `asyncHandler(previewTemplate)` | — |
| GET | `/notification-templates/type/:type` | `asyncHandler(getTemplatesByType)` | — |
| GET | `/notifications` | `asyncHandler(getAllNotifications)` | ============================================================================ Literal notification routes — must be registered before /notifications/:id ============================================================================ |
| POST | `/notifications` | `asyncHandler(createNotification)` | — |
| GET | `/notifications` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| GET | `/notifications/:id` | `asyncHandler(getNotificationById)` | ============================================================================ Admin CRUD routes for notifications (parameterized — after all literals) ============================================================================ |
| PUT | `/notifications/:id` | `asyncHandler(updateNotification)` | — |
| DELETE | `/notifications/:id` | `asyncHandler(deleteNotification)` | — |
| GET | `/notifications/:id` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| PUT | `/notifications/:id/read` | `asyncHandler(markNotificationAsRead)` | — |
| POST | `/notifications/:id/send` | `asyncHandler(markNotificationAsSent)` | — |
| PUT | `/notifications/:notificationId/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| PATCH | `/notifications/:notificationId/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| GET | `/notifications/batches` | `asyncHandler(listBatches)` | ============================================================================ Batch routes ============================================================================ |
| POST | `/notifications/batches` | `asyncHandler(sendBatch)` | — |
| GET | `/notifications/batches/:batchId` | `asyncHandler(getBatch)` | — |
| GET | `/notifications/count` | `asyncHandler(getUnreadCount)` | — |
| GET | `/notifications/count` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| GET | `/notifications/devices` | `asyncHandler(notificationCustomerController.listDevices)` | — |
| POST | `/notifications/devices` | `asyncHandler(notificationCustomerController.registerDevice)` | — |
| DELETE | `/notifications/devices/:deviceToken` | `asyncHandler(notificationCustomerController.deleteDevice)` | — |
| GET | `/notifications/preferences` | `asyncHandler(notificationCustomerController.getPreferences)` | — |
| POST | `/notifications/preferences` | `asyncHandler(notificationCustomerController.createPreference` | — |
| GET | `/notifications/preferences/:id` | `asyncHandler(notificationCustomerController.getPreferenceByI` | — |
| PUT | `/notifications/preferences/:id` | `asyncHandler(notificationCustomerController.updatePreference` | — |
| DELETE | `/notifications/preferences/:id` | `asyncHandler(notificationCustomerController.deletePreference` | — |
| PUT | `/notifications/preferences/:id/schedule` | `asyncHandler(notificationCustomerController.updateSchedule)` | — |
| POST | `/notifications/preferences/bulk` | `asyncHandler(notificationCustomerController.bulkUpdatePrefer` | — |
| GET | `/notifications/preferences/type/:type` | `asyncHandler(notificationCustomerController.getPreferenceByT` | — |
| PUT | `/notifications/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| POST | `/notifications/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| PUT | `/notifications/read-all` | `asyncHandler(markAllNotificationsAsRead)` | — |
| GET | `/notifications/recent` | `asyncHandler(getRecentNotifications)` | — |
| GET | `/notifications/templates/:templateId/translations` | `asyncHandler(listTranslations)` | ============================================================================ Template translation routes ============================================================================ |
| POST | `/notifications/templates/:templateId/translations` | `asyncHandler(upsertTranslation)` | — |
| GET | `/notifications/unread` | `asyncHandler(getUnreadNotifications)` | — |
| GET | `/notifications/unread-count` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| GET | `/notifications/webhooks` | `asyncHandler(listWebhooks)` | ============================================================================ Webhook routes ============================================================================ |
| POST | `/notifications/webhooks` | `asyncHandler(createWebhook)` | — |
| DELETE | `/notifications/webhooks/:webhookId` | `asyncHandler(deactivateWebhook)` | — |

<!-- GENERATED:ENDPOINTS:END -->
