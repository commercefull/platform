import * as subscriptionRepo from '../infrastructure/repositories/subscriptionRepo';
import type { SubscriptionRepository } from '../domain/repositories/SubscriptionRepository';
import { CreateSubscriptionUseCase } from './useCases/CreateSubscription';
import { CancelSubscriptionUseCase } from './useCases/CancelSubscription';
import { ManageAdminSubscriptionsUseCase } from './useCases/ManageAdminSubscriptions';
import { ManageStorefrontSubscriptionsUseCase } from './useCases/ManageStorefrontSubscriptions';
import {
  SubscriptionPlan,
  SubscriptionProduct,
  SubscriptionStatus,
  advanceBillingCycle,
  cancelSubscription,
  createSubscriptionOrder,
  deleteSubscriptionPlan as deleteSubscriptionPlanRepo,
  deleteSubscriptionProduct as deleteSubscriptionProductRepo,
  getCustomerSubscription as getCustomerSubscriptionRepo,
  getCustomerSubscriptions as getCustomerSubscriptionsRepo,
  getDunningAttempts as getDunningAttemptsRepo,
  getPendingDunningAttempts,
  getSubscriptionOrders as getSubscriptionOrdersRepo,
  getSubscriptionPlan as getSubscriptionPlanRepo,
  getSubscriptionPlans as getSubscriptionPlansRepo,
  getSubscriptionProduct as getSubscriptionProductRepo,
  getSubscriptionProducts as getSubscriptionProductsRepo,
  getSubscriptionsDueBilling as getSubscriptionsDueBillingRepo,
  pauseSubscription,
  resumeSubscription,
  saveSubscriptionPlan,
  saveSubscriptionProduct,
  updateSubscriptionOrderStatus,
  updateSubscriptionStatus as updateSubscriptionStatusRepo,
} from '../infrastructure/repositories/subscriptionRepo';

export const createSubscriptionUseCase = new CreateSubscriptionUseCase(subscriptionRepo);
export const cancelSubscriptionUseCase = new CancelSubscriptionUseCase(subscriptionRepo);
export const manageAdminSubscriptionsUseCase = new ManageAdminSubscriptionsUseCase(
  subscriptionRepo as unknown as SubscriptionRepository,
);
export const manageStorefrontSubscriptionsUseCase = new ManageStorefrontSubscriptionsUseCase(
  subscriptionRepo as unknown as SubscriptionRepository,
);

export {
  subscriptionRepo,
  SubscriptionPlan,
  SubscriptionProduct,
  SubscriptionStatus,
  advanceBillingCycle,
  cancelSubscription,
  createSubscriptionOrder,
  deleteSubscriptionPlanRepo,
  deleteSubscriptionProductRepo,
  getCustomerSubscriptionRepo,
  getCustomerSubscriptionsRepo,
  getDunningAttemptsRepo,
  getPendingDunningAttempts,
  getSubscriptionOrdersRepo,
  getSubscriptionPlanRepo,
  getSubscriptionPlansRepo,
  getSubscriptionProductRepo,
  getSubscriptionProductsRepo,
  getSubscriptionsDueBillingRepo,
  pauseSubscription,
  resumeSubscription,
  saveSubscriptionPlan,
  saveSubscriptionProduct,
  updateSubscriptionOrderStatus,
  updateSubscriptionStatusRepo,
};
