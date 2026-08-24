import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { marketplaceController } from '../../application/useCases/wired';

export const marketplaceBusinessRouter = express.Router();

// Vendor CRUD + lifecycle
marketplaceBusinessRouter.get('/vendors', isOrganizationLoggedIn, asyncHandler(marketplaceController.listVendors.bind(marketplaceController)));
marketplaceBusinessRouter.get('/vendors/:vendorId', isOrganizationLoggedIn, asyncHandler(marketplaceController.getVendor.bind(marketplaceController)));
marketplaceBusinessRouter.post('/vendors', isOrganizationLoggedIn, asyncHandler(marketplaceController.createVendor.bind(marketplaceController)));
marketplaceBusinessRouter.put('/vendors/:vendorId', isOrganizationLoggedIn, asyncHandler(marketplaceController.updateVendor.bind(marketplaceController)));
marketplaceBusinessRouter.put('/vendors/:vendorId/address', isOrganizationLoggedIn, asyncHandler(marketplaceController.setVendorAddress.bind(marketplaceController)));
marketplaceBusinessRouter.put('/vendors/:vendorId/bank-info', isOrganizationLoggedIn, asyncHandler(marketplaceController.setVendorBankInfo.bind(marketplaceController)));
marketplaceBusinessRouter.post('/vendors/:vendorId/approve', isOrganizationLoggedIn, asyncHandler(marketplaceController.approveVendor.bind(marketplaceController)));
marketplaceBusinessRouter.post('/vendors/:vendorId/suspend', isOrganizationLoggedIn, asyncHandler(marketplaceController.suspendVendor.bind(marketplaceController)));
marketplaceBusinessRouter.post('/vendors/:vendorId/terminate', isOrganizationLoggedIn, asyncHandler(marketplaceController.terminateVendor.bind(marketplaceController)));
marketplaceBusinessRouter.put('/vendors/:vendorId/tier', isOrganizationLoggedIn, asyncHandler(marketplaceController.setVendorTier.bind(marketplaceController)));
marketplaceBusinessRouter.put('/vendors/:vendorId/commission-rate', isOrganizationLoggedIn, asyncHandler(marketplaceController.setVendorCommissionRate.bind(marketplaceController)));

// Commission rules
marketplaceBusinessRouter.get('/commission-rules', isOrganizationLoggedIn, asyncHandler(marketplaceController.listCommissionRules.bind(marketplaceController)));
marketplaceBusinessRouter.get('/commission-rules/:ruleId', isOrganizationLoggedIn, asyncHandler(marketplaceController.getCommissionRule.bind(marketplaceController)));
marketplaceBusinessRouter.post('/commission-rules', isOrganizationLoggedIn, asyncHandler(marketplaceController.createCommissionRule.bind(marketplaceController)));
marketplaceBusinessRouter.put('/commission-rules/:ruleId/rate', isOrganizationLoggedIn, asyncHandler(marketplaceController.updateCommissionRate.bind(marketplaceController)));
marketplaceBusinessRouter.put('/commission-rules/:ruleId/priority', isOrganizationLoggedIn, asyncHandler(marketplaceController.setCommissionPriority.bind(marketplaceController)));
marketplaceBusinessRouter.put('/commission-rules/:ruleId/validity', isOrganizationLoggedIn, asyncHandler(marketplaceController.setCommissionValidity.bind(marketplaceController)));
marketplaceBusinessRouter.post('/commission-rules/:ruleId/activate', isOrganizationLoggedIn, asyncHandler(marketplaceController.activateCommissionRule.bind(marketplaceController)));
marketplaceBusinessRouter.post('/commission-rules/:ruleId/deactivate', isOrganizationLoggedIn, asyncHandler(marketplaceController.deactivateCommissionRule.bind(marketplaceController)));
marketplaceBusinessRouter.delete('/commission-rules/:ruleId', isOrganizationLoggedIn, asyncHandler(marketplaceController.deleteCommissionRule.bind(marketplaceController)));
marketplaceBusinessRouter.post('/commission-rules/calculate', isOrganizationLoggedIn, asyncHandler(marketplaceController.calculateCommission.bind(marketplaceController)));

// Payouts
marketplaceBusinessRouter.get('/payouts', isOrganizationLoggedIn, asyncHandler(marketplaceController.listPayouts.bind(marketplaceController)));
marketplaceBusinessRouter.get('/payouts/:payoutId', isOrganizationLoggedIn, asyncHandler(marketplaceController.getPayout.bind(marketplaceController)));
marketplaceBusinessRouter.post('/payouts', isOrganizationLoggedIn, asyncHandler(marketplaceController.createPayout.bind(marketplaceController)));
marketplaceBusinessRouter.post('/payouts/:payoutId/line-items', isOrganizationLoggedIn, asyncHandler(marketplaceController.addPayoutLineItem.bind(marketplaceController)));
marketplaceBusinessRouter.post('/payouts/:payoutId/process', isOrganizationLoggedIn, asyncHandler(marketplaceController.processPayout.bind(marketplaceController)));
marketplaceBusinessRouter.post('/payouts/:payoutId/complete', isOrganizationLoggedIn, asyncHandler(marketplaceController.completePayout.bind(marketplaceController)));
marketplaceBusinessRouter.post('/payouts/:payoutId/fail', isOrganizationLoggedIn, asyncHandler(marketplaceController.failPayout.bind(marketplaceController)));
marketplaceBusinessRouter.post('/payouts/:payoutId/retry', isOrganizationLoggedIn, asyncHandler(marketplaceController.retryPayout.bind(marketplaceController)));
marketplaceBusinessRouter.post('/payouts/:payoutId/cancel', isOrganizationLoggedIn, asyncHandler(marketplaceController.cancelPayout.bind(marketplaceController)));
marketplaceBusinessRouter.put('/payouts/:payoutId/method', isOrganizationLoggedIn, asyncHandler(marketplaceController.setPayoutMethod.bind(marketplaceController)));
