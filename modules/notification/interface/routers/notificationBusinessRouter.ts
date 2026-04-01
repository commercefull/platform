import express from 'express';
import { isMerchantLoggedIn } from '../../../../libs/auth';
import {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  markNotificationAsSent,
  getUnreadNotifications,
  getRecentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  listBatches,
  getBatch,
  sendBatch,
  listWebhooks,
  createWebhook,
  deactivateWebhook,
  listTranslations,
  upsertTranslation,
} from '../controllers/notificationBusinessController';

const router = express.Router();

router.use(isMerchantLoggedIn);

// ============================================================================
// Admin CRUD routes for notifications
// ============================================================================
router.get('/notifications', getAllNotifications);
router.post('/notifications', createNotification);
router.get('/notifications/:id', getNotificationById);
router.put('/notifications/:id', updateNotification);
router.delete('/notifications/:id', deleteNotification);
router.post('/notifications/:id/send', markNotificationAsSent);

// ============================================================================
// User-specific routes (for logged-in merchant viewing their own notifications)
// ============================================================================
router.get('/notifications/unread', getUnreadNotifications);
router.get('/notifications/recent', getRecentNotifications);
router.get('/notifications/count', getUnreadCount);
router.put('/notifications/:id/read', markNotificationAsRead);
router.put('/notifications/read-all', markAllNotificationsAsRead);

// ============================================================================
// Batch routes
// ============================================================================
router.get('/notifications/batches', listBatches);
router.post('/notifications/batches', sendBatch);
router.get('/notifications/batches/:batchId', getBatch);

// ============================================================================
// Webhook routes
// ============================================================================
router.get('/notifications/webhooks', listWebhooks);
router.post('/notifications/webhooks', createWebhook);
router.delete('/notifications/webhooks/:webhookId', deactivateWebhook);

// ============================================================================
// Template translation routes
// ============================================================================
router.get('/notifications/templates/:templateId/translations', listTranslations);
router.post('/notifications/templates/:templateId/translations', upsertTranslation);

export const notificationMerchantRouter = router;
