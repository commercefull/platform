/**
 * Subscription Customer Router
 * Routes for customer-facing subscription operations
 */

import { Router } from 'express';
import {
  // Browse
  getAvailableSubscriptionProducts,
  getSubscriptionProductDetails,
  getSubscriptionPlanDetails,
  // My Subscriptions
  getMySubscriptions,
  getMySubscription,
  createSubscription,
  updateMySubscription,
  changePlan,
  pauseMySubscription,
  resumeMySubscription,
  cancelMySubscription,
  reactivateMySubscription,
  // Billing
  getMySubscriptionOrders,
  skipNextDelivery
} from './controllers/subscriptionCustomerController';

const router = Router();

// ============================================================================
// Public Routes (Browse Subscription Products)
// ============================================================================

router.get('/products', getAvailableSubscriptionProducts);
router.get('/products/:productId', getSubscriptionProductDetails);
router.get('/plans/:planId', getSubscriptionPlanDetails);

// ============================================================================
// Authenticated Routes (My Subscriptions)
// ============================================================================

// List and view subscriptions
router.get('/mine', getMySubscriptions);
router.get('/mine/:id', getMySubscription);

// Create subscription
router.post('/subscribe', createSubscription);

// Manage subscription
router.put('/mine/:id', updateMySubscription);
router.post('/mine/:id/change-plan', changePlan);
router.post('/mine/:id/pause', pauseMySubscription);
router.post('/mine/:id/resume', resumeMySubscription);
router.post('/mine/:id/cancel', cancelMySubscription);
router.post('/mine/:id/reactivate', reactivateMySubscription);

// Skip delivery
router.post('/mine/:id/skip', skipNextDelivery);

// Billing history
router.get('/mine/:id/orders', getMySubscriptionOrders);

export const subscriptionCustomerRouter = router;
export default router;
