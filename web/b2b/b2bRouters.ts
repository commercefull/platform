/**
 * B2B Portal Router
 * Routes for the B2B vendor self-service portal
 */

import express from 'express';
import { isB2BLoggedIn } from '../../libs/auth';

// Controllers
import * as authController from './controllers/authController';
import * as dashboardController from './controllers/dashboardController';
import * as quoteController from './controllers/quoteController';
import * as orderController from './controllers/orderController';
import * as approvalController from './controllers/approvalController';

const router = express.Router();

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.post('/logout', authController.postLogout);

// ============================================================================
// Protected Routes (B2B auth required)
// ============================================================================

router.use(isB2BLoggedIn);

// Dashboard
router.get('/', dashboardController.getDashboard);

// Quotes - Company-scoped
router.get('/quotes', quoteController.listQuotes);
router.get('/quotes/create', quoteController.createQuoteForm);
router.get('/quotes/:quoteId', quoteController.viewQuote);

// Orders - Company-scoped
router.get('/orders', orderController.listOrders);
router.get('/orders/:orderId', orderController.viewOrder);
router.get('/orders/:orderId/reorder', orderController.reorderForm);

// Approvals - Company-scoped, role-restricted
router.get('/approvals', approvalController.listPendingApprovals);
router.get('/approvals/history', approvalController.listApprovalHistory);
router.get('/approvals/:approvalId', approvalController.viewApproval);

// TODO: Add more routes as needed
// - /catalog - Browse products with company pricing
// - /users - Company user management (admin only)
// - /account - Company profile and addresses

export const b2bPortalRouter = router;
