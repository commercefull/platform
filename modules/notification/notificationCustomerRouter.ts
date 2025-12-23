/**
 * Notification Customer Router
 *
 * Customer-facing routes for notification management.
 */

import express from 'express';
import { isCustomerLoggedIn } from '../../libs/auth';
import { GetNotificationsUseCase, MarkAsReadUseCase } from './application/useCases';
import notificationRepo from './repos/notificationRepo';

const router = express.Router();

router.use(isCustomerLoggedIn);

/**
 * Get customer's notifications
 * GET /notifications
 */
router.get('/notifications', async (req, res) => {
  try {
    const useCase = new GetNotificationsUseCase(notificationRepo);
    const customerId = (req as any).customer?.customerId;

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

/**
 * Get unread notification count
 * GET /notifications/count
 */
router.get('/notifications/count', async (req, res) => {
  try {
    const useCase = new GetNotificationsUseCase(notificationRepo);
    const customerId = (req as any).customer?.customerId;

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

/**
 * Mark notification as read
 * PUT /notifications/:notificationId/read
 */
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const useCase = new MarkAsReadUseCase(notificationRepo);
    const customerId = (req as any).customer?.customerId;

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

/**
 * Mark multiple notifications as read
 * PUT /notifications/read
 */
router.put('/notifications/read', async (req, res) => {
  try {
    const useCase = new MarkAsReadUseCase(notificationRepo);
    const customerId = (req as any).customer?.customerId;

    if (!customerId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const notificationIds = req.body.notificationIds;
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ success: false, error: 'notificationIds array is required' });
    }

    const result = await useCase.execute({
      notificationIds,
      recipientId: customerId,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export const notificationCustomerRouter = router;
