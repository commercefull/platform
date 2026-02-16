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
router.post('/quotes', quoteController.createQuote);
router.get('/quotes/:quoteId', quoteController.viewQuote);
router.post('/quotes/:quoteId', quoteController.updateQuote);

// Orders - Company-scoped
router.get('/orders', orderController.listOrders);
router.get('/orders/:orderId', orderController.viewOrder);
router.get('/orders/:orderId/reorder', orderController.reorderForm);
router.post('/orders/:orderId/reorder', orderController.submitReorder);

// Approvals - Company-scoped, role-restricted
router.get('/approvals', approvalController.listPendingApprovals);
router.get('/approvals/history', approvalController.listApprovalHistory);
router.get('/approvals/:approvalId', approvalController.viewApproval);
router.post('/approvals/:approvalId/approve', approvalController.approveRequest);
router.post('/approvals/:approvalId/reject', approvalController.rejectRequest);

export const b2bPortalRouter = router;
