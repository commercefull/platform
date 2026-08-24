import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
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
router.get('/notifications', asyncHandler(getAllNotifications));
router.post('/notifications', asyncHandler(createNotification));
router.get('/notifications/:id', asyncHandler(getNotificationById));
router.put('/notifications/:id', asyncHandler(updateNotification));
router.delete('/notifications/:id', asyncHandler(deleteNotification));
router.post('/notifications/:id/send', asyncHandler(markNotificationAsSent));

// ============================================================================
// User-specific routes (for logged-in merchant viewing their own notifications)
// ============================================================================
router.get('/notifications/unread', asyncHandler(getUnreadNotifications));
router.get('/notifications/recent', asyncHandler(getRecentNotifications));
router.get('/notifications/count', asyncHandler(getUnreadCount));
router.put('/notifications/:id/read', asyncHandler(markNotificationAsRead));
router.put('/notifications/read-all', asyncHandler(markAllNotificationsAsRead));

// ============================================================================
// Batch routes
// ============================================================================
router.get('/notifications/batches', asyncHandler(listBatches));
router.post('/notifications/batches', asyncHandler(sendBatch));
router.get('/notifications/batches/:batchId', asyncHandler(getBatch));

// ============================================================================
// Webhook routes
// ============================================================================
router.get('/notifications/webhooks', asyncHandler(listWebhooks));
router.post('/notifications/webhooks', asyncHandler(createWebhook));
router.delete('/notifications/webhooks/:webhookId', asyncHandler(deactivateWebhook));

// ============================================================================
// Template routes
// ============================================================================
router.get('/notification-templates', asyncHandler(getAllTemplates));
router.post('/notification-templates', asyncHandler(createTemplate));
router.get('/notification-templates/type/:type', asyncHandler(getTemplatesByType));
router.get('/notification-templates/:id', asyncHandler(getTemplateById));
router.put('/notification-templates/:id', asyncHandler(updateTemplate));
router.delete('/notification-templates/:id', asyncHandler(deleteTemplate));
router.post('/notification-templates/:id/preview', asyncHandler(previewTemplate));

// ============================================================================
// Template translation routes
// ============================================================================
router.get('/notifications/templates/:templateId/translations', asyncHandler(listTranslations));
router.post('/notifications/templates/:templateId/translations', asyncHandler(upsertTranslation));

// ============================================================================
// Admin preference routes
// ============================================================================
router.get('/notification-preferences', asyncHandler(getAllPreferences));
router.get('/notification-preferences/user/:userId', asyncHandler(getPreferencesByUser));
router.put('/notification-preferences/:id', asyncHandler(updatePreferenceAdmin));

export const notificationMerchantRouter = router;
