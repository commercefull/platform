import type { HttpRouter } from 'libs/http';
import { asyncHandler } from '../../../libs/asyncHandler';
import {
  activateMembershipPlan,
  bulkMembershipOperations,
  createMembershipPlan,
  createMembershipPlanForm,
  deactivateMembershipPlan,
  deleteMembershipPlan,
  editMembershipPlanForm,
  listMembershipBenefits,
  listMembershipPlans,
  listMemberships,
  membershipAnalytics,
  membershipUpgradeDowngrade,
  updateMembershipPlan,
  viewMembershipPlan,
  loyaltyDashboard,
  membershipDashboard,
  subscriptionDashboard,
} from '../../../modules/membership';
import {
  cancelCustomerSubscription,
  createSubscriptionPlan,
  createSubscriptionPlanForm,
  deleteSubscriptionPlan,
  editSubscriptionPlanForm,
  listCustomerSubscriptions,
  listSubscriptionPlans,
  manageFailedPayments,
  processSubscriptionBilling,
  subscriptionBilling,
  updateSubscriptionPlan,
  updateSubscriptionStatus,
  viewCustomerSubscription,
  viewSubscriptionPlan,
} from '../../../modules/subscription';
import {
  createLoyaltyReward,
  createLoyaltyRewardForm,
  deleteLoyaltyReward,
  editLoyaltyRewardForm,
  listCustomerLoyalty,
  listLoyaltyRewards,
  listLoyaltyTiers,
  loyaltyAnalytics,
  updateLoyaltyReward,
  viewCustomerLoyalty,
  viewLoyaltyReward,
} from '../../../modules/loyalty';
import {
  aiRecommendations,
  analyticsDashboard,
  automatedReports,
  createReportSchedule,
  customerAnalytics,
  deleteReportSchedule,
  executiveDashboard,
  predictiveAnalytics,
  realTimeMetrics,
  runReportNow,
  storeSalesDashboard,
  updateReportSchedule,
} from '../../../modules/analytics';

/**
 * Customer programs admin routes: programs dashboards, membership,
 * subscription, loyalty, and analytics.
 */
export function registerProgramsRoutes(router: HttpRouter): void {
  // ==========================================================================
  // Programs Dashboard Routes
  // ==========================================================================

  router.get('/programs/membership', asyncHandler(membershipDashboard));
  router.get('/programs/subscription', asyncHandler(subscriptionDashboard));
  router.get('/programs/loyalty', asyncHandler(loyaltyDashboard));

  // ==========================================================================
  // Customer Programs Routes
  // ==========================================================================

  // Membership Plans
  router.get('/membership/plans', asyncHandler(listMembershipPlans));
  router.get('/membership/plans/create', asyncHandler(createMembershipPlanForm));
  router.post('/membership/plans', asyncHandler(createMembershipPlan));
  router.get('/membership/plans/:planId', asyncHandler(viewMembershipPlan));
  router.get('/membership/plans/:planId/edit', asyncHandler(editMembershipPlanForm));
  router.post('/membership/plans/:planId', asyncHandler(updateMembershipPlan));
  router.post('/membership/plans/:planId/activate', asyncHandler(activateMembershipPlan));
  router.post('/membership/plans/:planId/deactivate', asyncHandler(deactivateMembershipPlan));
  router.delete('/membership/plans/:planId', asyncHandler(deleteMembershipPlan));

  // Membership Benefits
  router.get('/membership/benefits', asyncHandler(listMembershipBenefits));

  // Memberships (User memberships)
  router.get('/membership/memberships', asyncHandler(listMemberships));

  // Membership Advanced Operations
  router.post('/membership/bulk-operations', asyncHandler(bulkMembershipOperations));
  router.post('/membership/memberships/:membershipId/change-tier', asyncHandler(membershipUpgradeDowngrade));
  router.get('/membership/analytics', asyncHandler(membershipAnalytics));

  // Subscription Plans
  router.get('/subscription/plans', asyncHandler(listSubscriptionPlans));
  router.get('/subscription/plans/create', asyncHandler(createSubscriptionPlanForm));
  router.post('/subscription/plans', asyncHandler(createSubscriptionPlan));
  router.get('/subscription/plans/:planId', asyncHandler(viewSubscriptionPlan));
  router.get('/subscription/plans/:planId/edit', asyncHandler(editSubscriptionPlanForm));
  router.post('/subscription/plans/:planId', asyncHandler(updateSubscriptionPlan));
  router.delete('/subscription/plans/:planId', asyncHandler(deleteSubscriptionPlan));

  // Customer Subscriptions
  router.get('/subscription/subscriptions', asyncHandler(listCustomerSubscriptions));
  router.get('/subscription/subscriptions/:subscriptionId', asyncHandler(viewCustomerSubscription));
  router.post('/subscription/subscriptions/:subscriptionId/status', asyncHandler(updateSubscriptionStatus));
  router.post('/subscription/subscriptions/:subscriptionId/cancel', asyncHandler(cancelCustomerSubscription));

  // Subscription Billing
  router.get('/subscription/billing', asyncHandler(subscriptionBilling));
  router.post('/subscription/billing/:subscriptionId/process', asyncHandler(processSubscriptionBilling));
  router.post('/subscription/billing/:subscriptionId/manage', asyncHandler(manageFailedPayments));

  // Loyalty Tiers
  router.get('/loyalty/tiers', asyncHandler(listLoyaltyTiers));

  // Loyalty Rewards
  router.get('/loyalty/rewards', asyncHandler(listLoyaltyRewards));
  router.get('/loyalty/rewards/create', asyncHandler(createLoyaltyRewardForm));
  router.post('/loyalty/rewards', asyncHandler(createLoyaltyReward));
  router.get('/loyalty/rewards/:rewardId', asyncHandler(viewLoyaltyReward));
  router.get('/loyalty/rewards/:rewardId/edit', asyncHandler(editLoyaltyRewardForm));
  router.post('/loyalty/rewards/:rewardId', asyncHandler(updateLoyaltyReward));
  router.delete('/loyalty/rewards/:rewardId', asyncHandler(deleteLoyaltyReward));

  // Customer Loyalty
  router.get('/loyalty/customers', asyncHandler(listCustomerLoyalty));
  router.get('/loyalty/customers/:customerId', asyncHandler(viewCustomerLoyalty));

  // Loyalty Analytics
  router.get('/loyalty/analytics', asyncHandler(loyaltyAnalytics));

  // ==========================================================================
  // Advanced Analytics & Intelligence (Phase 7)
  // ==========================================================================

  // Analytics Dashboard
  router.get('/analytics', asyncHandler(analyticsDashboard));
  router.get('/analytics/dashboard', asyncHandler(analyticsDashboard));
  router.get('/analytics/store-sales', asyncHandler(storeSalesDashboard));

  // Predictive Analytics
  router.get('/analytics/predictive', asyncHandler(predictiveAnalytics));

  // Customer Analytics
  router.get('/analytics/customers', asyncHandler(customerAnalytics));
  router.get('/analytics/customers/:segmentId', asyncHandler(customerAnalytics));

  // AI Recommendations
  router.get('/analytics/ai-recommendations', asyncHandler(aiRecommendations));

  // Executive Dashboard
  router.get('/analytics/executive', asyncHandler(executiveDashboard));

  // Real-time Metrics API
  router.get('/api/analytics/realtime', asyncHandler(realTimeMetrics));

  // Automated Reporting Management
  router.get('/analytics/reports', asyncHandler(automatedReports));
  router.post('/analytics/reports/schedules', asyncHandler(createReportSchedule));
  router.put('/analytics/reports/schedules/:scheduleId', asyncHandler(updateReportSchedule));
  router.delete('/analytics/reports/schedules/:scheduleId', asyncHandler(deleteReportSchedule));
  router.post('/analytics/reports/run-now', asyncHandler(runReportNow));
}
