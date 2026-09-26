import * as subscriptionRepo from '../infrastructure/repositories/subscriptionRepo';
import type { SubscriptionRepository } from '../domain/repositories/SubscriptionRepository';
import { CreateSubscriptionUseCase } from './useCases/CreateSubscription';
import { CancelSubscriptionUseCase } from './useCases/CancelSubscription';
import { ManageAdminSubscriptionsUseCase } from './useCases/ManageAdminSubscriptions';
import { ManageStorefrontSubscriptionsUseCase } from './useCases/ManageStorefrontSubscriptions';
import { ManageCustomerSubscriptionsUseCase } from './useCases/ManageCustomerSubscriptions';
import { ProcessBillingCycleUseCase } from './useCases/ProcessBillingCycle';
import { ChangeSubscriptionPlanUseCase } from './useCases/ChangeSubscriptionPlan';
import { PauseSubscriptionUseCase } from './useCases/PauseSubscription';
import { ResumeSubscriptionUseCase } from './useCases/ResumeSubscription';
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
export const manageCustomerSubscriptionsUseCase = new ManageCustomerSubscriptionsUseCase(subscriptionRepo);
export const processBillingCycleUseCase = new ProcessBillingCycleUseCase(subscriptionRepo);

// Adapters bridging the record-model subscriptionRepo to the entity-model ports
// expected by the lifecycle use cases.
const subscriptionRecordAdapter = {
  async findById(id: string) {
    const sub = await subscriptionRepo.getCustomerSubscription(id);
    if (!sub) return null;
    return {
      status: sub.status,
      planId: sub.subscriptionPlanId,
      customerId: sub.customerId,
      nextBillingDate: sub.nextBillingAt?.toISOString() ?? new Date().toISOString(),
      currentPeriodStart: sub.currentPeriodStart?.toISOString(),
      startDate: sub.createdAt.toISOString(),
      priceCents: sub.totalPriceCents,
      billingInterval: sub.billingInterval,
    };
  },
  async update(id: string, data: Record<string, unknown>) {
    await subscriptionRepo.updateSubscriptionStatus(id, (data.status as SubscriptionStatus) ?? 'active');
  },
};

const planRecordAdapter = {
  async findById(id: string) {
    const plan = await subscriptionRepo.getSubscriptionPlan(id);
    if (!plan) return null;
    return { priceCents: plan.priceCents };
  },
};

export const changeSubscriptionPlanUseCase = new ChangeSubscriptionPlanUseCase(subscriptionRecordAdapter, planRecordAdapter);
export const pauseSubscriptionEntityUseCase = new PauseSubscriptionUseCase(subscriptionRecordAdapter);
export const resumeSubscriptionEntityUseCase = new ResumeSubscriptionUseCase(subscriptionRecordAdapter);

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
