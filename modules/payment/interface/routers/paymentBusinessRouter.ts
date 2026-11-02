/**
 * Payment Business Router
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  createGateway,
  createMethodConfig,
  deleteGateway,
  deleteMethodConfig,
  deleteTransaction,
  getGateway,
  getMethodConfig,
  getRefunds,
  getTransaction,
  initiatePayment,
  listGateways,
  listMethodConfigs,
  listTransactions,
  processRefund,
  updateGateway,
  updateMethodConfig,
} from '../controllers/PaymentController';
import {
  addToBlacklist,
  createFraudRule,
  deleteFraudRule,
  getBlacklist,
  getFraudCheck,
  getFraudChecks,
  getFraudRule,
  getFraudRules,
  getPendingReviews,
  removeFromBlacklist,
  reviewFraudCheck,
  updateFraudRule,
} from '../controllers/fraudController';
import {
  getBalance,
  getDispute,
  getSettings,
  listDisputes,
  listFees,
  listReports,
  updateDisputeStatus,
  updateSettings,
} from '../controllers/paymentBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

// Apply authentication middleware
router.use(isOrganizationLoggedIn);

// ============================================================================
// Gateway Routes
// ============================================================================
router.get('/gateways', asyncHandler(listGateways));
router.get('/gateways/:gatewayId', asyncHandler(getGateway));
router.post('/gateways', asyncHandler(createGateway));
router.put('/gateways/:gatewayId', asyncHandler(updateGateway));
router.delete('/gateways/:gatewayId', asyncHandler(deleteGateway));

// ============================================================================
// Method Config Routes
// ============================================================================
router.get('/method-configs', asyncHandler(listMethodConfigs));
router.get('/method-configs/:methodConfigId', asyncHandler(getMethodConfig));
router.post('/method-configs', asyncHandler(createMethodConfig));
router.put('/method-configs/:methodConfigId', asyncHandler(updateMethodConfig));
router.delete('/method-configs/:methodConfigId', asyncHandler(deleteMethodConfig));

// ============================================================================
// Transaction Routes
// ============================================================================
router.get('/transactions', asyncHandler(listTransactions));
router.get('/transactions/:transactionId', asyncHandler(getTransaction));
router.post('/transactions', asyncHandler(initiatePayment));
router.delete('/transactions/:transactionId', asyncHandler(deleteTransaction));
router.get('/transactions/:transactionId/refunds', asyncHandler(getRefunds));
router.post('/transactions/:transactionId/refund', asyncHandler(processRefund));

// Fraud Prevention routes
router.get('/fraud/rules', asyncHandler(getFraudRules));
router.get('/fraud/rules/:id', asyncHandler(getFraudRule));
router.post('/fraud/rules', asyncHandler(createFraudRule));
router.put('/fraud/rules/:id', asyncHandler(updateFraudRule));
router.delete('/fraud/rules/:id', asyncHandler(deleteFraudRule));

router.get('/fraud/checks', asyncHandler(getFraudChecks));
router.get('/fraud/checks/:id', asyncHandler(getFraudCheck));
router.get('/fraud/reviews', asyncHandler(getPendingReviews));
router.post('/fraud/checks/:id/review', asyncHandler(reviewFraudCheck));

router.get('/fraud/blacklist', asyncHandler(getBlacklist));
router.post('/fraud/blacklist', asyncHandler(addToBlacklist));
router.delete('/fraud/blacklist/:id', asyncHandler(removeFromBlacklist));

// ============================================================================
// Dispute Routes
// ============================================================================
router.get('/payment/disputes', asyncHandler(listDisputes));
router.post('/payment/disputes', asyncHandler(listDisputes));
router.get('/payment/disputes/:disputeId', asyncHandler(getDispute));
router.patch('/payment/disputes/:disputeId', asyncHandler(updateDisputeStatus));

// ============================================================================
// Fee Routes
// ============================================================================
router.get('/payment/fees', asyncHandler(listFees));

// ============================================================================
// Settings Routes
// ============================================================================
router.get('/payment/settings', asyncHandler(getSettings));
router.post('/payment/settings', asyncHandler(updateSettings));

// ============================================================================
// Balance Routes
// ============================================================================
router.get('/payment/balance', asyncHandler(getBalance));

// ============================================================================
// Report Routes
// ============================================================================
router.get('/payment/reports', asyncHandler(listReports));

export const paymentBusinessRouter = router;
