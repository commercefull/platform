/**
 * Notification Customer Router
 *
 * Customer-facing routes for notification preferences and device management.
 */

import express from 'express';
import { isCustomerLoggedIn } from '../../../../libs/auth';
import { MarkAsReadUseCase } from '../../application/useCases';
import notificationRepo from '../../infrastructure/repositories/notificationRepo';
import * as notificationCustomerController from '../controllers/notificationCustomerController';

const router = express.Router();

router.use('/notifications', isCustomerLoggedIn);

// ============================================================================
// Existing notification read/mark-read routes
// ============================================================================

router.get('/notifications', async (req, res) => {
  try {
    const customerId = req.user?.customerId || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = unreadOnly
      ? await notificationRepo.findUnreadByUser(customerId)
      : await notificationRepo.findByUser(customerId, limit);

    res.json({ success: true, data: notifications });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.get('/notifications/:id', async (req, res) => {
  try {
    const customerId = req.user?.customerId || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const notification = await notificationRepo.findById(String(req.params.id));
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.get('/notifications/count', async (req, res) => {
  try {
    const customerId = req.user?.customerId || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const unreadCount = await notificationRepo.countUnread(customerId);
    res.json({ success: true, data: { unreadCount } });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.get('/notifications/unread-count', async (req, res) => {
  try {
    const customerId = req.user?.customerId || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const count = await notificationRepo.countUnread(customerId);
    res.json({ success: true, data: { count } });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const useCase = new MarkAsReadUseCase(notificationRepo);
    const customerId = req.user?.customerId || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const result = await useCase.execute({
      notificationIds: [req.params.notificationId],
      recipientId: customerId,
    });

    res.json({ success: true, data: result });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.patch('/notifications/:notificationId/read', async (req, res) => {
  try {
    const customerId = req.user?.customerId || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const result = await notificationRepo.markAsRead(req.params.notificationId);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put('/notifications/read', async (req, res) => {
  try {
    const customerId = req.user?.customerId || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const notificationIds = req.body.notificationIds;
    if (notificationIds && Array.isArray(notificationIds)) {
      const useCase = new MarkAsReadUseCase(notificationRepo);
      const result = await useCase.execute({ notificationIds, recipientId: customerId });
      res.json({ success: true, data: result });
    } else {
      // Mark all as read
      const count = await notificationRepo.markAllAsRead(customerId);
      res.json({ success: true, data: { markedCount: count } });
    }
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/notifications/read', async (req, res) => {
  try {
    const customerId = req.user?.customerId || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const count = await notificationRepo.markAllAsRead(customerId);
    res.json({ success: true, data: { markedCount: count } });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// ============================================================================
// Preferences
// ============================================================================

router.get('/notifications/preferences', notificationCustomerController.getPreferences);
router.get('/notifications/preferences/type/:type', notificationCustomerController.getPreferenceByType);
router.get('/notifications/preferences/:id', notificationCustomerController.getPreferenceById);
router.post('/notifications/preferences', notificationCustomerController.createPreference);
router.post('/notifications/preferences/bulk', notificationCustomerController.bulkUpdatePreferences);
router.put('/notifications/preferences/:id/schedule', notificationCustomerController.updateSchedule);
router.put('/notifications/preferences/:id', notificationCustomerController.updatePreference);
router.delete('/notifications/preferences/:id', notificationCustomerController.deletePreference);

// ============================================================================
// Devices
// ============================================================================

router.get('/notifications/devices', notificationCustomerController.listDevices);
router.post('/notifications/devices', notificationCustomerController.registerDevice);
router.delete('/notifications/devices/:deviceToken', notificationCustomerController.deleteDevice);

export const notificationCustomerRouter = router;
