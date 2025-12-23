/**
 * Redeem Gift Card Use Case
 * Handles gift card redemption for orders
 */

import * as giftCardRepo from '../../repos/giftCardRepo';

// ============================================================================
// Command
// ============================================================================

export class RedeemGiftCardCommand {
  constructor(
    public readonly code: string,
    public readonly amount: number,
    public readonly orderId?: string,
    public readonly customerId?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface RedeemGiftCardResponse {
  success: boolean;
  transaction?: giftCardRepo.PromotionGiftCardTransaction;
  remainingBalance?: number;
  message?: string;
  errors?: string[];
}

// ============================================================================
// Use Case
// ============================================================================

export class RedeemGiftCardUseCase {
  async execute(command: RedeemGiftCardCommand): Promise<RedeemGiftCardResponse> {
    // Validate input
    if (!command.code?.trim()) {
      return { success: false, message: 'Gift card code is required', errors: ['code_required'] };
    }

    if (command.amount <= 0) {
      return { success: false, message: 'Amount must be positive', errors: ['invalid_amount'] };
    }

    // Find gift card by code
    const giftCard = await giftCardRepo.getGiftCardByCode(command.code);

    if (!giftCard) {
      return { success: false, message: 'Gift card not found', errors: ['gift_card_not_found'] };
    }

    // Check if gift card is active
    if (giftCard.status !== 'active') {
      return {
        success: false,
        message: `Gift card is ${giftCard.status}`,
        errors: ['gift_card_not_active'],
      };
    }

    // Check expiration
    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      return { success: false, message: 'Gift card has expired', errors: ['gift_card_expired'] };
    }

    // Check balance
    if (giftCard.currentBalance < command.amount) {
      return {
        success: false,
        message: `Insufficient balance. Available: ${giftCard.currentBalance}`,
        errors: ['insufficient_balance'],
      };
    }

    try {
      // Redeem the gift card
      const transaction = await giftCardRepo.redeemGiftCard(
        giftCard.promotionGiftCardId,
        command.amount,
        command.orderId,
        command.customerId,
      );

      // Get updated gift card for remaining balance
      const updatedGiftCard = await giftCardRepo.getGiftCard(giftCard.promotionGiftCardId);

      return {
        success: true,
        transaction,
        remainingBalance: updatedGiftCard?.currentBalance ?? 0,
        message: 'Gift card redeemed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to redeem gift card',
        errors: ['redemption_failed'],
      };
    }
  }
}

export const redeemGiftCardUseCase = new RedeemGiftCardUseCase();
