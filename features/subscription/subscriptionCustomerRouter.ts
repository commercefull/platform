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

router.get('/subscriptions/products', getAvailableSubscriptionProducts);
router.get('/subscriptions/products/:productId', getSubscriptionProductDetails);
router.get('/subscriptions/plans/:planId', getSubscriptionPlanDetails);

// ============================================================================
// Authenticated Routes (My Subscriptions)
// ============================================================================

// List and view subscriptions
router.get('/subscriptions/mine', getMySubscriptions);
router.get('/subscriptions/mine/:id', getMySubscription);

// Create subscription
router.post('/subscriptions/subscribe', createSubscription);

// Manage subscription
router.put('/subscriptions/mine/:id', updateMySubscription);
router.post('/subscriptions/mine/:id/change-plan', changePlan);
router.post('/subscriptions/mine/:id/pause', pauseMySubscription);
router.post('/subscriptions/mine/:id/resume', resumeMySubscription);
router.post('/subscriptions/mine/:id/cancel', cancelMySubscription);
router.post('/subscriptions/mine/:id/reactivate', reactivateMySubscription);

// Skip delivery
router.post('/subscriptions/mine/:id/skip', skipNextDelivery);

// Billing history
router.get('/subscriptions/mine/:id/orders', getMySubscriptionOrders);

export const subscriptionCustomerRouter = router;
