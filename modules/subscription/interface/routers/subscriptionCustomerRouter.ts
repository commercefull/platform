/**
 * Subscription Customer Router
 * Routes for customer-facing subscription operations
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isCustomerLoggedIn } from '../../../../libs/auth';
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
  skipNextDelivery,
} from '../controllers/subscriptionCustomerController';

const router = Router();

// ============================================================================
// Public Routes (Browse Subscription Products)
// ============================================================================

router.get('/subscriptions/products', asyncHandler(getAvailableSubscriptionProducts));
router.get('/subscriptions/products/:productId', asyncHandler(getSubscriptionProductDetails));
router.get('/subscriptions/plans/:planId', asyncHandler(getSubscriptionPlanDetails));

// ============================================================================
// Authenticated Routes (My Subscriptions)
// ============================================================================

// List and view subscriptions
router.get('/subscriptions/mine', isCustomerLoggedIn, asyncHandler(getMySubscriptions));
router.get('/subscriptions/mine/:id', isCustomerLoggedIn, asyncHandler(getMySubscription));

// Create subscription
router.post('/subscriptions/subscribe', isCustomerLoggedIn, asyncHandler(createSubscription));

// Manage subscription
router.put('/subscriptions/mine/:id', isCustomerLoggedIn, asyncHandler(updateMySubscription));
router.post('/subscriptions/mine/:id/change-plan', asyncHandler(changePlan));
router.post('/subscriptions/mine/:id/pause', asyncHandler(pauseMySubscription));
router.post('/subscriptions/mine/:id/resume', asyncHandler(resumeMySubscription));
router.post('/subscriptions/mine/:id/cancel', asyncHandler(cancelMySubscription));
router.post('/subscriptions/mine/:id/reactivate', asyncHandler(reactivateMySubscription));

// Skip delivery
router.post('/subscriptions/mine/:id/skip', asyncHandler(skipNextDelivery));

// Billing history
router.get('/subscriptions/mine/:id/orders', asyncHandler(getMySubscriptionOrders));

export const subscriptionCustomerRouter = router;
