/**
 * Payment Business Router
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as paymentController from '../controllers/PaymentController';
import * as fraudController from '../controllers/fraudController';
import * as paymentBusinessController from '../controllers/paymentBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use(isOrganizationLoggedIn);

// ============================================================================
// Gateway Routes
// ============================================================================
router.get('/gateways', asyncHandler(paymentController.listGateways));
router.get('/gateways/:gatewayId', asyncHandler(paymentController.getGateway));
router.post('/gateways', asyncHandler(paymentController.createGateway));
router.put('/gateways/:gatewayId', asyncHandler(paymentController.updateGateway));
router.delete('/gateways/:gatewayId', asyncHandler(paymentController.deleteGateway));

// ============================================================================
// Method Config Routes
// ============================================================================
router.get('/method-configs', asyncHandler(paymentController.listMethodConfigs));
router.get('/method-configs/:methodConfigId', asyncHandler(paymentController.getMethodConfig));
router.post('/method-configs', asyncHandler(paymentController.createMethodConfig));
router.put('/method-configs/:methodConfigId', asyncHandler(paymentController.updateMethodConfig));
router.delete('/method-configs/:methodConfigId', asyncHandler(paymentController.deleteMethodConfig));

// ============================================================================
// Transaction Routes
// ============================================================================
router.get('/transactions', asyncHandler(paymentController.listTransactions));
router.get('/transactions/:transactionId', asyncHandler(paymentController.getTransaction));
router.post('/transactions', asyncHandler(paymentController.initiatePayment));
router.delete('/transactions/:transactionId', asyncHandler(paymentController.deleteTransaction));
router.get('/transactions/:transactionId/refunds', asyncHandler(paymentController.getRefunds));
router.post('/transactions/:transactionId/refund', asyncHandler(paymentController.processRefund));

// Fraud Prevention routes
router.get('/fraud/rules', asyncHandler(fraudController.getFraudRules));
router.get('/fraud/rules/:id', asyncHandler(fraudController.getFraudRule));
router.post('/fraud/rules', asyncHandler(fraudController.createFraudRule));
router.put('/fraud/rules/:id', asyncHandler(fraudController.updateFraudRule));
router.delete('/fraud/rules/:id', asyncHandler(fraudController.deleteFraudRule));

router.get('/fraud/checks', asyncHandler(fraudController.getFraudChecks));
router.get('/fraud/checks/:id', asyncHandler(fraudController.getFraudCheck));
router.get('/fraud/reviews', asyncHandler(fraudController.getPendingReviews));
router.post('/fraud/checks/:id/review', asyncHandler(fraudController.reviewFraudCheck));

router.get('/fraud/blacklist', asyncHandler(fraudController.getBlacklist));
router.post('/fraud/blacklist', asyncHandler(fraudController.addToBlacklist));
router.delete('/fraud/blacklist/:id', asyncHandler(fraudController.removeFromBlacklist));

// ============================================================================
// Dispute Routes
// ============================================================================
router.get('/payment/disputes', asyncHandler(paymentBusinessController.listDisputes));
router.post('/payment/disputes', asyncHandler(paymentBusinessController.listDisputes));
router.get('/payment/disputes/:disputeId', asyncHandler(paymentBusinessController.getDispute));
router.patch('/payment/disputes/:disputeId', asyncHandler(paymentBusinessController.updateDisputeStatus));

// ============================================================================
// Fee Routes
// ============================================================================
router.get('/payment/fees', asyncHandler(paymentBusinessController.listFees));

// ============================================================================
// Settings Routes
// ============================================================================
router.get('/payment/settings', asyncHandler(paymentBusinessController.getSettings));
router.post('/payment/settings', asyncHandler(paymentBusinessController.updateSettings));

// ============================================================================
// Balance Routes
// ============================================================================
router.get('/payment/balance', asyncHandler(paymentBusinessController.getBalance));

// ============================================================================
// Report Routes
// ============================================================================
router.get('/payment/reports', asyncHandler(paymentBusinessController.listReports));

export const paymentBusinessRouter = router;
