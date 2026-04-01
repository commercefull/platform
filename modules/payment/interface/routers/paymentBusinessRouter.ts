/**
 * Payment Business Router
 */

import express from 'express';
import * as paymentController from '../controllers/PaymentController';
import * as fraudController from '../controllers/fraudController';
import * as paymentBusinessController from '../controllers/paymentBusinessController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use(isMerchantLoggedIn);

// ============================================================================
// Gateway Routes
// ============================================================================
router.get('/gateways', paymentController.listGateways);
router.get('/gateways/:gatewayId', paymentController.getGateway);
router.post('/gateways', paymentController.createGateway);
router.put('/gateways/:gatewayId', paymentController.updateGateway);
router.delete('/gateways/:gatewayId', paymentController.deleteGateway);

// ============================================================================
// Method Config Routes
// ============================================================================
router.get('/method-configs', paymentController.listMethodConfigs);
router.get('/method-configs/:methodConfigId', paymentController.getMethodConfig);
router.post('/method-configs', paymentController.createMethodConfig);
router.put('/method-configs/:methodConfigId', paymentController.updateMethodConfig);
router.delete('/method-configs/:methodConfigId', paymentController.deleteMethodConfig);

// ============================================================================
// Transaction Routes
// ============================================================================
router.get('/transactions', paymentController.listTransactions);
router.get('/transactions/:transactionId', paymentController.getTransaction);
router.post('/transactions', paymentController.initiatePayment);
router.delete('/transactions/:transactionId', paymentController.deleteTransaction);
router.get('/transactions/:transactionId/refunds', paymentController.getRefunds);
router.post('/transactions/:transactionId/refund', paymentController.processRefund);

// Fraud Prevention routes
router.get('/fraud/rules', fraudController.getFraudRules);
router.get('/fraud/rules/:id', fraudController.getFraudRule);
router.post('/fraud/rules', fraudController.createFraudRule);
router.put('/fraud/rules/:id', fraudController.updateFraudRule);
router.delete('/fraud/rules/:id', fraudController.deleteFraudRule);

router.get('/fraud/checks', fraudController.getFraudChecks);
router.get('/fraud/checks/:id', fraudController.getFraudCheck);
router.get('/fraud/reviews', fraudController.getPendingReviews);
router.post('/fraud/checks/:id/review', fraudController.reviewFraudCheck);

router.get('/fraud/blacklist', fraudController.getBlacklist);
router.post('/fraud/blacklist', fraudController.addToBlacklist);
router.delete('/fraud/blacklist/:id', fraudController.removeFromBlacklist);

// ============================================================================
// Dispute Routes
// ============================================================================
router.get('/payment/disputes', paymentBusinessController.listDisputes);
router.post('/payment/disputes', paymentBusinessController.listDisputes);
router.get('/payment/disputes/:disputeId', paymentBusinessController.getDispute);
router.patch('/payment/disputes/:disputeId', paymentBusinessController.updateDisputeStatus);

// ============================================================================
// Fee Routes
// ============================================================================
router.get('/payment/fees', paymentBusinessController.listFees);

// ============================================================================
// Settings Routes
// ============================================================================
router.get('/payment/settings', paymentBusinessController.getSettings);
router.post('/payment/settings', paymentBusinessController.updateSettings);

// ============================================================================
// Balance Routes
// ============================================================================
router.get('/payment/balance', paymentBusinessController.getBalance);

// ============================================================================
// Report Routes
// ============================================================================
router.get('/payment/reports', paymentBusinessController.listReports);

export const paymentBusinessRouter = router;
