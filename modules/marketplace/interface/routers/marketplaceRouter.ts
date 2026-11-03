import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { marketplaceController } from '../../application/useCases/wired';

export const marketplaceBusinessRouter = createHttpRouter();

// Vendor CRUD + lifecycle
marketplaceBusinessRouter.get('/vendors', isOrganizationLoggedIn, asyncHandler(marketplaceController.listVendors));
marketplaceBusinessRouter.get('/vendors/:vendorId', isOrganizationLoggedIn, asyncHandler(marketplaceController.getVendor));
marketplaceBusinessRouter.post('/vendors', isOrganizationLoggedIn, asyncHandler(marketplaceController.createVendor));
marketplaceBusinessRouter.put('/vendors/:vendorId', isOrganizationLoggedIn, asyncHandler(marketplaceController.updateVendor));
marketplaceBusinessRouter.put('/vendors/:vendorId/address', isOrganizationLoggedIn, asyncHandler(marketplaceController.setVendorAddress));
marketplaceBusinessRouter.put(
  '/vendors/:vendorId/bank-info',
  isOrganizationLoggedIn,
  asyncHandler(marketplaceController.setVendorBankInfo),
);
marketplaceBusinessRouter.post('/vendors/:vendorId/approve', isOrganizationLoggedIn, asyncHandler(marketplaceController.approveVendor));
marketplaceBusinessRouter.post('/vendors/:vendorId/suspend', isOrganizationLoggedIn, asyncHandler(marketplaceController.suspendVendor));
marketplaceBusinessRouter.post('/vendors/:vendorId/terminate', isOrganizationLoggedIn, asyncHandler(marketplaceController.terminateVendor));
marketplaceBusinessRouter.put('/vendors/:vendorId/tier', isOrganizationLoggedIn, asyncHandler(marketplaceController.setVendorTier));
marketplaceBusinessRouter.put(
  '/vendors/:vendorId/commission-rate',
  isOrganizationLoggedIn,
  asyncHandler(marketplaceController.setVendorCommissionRate),
);

// Commission rules
marketplaceBusinessRouter.get('/commission-rules', isOrganizationLoggedIn, asyncHandler(marketplaceController.listCommissionRules));
marketplaceBusinessRouter.get('/commission-rules/:ruleId', isOrganizationLoggedIn, asyncHandler(marketplaceController.getCommissionRule));
marketplaceBusinessRouter.post('/commission-rules', isOrganizationLoggedIn, asyncHandler(marketplaceController.createCommissionRule));
marketplaceBusinessRouter.put(
  '/commission-rules/:ruleId/rate',
  isOrganizationLoggedIn,
  asyncHandler(marketplaceController.updateCommissionRate),
);
marketplaceBusinessRouter.put(
  '/commission-rules/:ruleId/priority',
  isOrganizationLoggedIn,
  asyncHandler(marketplaceController.setCommissionPriority),
);
marketplaceBusinessRouter.put(
  '/commission-rules/:ruleId/validity',
  isOrganizationLoggedIn,
  asyncHandler(marketplaceController.setCommissionValidity),
);
marketplaceBusinessRouter.post(
  '/commission-rules/:ruleId/activate',
  isOrganizationLoggedIn,
  asyncHandler(marketplaceController.activateCommissionRule),
);
marketplaceBusinessRouter.post(
  '/commission-rules/:ruleId/deactivate',
  isOrganizationLoggedIn,
  asyncHandler(marketplaceController.deactivateCommissionRule),
);
marketplaceBusinessRouter.delete(
  '/commission-rules/:ruleId',
  isOrganizationLoggedIn,
  asyncHandler(marketplaceController.deleteCommissionRule),
);
marketplaceBusinessRouter.post(
  '/commission-rules/calculate',
  isOrganizationLoggedIn,
  asyncHandler(marketplaceController.calculateCommission),
);

// Payouts
marketplaceBusinessRouter.get('/payouts', isOrganizationLoggedIn, asyncHandler(marketplaceController.listPayouts));
marketplaceBusinessRouter.get('/payouts/:payoutId', isOrganizationLoggedIn, asyncHandler(marketplaceController.getPayout));
marketplaceBusinessRouter.post('/payouts', isOrganizationLoggedIn, asyncHandler(marketplaceController.createPayout));
marketplaceBusinessRouter.post(
  '/payouts/:payoutId/line-items',
  isOrganizationLoggedIn,
  asyncHandler(marketplaceController.addPayoutLineItem),
);
marketplaceBusinessRouter.post('/payouts/:payoutId/process', isOrganizationLoggedIn, asyncHandler(marketplaceController.processPayout));
marketplaceBusinessRouter.post('/payouts/:payoutId/complete', isOrganizationLoggedIn, asyncHandler(marketplaceController.completePayout));
marketplaceBusinessRouter.post('/payouts/:payoutId/fail', isOrganizationLoggedIn, asyncHandler(marketplaceController.failPayout));
marketplaceBusinessRouter.post('/payouts/:payoutId/retry', isOrganizationLoggedIn, asyncHandler(marketplaceController.retryPayout));
marketplaceBusinessRouter.post('/payouts/:payoutId/cancel', isOrganizationLoggedIn, asyncHandler(marketplaceController.cancelPayout));
marketplaceBusinessRouter.put('/payouts/:payoutId/method', isOrganizationLoggedIn, asyncHandler(marketplaceController.setPayoutMethod));
