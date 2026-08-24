/**
 * Subscription Repository Port
 *
 * Domain port interface for subscription data access.
 * Infrastructure implementations must implement this interface.
 */

import type {
  BillingInterval,
  BillingAnchor,
  SubscriptionStatus,
  SubscriptionOrderStatus,
  PauseStatus,
  DunningStatus,
  SubscriptionProduct,
  SubscriptionPlan,
  CustomerSubscription,
  SubscriptionOrder,
  SubscriptionPause,
  DunningAttempt,
} from '../types';

export type {
  BillingInterval,
  BillingAnchor,
  SubscriptionStatus,
  SubscriptionOrderStatus,
  PauseStatus,
  DunningStatus,
  SubscriptionProduct,
  SubscriptionPlan,
  CustomerSubscription,
  SubscriptionOrder,
  SubscriptionPause,
  DunningAttempt,
};

export interface SubscriptionRepository {
  // Subscription Products
  getSubscriptionProduct(subscriptionProductId: string): Promise<SubscriptionProduct | null>;
  getSubscriptionProductByProductId(productId: string): Promise<SubscriptionProduct | null>;
  getSubscriptionProducts(activeOnly?: boolean): Promise<SubscriptionProduct[]>;
  saveSubscriptionProduct(product: Partial<SubscriptionProduct> & { productId: string }): Promise<SubscriptionProduct>;
  deleteSubscriptionProduct(subscriptionProductId: string): Promise<void>;

  // Subscription Plans
  getSubscriptionPlan(subscriptionPlanId: string): Promise<SubscriptionPlan | null>;
  getSubscriptionPlans(subscriptionProductId: string, activeOnly?: boolean): Promise<SubscriptionPlan[]>;
  saveSubscriptionPlan(plan: Partial<SubscriptionPlan> & { subscriptionProductId: string; name: string; price: number }): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(subscriptionPlanId: string): Promise<void>;

  // Customer Subscriptions
  getCustomerSubscription(customerSubscriptionId: string): Promise<CustomerSubscription | null>;
  getCustomerSubscriptionByNumber(subscriptionNumber: string): Promise<CustomerSubscription | null>;
  getCustomerSubscriptions(
    filters?: { customerId?: string; status?: SubscriptionStatus },
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: CustomerSubscription[]; total: number }>;
  getSubscriptionsDueBilling(beforeDate: Date): Promise<CustomerSubscription[]>;
  createCustomerSubscription(subscription: {
    customerId: string;
    subscriptionPlanId: string;
    subscriptionProductId?: string;
    productVariantId?: string;
    quantity?: number;
    shippingAddressId?: string;
    billingAddressId?: string;
    paymentMethodId?: string;
    customizations?: Record<string, unknown>;
  }): Promise<CustomerSubscription>;
  updateSubscriptionStatus(
    customerSubscriptionId: string,
    status: SubscriptionStatus,
    additionalFields?: Partial<CustomerSubscription>,
  ): Promise<void>;
  cancelSubscription(
    customerSubscriptionId: string,
    reason?: string,
    cancelledBy?: string,
    cancelAtPeriodEnd?: boolean,
  ): Promise<void>;
  pauseSubscription(
    customerSubscriptionId: string,
    resumeAt?: Date,
    reason?: string,
    pausedBy?: string,
  ): Promise<SubscriptionPause>;
  resumeSubscription(customerSubscriptionId: string, resumedBy?: string): Promise<void>;
  advanceBillingCycle(customerSubscriptionId: string): Promise<void>;

  // Subscription Orders
  getSubscriptionOrder(subscriptionOrderId: string): Promise<SubscriptionOrder | null>;
  getSubscriptionOrders(customerSubscriptionId: string): Promise<SubscriptionOrder[]>;
  getSubscriptionOrdersPending(): Promise<SubscriptionOrder[]>;
  getFailedSubscriptionPayments(): Promise<SubscriptionOrder[]>;
  createSubscriptionOrder(order: {
    customerSubscriptionId: string;
    billingCycleNumber: number;
    periodStart: Date;
    periodEnd: Date;
    subtotal: number;
    discountAmount?: number;
    taxAmount?: number;
    shippingAmount?: number;
    scheduledAt?: Date;
  }): Promise<SubscriptionOrder>;
  updateSubscriptionOrderStatus(
    subscriptionOrderId: string,
    status: SubscriptionOrderStatus,
    additionalFields?: { orderId?: string; failureReason?: string; paymentIntentId?: string },
  ): Promise<void>;

  // Dunning
  createDunningAttempt(attempt: {
    customerSubscriptionId: string;
    subscriptionOrderId?: string;
    attemptNumber: number;
    amount: number;
    currency?: string;
    scheduledAt: Date;
  }): Promise<DunningAttempt>;
  getDunningAttempts(customerSubscriptionId: string): Promise<DunningAttempt[]>;
  getPendingDunningAttempts(beforeDate: Date): Promise<DunningAttempt[]>;
  updateDunningAttempt(
    dunningAttemptId: string,
    status: DunningStatus,
    additionalFields?: Partial<DunningAttempt>,
  ): Promise<void>;

  // Storefront Queries
  findActivePlansWithProduct(): Promise<unknown[]>;
  findByCustomerIdWithPlan(customerId: string): Promise<unknown[]>;
  findByIdWithPlan(subscriptionId: string, customerId: string): Promise<unknown | null>;
  findActiveByCustomerId(subscriptionId: string, customerId: string): Promise<unknown | null>;
  cancelSubscriptionStorefront(subscriptionId: string, reason: string): Promise<void>;
  findBillingHistory(subscriptionId: string): Promise<unknown[]>;
}
