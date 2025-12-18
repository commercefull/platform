/**
 * Create Subscription Use Case
 * Creates a new customer subscription
 */

import * as subscriptionRepo from '../../repos/subscriptionRepo';
import { CustomerSubscription, SubscriptionPlan, SubscriptionProduct } from '../../repos/subscriptionRepo';

// ============================================================================
// Command
// ============================================================================

export interface CreateSubscriptionInput {
  customerId: string;
  subscriptionPlanId: string;
  productVariantId?: string;
  quantity?: number;
  paymentMethodId?: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  customizations?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class CreateSubscriptionCommand {
  constructor(public readonly input: CreateSubscriptionInput) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreateSubscriptionResponse {
  success: boolean;
  subscription?: CustomerSubscription;
  plan?: SubscriptionPlan;
  product?: SubscriptionProduct;
  message?: string;
  errors?: string[];
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateSubscriptionUseCase {
  async execute(command: CreateSubscriptionCommand): Promise<CreateSubscriptionResponse> {
    const { input } = command;

    // Validate required fields
    if (!input.customerId) {
      return {
        success: false,
        message: 'Customer ID is required',
        errors: ['customer_id_required']
      };
    }

    if (!input.subscriptionPlanId) {
      return {
        success: false,
        message: 'Subscription plan ID is required',
        errors: ['plan_id_required']
      };
    }

    try {
      // 1. Get the subscription plan
      const plan = await subscriptionRepo.getSubscriptionPlan(input.subscriptionPlanId);
      if (!plan) {
        return {
          success: false,
          message: 'Subscription plan not found',
          errors: ['plan_not_found']
        };
      }

      if (!plan.isActive) {
        return {
          success: false,
          message: 'Subscription plan is not active',
          errors: ['plan_inactive']
        };
      }

      // 2. Get the subscription product
      const product = await subscriptionRepo.getSubscriptionProduct(plan.subscriptionProductId);
      if (!product || !product.isActive) {
        return {
          success: false,
          message: 'Subscription product is not available',
          errors: ['product_unavailable']
        };
      }

      // 3. Calculate pricing
      const quantity = input.quantity || 1;
      const unitPrice = plan.price;
      const discountAmount = plan.discountAmount || 0;
      const subtotal = unitPrice * quantity - discountAmount;
      const taxAmount = 0; // Would be calculated by tax service
      const totalPrice = subtotal + taxAmount;

      // 4. Determine trial period
      const trialDays = plan.trialDays || product.trialDays || 0;
      const now = new Date();
      let trialStartAt: Date | undefined;
      let trialEndAt: Date | undefined;
      let currentPeriodStart = now;
      let currentPeriodEnd: Date;
      let status: 'pending' | 'trialing' | 'active' = 'pending';

      if (trialDays > 0) {
        trialStartAt = now;
        trialEndAt = new Date(now);
        trialEndAt.setDate(trialEndAt.getDate() + trialDays);
        currentPeriodEnd = trialEndAt;
        status = 'trialing';
      } else {
        currentPeriodEnd = this.calculatePeriodEnd(now, plan.billingInterval, plan.billingIntervalCount);
        status = 'active';
      }

      // 5. Create the subscription (the repo handles status, trial dates, pricing internally)
      const subscription = await subscriptionRepo.createCustomerSubscription({
        customerId: input.customerId,
        subscriptionPlanId: input.subscriptionPlanId,
        subscriptionProductId: plan.subscriptionProductId,
        productVariantId: input.productVariantId,
        quantity,
        shippingAddressId: input.shippingAddressId,
        billingAddressId: input.billingAddressId,
        paymentMethodId: input.paymentMethodId,
        customizations: input.customizations
      });

      // TODO: Emit SubscriptionCreated event

      return {
        success: true,
        subscription,
        plan,
        product,
        message: status === 'trialing' 
          ? `Subscription created with ${trialDays}-day trial` 
          : 'Subscription created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create subscription',
        errors: ['creation_failed']
      };
    }
  }

  private calculatePeriodEnd(start: Date, interval: string, count: number): Date {
    const end = new Date(start);
    switch (interval) {
      case 'day':
        end.setDate(end.getDate() + count);
        break;
      case 'week':
        end.setDate(end.getDate() + (count * 7));
        break;
      case 'month':
        end.setMonth(end.getMonth() + count);
        break;
      case 'year':
        end.setFullYear(end.getFullYear() + count);
        break;
    }
    return end;
  }
}

export const createSubscriptionUseCase = new CreateSubscriptionUseCase();
