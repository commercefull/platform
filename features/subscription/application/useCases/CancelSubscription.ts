/**
 * Cancel Subscription Use Case
 * Cancels a customer subscription
 */

import * as subscriptionRepo from '../../repos/subscriptionRepo';
import { CustomerSubscription } from '../../repos/subscriptionRepo';

// ============================================================================
// Command
// ============================================================================

export interface CancelSubscriptionInput {
  customerSubscriptionId: string;
  reason?: string;
  cancelledBy: 'customer' | 'admin' | 'system';
  cancelImmediately?: boolean;
}

export class CancelSubscriptionCommand {
  constructor(public readonly input: CancelSubscriptionInput) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CancelSubscriptionResponse {
  success: boolean;
  subscription?: CustomerSubscription;
  message?: string;
  errors?: string[];
}

// ============================================================================
// Use Case
// ============================================================================

export class CancelSubscriptionUseCase {
  async execute(command: CancelSubscriptionCommand): Promise<CancelSubscriptionResponse> {
    const { input } = command;

    if (!input.customerSubscriptionId) {
      return {
        success: false,
        message: 'Subscription ID is required',
        errors: ['subscription_id_required']
      };
    }

    try {
      // 1. Get the subscription
      const subscription = await subscriptionRepo.getCustomerSubscription(input.customerSubscriptionId);
      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found',
          errors: ['subscription_not_found']
        };
      }

      // 2. Check if already cancelled
      if (subscription.status === 'cancelled') {
        return {
          success: false,
          message: 'Subscription is already cancelled',
          errors: ['already_cancelled']
        };
      }

      // 3. Get the product to check cancellation rules
      const product = subscription.subscriptionProductId 
        ? await subscriptionRepo.getSubscriptionProduct(subscription.subscriptionProductId)
        : null;

      // 4. Check if early cancellation is allowed
      if (product && !product.allowEarlyCancel && subscription.contractCyclesRemaining && subscription.contractCyclesRemaining > 0) {
        return {
          success: false,
          message: 'Early cancellation is not allowed for this subscription',
          errors: ['early_cancel_not_allowed']
        };
      }

      // 5. Cancel the subscription
      await subscriptionRepo.cancelSubscription(
        input.customerSubscriptionId,
        input.reason,
        input.cancelledBy,
        !input.cancelImmediately // cancelAtPeriodEnd = true if not immediate
      );

      // 6. Get updated subscription
      const updatedSubscription = await subscriptionRepo.getCustomerSubscription(input.customerSubscriptionId);

      // TODO: Emit SubscriptionCancelled event

      return {
        success: true,
        subscription: updatedSubscription || undefined,
        message: input.cancelImmediately 
          ? 'Subscription cancelled immediately' 
          : 'Subscription will be cancelled at the end of the current billing period'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to cancel subscription',
        errors: ['cancellation_failed']
      };
    }
  }
}

export const cancelSubscriptionUseCase = new CancelSubscriptionUseCase();
