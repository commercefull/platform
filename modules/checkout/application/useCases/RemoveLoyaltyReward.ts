/**
 * Remove Loyalty Reward Use Case
 * Removes a loyalty reward from a checkout session before payment.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';
import { NotFoundError } from '../../../../libs/errors';

// ============================================================================
// Command
// ============================================================================

export class RemoveLoyaltyRewardCommand {
  constructor(public readonly checkoutId: string) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class RemoveLoyaltyRewardUseCase {
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: RemoveLoyaltyRewardCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new NotFoundError('Checkout session not found');
    }

    session.removeLoyaltyReward();
    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'loyaltyReward',
      loyaltyRewardId: null,
    });

    return mapCheckoutToResponse(session);
  }
}
