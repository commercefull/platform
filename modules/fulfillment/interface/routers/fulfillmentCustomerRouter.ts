/**
 * Fulfillment Customer Router
 */

import { Router } from 'express';
import { getFulfillment } from '../controllers/FulfillmentController';

const router = Router();

// Get fulfillment by ID (customer view)
router.get('/:fulfillmentId', getFulfillment);

// Track fulfillment
router.get('/:fulfillmentId/track', async (req, res) => {
  try {
    // For now, return basic tracking info from fulfillment
    res.json({
      success: true,
      data: {
        fulfillmentId: req.params.fulfillmentId,
        message: 'Tracking endpoint - use fulfillment get for details',
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
