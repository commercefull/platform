/**
 * Subscription Business Router
 * Routes for admin/merchant subscription operations
 */

import { Router } from 'express';
import { isMerchantLoggedIn } from '../../libs/auth';
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
} from './controllers/subscriptionBusinessController';

const router = Router();

router.use(isMerchantLoggedIn);

// ============================================================================
// Subscription Product Routes
// ============================================================================

router.get('/subscriptions/products', getSubscriptionProducts);
router.get('/subscriptions/products/:id', getSubscriptionProduct);
router.post('/subscriptions/products', createSubscriptionProduct);
router.put('/subscriptions/products/:id', updateSubscriptionProduct);
router.delete('/subscriptions/products/:id', deleteSubscriptionProduct);

// ============================================================================
// Subscription Plan Routes
// ============================================================================

router.get('/subscriptions/products/:productId/plans', getSubscriptionPlans);
router.get('/subscriptions/products/:productId/plans/:planId', getSubscriptionPlan);
router.post('/subscriptions/products/:productId/plans', createSubscriptionPlan);
router.put('/subscriptions/products/:productId/plans/:planId', updateSubscriptionPlan);
router.delete('/subscriptions/products/:productId/plans/:planId', deleteSubscriptionPlan);

// ============================================================================
// Customer Subscription Routes
// ============================================================================

router.get('/subscriptions', getCustomerSubscriptions);
router.get('/subscriptions/:id', getCustomerSubscription);
router.post('/subscriptions/:id/cancel', cancelSubscriptionAdmin);
router.post('/subscriptions/:id/pause', pauseSubscriptionAdmin);
router.post('/subscriptions/:id/resume', resumeSubscriptionAdmin);
router.put('/subscriptions/:id/status', updateSubscriptionStatus);

// Subscription Orders
router.get('/subscriptions/:subscriptionId/orders', getSubscriptionOrders);
router.post('/subscriptions/orders/:orderId/retry', retrySubscriptionOrder);
router.post('/subscriptions/orders/:orderId/skip', skipSubscriptionOrder);

// ============================================================================
// Dunning Routes
// ============================================================================

router.get('/subscriptions/:subscriptionId/dunning', getDunningAttempts);
router.get('/subscriptions/dunning/pending', getPendingDunning);

// ============================================================================
// Billing Operations
// ============================================================================

router.get('/subscriptions/billing/due', getSubscriptionsDueBilling);
router.post('/subscriptions/:id/bill', processBillingCycle);

export const subscriptionBusinessRouter = router;
