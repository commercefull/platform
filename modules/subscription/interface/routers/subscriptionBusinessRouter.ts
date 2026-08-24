/**
 * Subscription Business Router
 * Routes for admin/merchant subscription operations
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  // Subscription Products
  getSubscriptionProducts,
  getSubscriptionProduct,
  createSubscriptionProduct,
  updateSubscriptionProduct,
  deleteSubscriptionProduct,
  // Subscription Plans
  getSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  // Customer Subscriptions
  getCustomerSubscriptions,
  getCustomerSubscription,
  cancelSubscriptionAdmin,
  pauseSubscriptionAdmin,
  resumeSubscriptionAdmin,
  updateSubscriptionStatus,
  // Subscription Orders
  getSubscriptionOrders,
  retrySubscriptionOrder,
  skipSubscriptionOrder,
  // Dunning
  getDunningAttempts,
  getPendingDunning,
  // Billing
  getSubscriptionsDueBilling,
  processBillingCycle,
} from '../controllers/subscriptionBusinessController';

const router = Router();

router.use(isOrganizationLoggedIn);

// ============================================================================
// Subscription Product Routes
// ============================================================================

router.get('/subscriptions/products', asyncHandler(getSubscriptionProducts));
router.get('/subscriptions/products/:id', asyncHandler(getSubscriptionProduct));
router.post('/subscriptions/products', asyncHandler(createSubscriptionProduct));
router.put('/subscriptions/products/:id', asyncHandler(updateSubscriptionProduct));
router.delete('/subscriptions/products/:id', asyncHandler(deleteSubscriptionProduct));

// ============================================================================
// Subscription Plan Routes
// ============================================================================

router.get('/subscriptions/products/:productId/plans', asyncHandler(getSubscriptionPlans));
router.get('/subscriptions/products/:productId/plans/:planId', asyncHandler(getSubscriptionPlan));
router.post('/subscriptions/products/:productId/plans', asyncHandler(createSubscriptionPlan));
router.put('/subscriptions/products/:productId/plans/:planId', asyncHandler(updateSubscriptionPlan));
router.delete('/subscriptions/products/:productId/plans/:planId', asyncHandler(deleteSubscriptionPlan));

// ============================================================================
// Customer Subscription Routes
// ============================================================================

router.get('/subscriptions', asyncHandler(getCustomerSubscriptions));
router.get('/subscriptions/:id', asyncHandler(getCustomerSubscription));
router.post('/subscriptions/:id/cancel', asyncHandler(cancelSubscriptionAdmin));
router.post('/subscriptions/:id/pause', asyncHandler(pauseSubscriptionAdmin));
router.post('/subscriptions/:id/resume', asyncHandler(resumeSubscriptionAdmin));
router.put('/subscriptions/:id/status', asyncHandler(updateSubscriptionStatus));

// Subscription Orders
router.get('/subscriptions/:subscriptionId/orders', asyncHandler(getSubscriptionOrders));
router.post('/subscriptions/orders/:orderId/retry', asyncHandler(retrySubscriptionOrder));
router.post('/subscriptions/orders/:orderId/skip', asyncHandler(skipSubscriptionOrder));

// ============================================================================
// Dunning Routes
// ============================================================================

router.get('/subscriptions/:subscriptionId/dunning', asyncHandler(getDunningAttempts));
router.get('/subscriptions/dunning/pending', asyncHandler(getPendingDunning));

// ============================================================================
// Billing Operations
// ============================================================================

router.get('/subscriptions/billing/due', asyncHandler(getSubscriptionsDueBilling));
router.post('/subscriptions/:id/bill', asyncHandler(processBillingCycle));

export const subscriptionBusinessRouter = router;
