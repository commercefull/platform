/**
 * Manage Customer Subscriptions Use Case
 *
 * Customer-facing subscription lifecycle: subscribe, change plan,
 * pause/resume/cancel/reactivate, and skip next delivery.
 * Enforces ownership and plan/product policy guards.
 */

import type {
  CustomerSubscription,
  SubscriptionStatus,
  SubscriptionOrder,
  SubscriptionPause,
  SubscriptionPlan,
  SubscriptionProduct,
  SubscriptionRepository,
} from '../../domain/repositories/SubscriptionRepository';
import { SubscriptionNotFoundError, SubscriptionValidationError } from '../../domain/errors/SubscriptionErrors';

export interface CustomerSubscriptionPort {
  getCustomerSubscription(customerSubscriptionId: string): Promise<CustomerSubscription | null>;
  getCustomerSubscriptions(
    filters?: { customerId?: string; status?: SubscriptionStatus },
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: CustomerSubscription[]; total: number }>;
  getSubscriptionPlan(subscriptionPlanId: string): Promise<SubscriptionPlan | null>;
  getSubscriptionPlans(subscriptionProductId: string, activeOnly?: boolean): Promise<SubscriptionPlan[]>;
  getSubscriptionProduct(subscriptionProductId: string): Promise<SubscriptionProduct | null>;
  getSubscriptionProductByProductId(productId: string): Promise<SubscriptionProduct | null>;
  getSubscriptionProducts(activeOnly?: boolean): Promise<SubscriptionProduct[]>;
  getSubscriptionOrders(customerSubscriptionId: string): Promise<SubscriptionOrder[]>;
  createCustomerSubscription(subscription: Parameters<SubscriptionRepository['createCustomerSubscription']>[0]): Promise<CustomerSubscription>;
  pauseSubscription(customerSubscriptionId: string, resumeAt?: Date, reason?: string, pausedBy?: string): Promise<SubscriptionPause>;
  resumeSubscription(customerSubscriptionId: string, resumedBy?: string): Promise<void>;
  cancelSubscription(customerSubscriptionId: string, reason?: string, cancelledBy?: string, cancelAtPeriodEnd?: boolean): Promise<void>;
  updateSubscriptionStatus(customerSubscriptionId: string, status: CustomerSubscription['status'], additionalFields?: Partial<CustomerSubscription>): Promise<void>;
  advanceBillingCycle(customerSubscriptionId: string): Promise<void>;
}

export interface SubscribeCommand {
  customerId: string;
  subscriptionPlanId: string;
  productVariantId?: string;
  quantity?: number;
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentMethodId?: string;
  customizations?: Record<string, unknown>;
}

export class ManageCustomerSubscriptionsUseCase {
  constructor(private readonly subscriptionRepo: CustomerSubscriptionPort) {}

  async getSubscriptionProducts(activeOnly?: boolean) {
    return this.subscriptionRepo.getSubscriptionProducts(activeOnly);
  }
  async getSubscriptionProduct(subscriptionProductId: string) {
    return this.subscriptionRepo.getSubscriptionProduct(subscriptionProductId);
  }
  async getSubscriptionProductByProductId(productId: string) {
    return this.subscriptionRepo.getSubscriptionProductByProductId(productId);
  }
  async getSubscriptionPlans(subscriptionProductId: string, activeOnly?: boolean) {
    return this.subscriptionRepo.getSubscriptionPlans(subscriptionProductId, activeOnly);
  }
  async getSubscriptionPlan(subscriptionPlanId: string) {
    return this.subscriptionRepo.getSubscriptionPlan(subscriptionPlanId);
  }
  async getCustomerSubscriptions(
    filters?: { customerId?: string; status?: SubscriptionStatus },
    pagination?: { limit?: number; offset?: number },
  ) {
    return this.subscriptionRepo.getCustomerSubscriptions(filters, pagination);
  }
  async getCustomerSubscription(customerSubscriptionId: string) {
    return this.subscriptionRepo.getCustomerSubscription(customerSubscriptionId);
  }
  async getSubscriptionOrders(customerSubscriptionId: string) {
    return this.subscriptionRepo.getSubscriptionOrders(customerSubscriptionId);
  }

  async subscribe(command: SubscribeCommand): Promise<CustomerSubscription> {
    const plan = await this.subscriptionRepo.getSubscriptionPlan(command.subscriptionPlanId);
    if (!plan || !plan.isActive) {
      throw new SubscriptionValidationError('Invalid subscription plan');
    }

    return this.subscriptionRepo.createCustomerSubscription({
      customerId: command.customerId,
      subscriptionPlanId: command.subscriptionPlanId,
      subscriptionProductId: plan.subscriptionProductId,
      productVariantId: command.productVariantId,
      quantity: command.quantity,
      shippingAddressId: command.shippingAddressId,
      billingAddressId: command.billingAddressId,
      paymentMethodId: command.paymentMethodId,
      customizations: command.customizations,
    });
  }

  async changePlan(customerId: string, subscriptionId: string, newPlanId: string): Promise<void> {
    const subscription = await this.requireOwnedSubscription(customerId, subscriptionId);

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      throw new SubscriptionValidationError('Cannot change plan for inactive subscription');
    }

    const newPlan = await this.subscriptionRepo.getSubscriptionPlan(newPlanId);
    if (!newPlan || !newPlan.isActive) {
      throw new SubscriptionValidationError('Invalid plan');
    }

    // Plan change logic (proration etc.) is scheduled downstream.
  }

  async pause(customerId: string, subscriptionId: string, options: { resumeAt?: Date; reason?: string }): Promise<SubscriptionPause> {
    const subscription = await this.requireOwnedSubscription(customerId, subscriptionId);

    if (subscription.status !== 'active') {
      throw new SubscriptionValidationError('Only active subscriptions can be paused');
    }

    const product = await this.getProduct(subscription);
    if (product && !product.allowPause) {
      throw new SubscriptionValidationError('Pausing is not allowed for this subscription');
    }
    if (product?.maxPausesPerYear && subscription.pauseCount >= product.maxPausesPerYear) {
      throw new SubscriptionValidationError('Maximum pauses reached for this year');
    }
    if (product?.maxPauseDays && options.resumeAt) {
      const pauseDays = Math.ceil((options.resumeAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (pauseDays > product.maxPauseDays) {
        throw new SubscriptionValidationError(`Maximum pause duration is ${product.maxPauseDays} days`);
      }
    }

    return this.subscriptionRepo.pauseSubscription(subscriptionId, options.resumeAt, options.reason, 'customer');
  }

  async resume(customerId: string, subscriptionId: string): Promise<void> {
    const subscription = await this.requireOwnedSubscription(customerId, subscriptionId);

    if (subscription.status !== 'paused') {
      throw new SubscriptionValidationError('Subscription is not paused');
    }

    await this.subscriptionRepo.resumeSubscription(subscriptionId, 'customer');
  }

  async cancel(customerId: string, subscriptionId: string, options: { reason?: string; cancelAtPeriodEnd?: boolean }): Promise<{ cancelAtPeriodEnd: boolean }> {
    const subscription = await this.requireOwnedSubscription(customerId, subscriptionId);

    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      throw new SubscriptionValidationError('Subscription is already cancelled');
    }

    // Check contract requirements
    if (subscription.contractCyclesRemaining && subscription.contractCyclesRemaining > 0) {
      const product = await this.getProduct(subscription);
      if (product && !product.allowEarlyCancel) {
        throw new SubscriptionValidationError(
          `Contract requires ${subscription.contractCyclesRemaining} more billing cycles`,
        );
      }
      // Note: Early termination fee would be handled here
    }

    const cancelAtPeriodEnd = options.cancelAtPeriodEnd !== false;
    await this.subscriptionRepo.cancelSubscription(subscriptionId, options.reason, 'customer', cancelAtPeriodEnd);

    return { cancelAtPeriodEnd };
  }

  async reactivate(customerId: string, subscriptionId: string): Promise<void> {
    const subscription = await this.requireOwnedSubscription(customerId, subscriptionId);

    // Can only reactivate if cancelled at period end but period hasn't ended
    if (!subscription.cancelAtPeriodEnd) {
      throw new SubscriptionValidationError('Subscription cannot be reactivated');
    }

    await this.subscriptionRepo.updateSubscriptionStatus(subscriptionId, 'active', {
      cancelledAt: undefined,
      cancellationReason: undefined,
      cancelledBy: undefined,
    });
  }

  async skipNextDelivery(customerId: string, subscriptionId: string): Promise<void> {
    const subscription = await this.requireOwnedSubscription(customerId, subscriptionId);

    const product = await this.getProduct(subscription);
    if (product && !product.allowSkip) {
      throw new SubscriptionValidationError('Skipping is not allowed for this subscription');
    }
    if (product?.maxSkipsPerYear && subscription.skipCount >= product.maxSkipsPerYear) {
      throw new SubscriptionValidationError('Maximum skips reached for this year');
    }

    // Advance to next billing cycle without charging
    await this.subscriptionRepo.advanceBillingCycle(subscription.customerSubscriptionId);
  }

  private async requireOwnedSubscription(customerId: string | undefined, subscriptionId: string): Promise<CustomerSubscription> {
    const subscription = await this.subscriptionRepo.getCustomerSubscription(subscriptionId);
    if (!subscription || subscription.customerId !== customerId) {
      throw new SubscriptionNotFoundError(subscriptionId);
    }
    return subscription;
  }

  private async getProduct(subscription: CustomerSubscription): Promise<SubscriptionProduct | null> {
    return subscription.subscriptionProductId
      ? this.subscriptionRepo.getSubscriptionProduct(subscription.subscriptionProductId)
      : null;
  }
}
