import {
  advanceBillingCycle as subscriptionRepo_advanceBillingCycle,
  cancelSubscription as subscriptionRepo_cancelSubscription,
  cancelSubscriptionStorefront,
  createCustomerSubscription,
  createDunningAttempt,
  createSubscriptionOrder as subscriptionRepo_createSubscriptionOrder,
  deleteSubscriptionPlan,
  deleteSubscriptionProduct,
  findActiveByCustomerId,
  findActivePlansWithProduct,
  findBillingHistory,
  findByCustomerIdWithPlan,
  findByIdWithPlan,
  getCustomerSubscription,
  getCustomerSubscriptionByNumber,
  getCustomerSubscriptions,
  getDunningAttempts,
  getFailedSubscriptionPayments,
  getPendingDunningAttempts as subscriptionRepo_getPendingDunningAttempts,
  getSubscriptionOrder,
  getSubscriptionOrders,
  getSubscriptionOrdersPending,
  getSubscriptionPlan,
  getSubscriptionPlans,
  getSubscriptionProduct,
  getSubscriptionProductByProductId,
  getSubscriptionProducts,
  getSubscriptionsDueBilling,
  pauseSubscription as subscriptionRepo_pauseSubscription,
  resumeSubscription as subscriptionRepo_resumeSubscription,
  saveSubscriptionPlan as subscriptionRepo_saveSubscriptionPlan,
  saveSubscriptionProduct as subscriptionRepo_saveSubscriptionProduct,
  updateDunningAttempt,
  updateSubscriptionOrderStatus as subscriptionRepo_updateSubscriptionOrderStatus,
  updateSubscriptionStatus,
} from '../infrastructure/repositories/subscriptionRepo';
const subscriptionRepo = {
  advanceBillingCycle: subscriptionRepo_advanceBillingCycle,
  cancelSubscription: subscriptionRepo_cancelSubscription,
  cancelSubscriptionStorefront,
  createCustomerSubscription,
  createDunningAttempt,
  createSubscriptionOrder: subscriptionRepo_createSubscriptionOrder,
  deleteSubscriptionPlan,
  deleteSubscriptionProduct,
  findActiveByCustomerId,
  findActivePlansWithProduct,
  findBillingHistory,
  findByCustomerIdWithPlan,
  findByIdWithPlan,
  getCustomerSubscription,
  getCustomerSubscriptionByNumber,
  getCustomerSubscriptions,
  getDunningAttempts,
  getFailedSubscriptionPayments,
  getPendingDunningAttempts: subscriptionRepo_getPendingDunningAttempts,
  getSubscriptionOrder,
  getSubscriptionOrders,
  getSubscriptionOrdersPending,
  getSubscriptionPlan,
  getSubscriptionPlans,
  getSubscriptionProduct,
  getSubscriptionProductByProductId,
  getSubscriptionProducts,
  getSubscriptionsDueBilling,
  pauseSubscription: subscriptionRepo_pauseSubscription,
  resumeSubscription: subscriptionRepo_resumeSubscription,
  saveSubscriptionPlan: subscriptionRepo_saveSubscriptionPlan,
  saveSubscriptionProduct: subscriptionRepo_saveSubscriptionProduct,
  updateDunningAttempt,
  updateSubscriptionOrderStatus: subscriptionRepo_updateSubscriptionOrderStatus,
  updateSubscriptionStatus,
};
import type { SubscriptionRepository } from '../domain/repositories/SubscriptionRepository';
import { TaxSubscriptionTaxAdapter } from '../infrastructure/acl/TaxSubscriptionTaxAdapter';
import { CustomerSubscriptionAddressAdapter } from '../infrastructure/acl/CustomerSubscriptionAddressAdapter';
import { StoreSubscriptionStoreContextAdapter } from '../infrastructure/acl/StoreSubscriptionStoreContextAdapter';
import { calculateOrderTaxUseCase } from '../../tax/application/wired';
import { getStoreUseCase } from '../../store/application/useCases/wired';
import customerAddressRepo from '../../customer/infrastructure/repositories/customerAddressRepo';
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
export const manageAdminSubscriptionsUseCase = new ManageAdminSubscriptionsUseCase(subscriptionRepo as unknown as SubscriptionRepository);
export const manageStorefrontSubscriptionsUseCase = new ManageStorefrontSubscriptionsUseCase(
  subscriptionRepo as unknown as SubscriptionRepository,
);
const subscriptionTaxPorts = {
  taxPort: new TaxSubscriptionTaxAdapter(calculateOrderTaxUseCase),
  addressPort: new CustomerSubscriptionAddressAdapter(customerAddressRepo),
  storeContextPort: new StoreSubscriptionStoreContextAdapter(getStoreUseCase),
};

export const manageCustomerSubscriptionsUseCase = new ManageCustomerSubscriptionsUseCase(subscriptionRepo, subscriptionTaxPorts);
export const processBillingCycleUseCase = new ProcessBillingCycleUseCase(subscriptionRepo);

// Adapters bridging the record-model subscriptionRepo to the entity-model ports
// expected by the lifecycle use cases.
const subscriptionRecordAdapter = {
  async findById(id: string) {
    const sub = await getCustomerSubscription(id);
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
    await updateSubscriptionStatus(id, (data.status as SubscriptionStatus) ?? 'active');
  },
};

const planRecordAdapter = {
  async findById(id: string) {
    const plan = await getSubscriptionPlan(id);
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
