/**
 * Notification Customer Router
 *
 * Customer-facing routes for notification preferences and device management.
 */

import express from 'express';
import { isCustomerLoggedIn } from '../../../../libs/auth';
import { GetNotificationsUseCase, MarkAsReadUseCase } from '../../application/useCases';
import notificationRepo from '../../infrastructure/repositories/notificationRepo';
import * as notificationCustomerController from '../controllers/notificationCustomerController';

const router = express.Router();

router.use(isCustomerLoggedIn);

// ============================================================================
// Existing notification read/mark-read routes
// ============================================================================

router.get('/notifications', async (req, res) => {
  try {
    const useCase = new GetNotificationsUseCase(notificationRepo);
    const customerId = req.user?.customerId;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const result = await useCase.execute({
      recipientId: customerId,
      recipientType: 'customer',
      limit: parseInt(req.query.limit as string) || 20,
      page: parseInt(req.query.page as string) || 1,
      unreadOnly: req.query.unreadOnly === 'true',
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/notifications/count', async (req, res) => {
  try {
    const useCase = new GetNotificationsUseCase(notificationRepo);
    const customerId = req.user?.customerId;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const result = await useCase.execute({
      recipientId: customerId,
      recipientType: 'customer',
      unreadOnly: true,
      limit: 1,
      page: 1,
    });

    res.json({ success: true, data: { unreadCount: result.unreadCount || 0 } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const useCase = new MarkAsReadUseCase(notificationRepo);
    const customerId = req.user?.customerId;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const result = await useCase.execute({
      notificationIds: [req.params.notificationId],
      recipientId: customerId,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/notifications/read', async (req, res) => {
  try {
    const useCase = new MarkAsReadUseCase(notificationRepo);
    const customerId = req.user?.customerId;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const notificationIds = req.body.notificationIds;
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ success: false, error: 'notificationIds array is required' });
    }

    const result = await useCase.execute({ notificationIds, recipientId: customerId });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// Preferences
// ============================================================================

router.get('/notifications/preferences', notificationCustomerController.getPreferences);
router.post('/notifications/preferences', notificationCustomerController.updatePreference);

// ============================================================================
// Devices
// ============================================================================

router.get('/notifications/devices', notificationCustomerController.listDevices);
router.post('/notifications/devices', notificationCustomerController.registerDevice);
router.delete('/notifications/devices/:deviceToken', notificationCustomerController.deleteDevice);

export const notificationCustomerRouter = router;
