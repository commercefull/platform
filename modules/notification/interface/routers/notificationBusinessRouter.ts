import express from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
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
  getAllTemplates,
  getTemplateById,
  getTemplatesByType,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  getAllPreferences,
  getPreferencesByUser,
  updatePreferenceAdmin,
} from '../controllers/notificationBusinessController';

const router = express.Router();

router.use(isOrganizationLoggedIn);

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
// Template routes
// ============================================================================
router.get('/notification-templates', getAllTemplates);
router.post('/notification-templates', createTemplate);
router.get('/notification-templates/type/:type', getTemplatesByType);
router.get('/notification-templates/:id', getTemplateById);
router.put('/notification-templates/:id', updateTemplate);
router.delete('/notification-templates/:id', deleteTemplate);
router.post('/notification-templates/:id/preview', previewTemplate);

// ============================================================================
// Template translation routes
// ============================================================================
router.get('/notifications/templates/:templateId/translations', listTranslations);
router.post('/notifications/templates/:templateId/translations', upsertTranslation);

// ============================================================================
// Admin preference routes
// ============================================================================
router.get('/notification-preferences', getAllPreferences);
router.get('/notification-preferences/user/:userId', getPreferencesByUser);
router.put('/notification-preferences/:id', updatePreferenceAdmin);

export const notificationMerchantRouter = router;
