/**
 * Check Gift Card Balance Use Case
 * Retrieves gift card balance and status
 */

import * as giftCardRepo from '../../repos/giftCardRepo';

// ============================================================================
// Query
// ============================================================================

export class CheckGiftCardBalanceQuery {
  constructor(public readonly code: string) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CheckGiftCardBalanceResponse {
  success: boolean;
  code?: string;
  currentBalance?: number;
  currency?: string;
  status?: string;
  expiresAt?: Date;
  isReloadable?: boolean;
  message?: string;
  errors?: string[];
}

// ============================================================================
// Use Case
// ============================================================================

export class CheckGiftCardBalanceUseCase {
  async execute(query: CheckGiftCardBalanceQuery): Promise<CheckGiftCardBalanceResponse> {
    // Validate input
    if (!query.code?.trim()) {
      return { success: false, message: 'Gift card code is required', errors: ['code_required'] };
    }

    // Find gift card by code
    const giftCard = await giftCardRepo.getGiftCardByCode(query.code);

    if (!giftCard) {
      return { success: false, message: 'Gift card not found', errors: ['gift_card_not_found'] };
    }

    // Check if expired
    const isExpired = giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date();

    return {
      success: true,
      code: giftCard.code,
      currentBalance: giftCard.currentBalance,
      currency: giftCard.currency,
      status: isExpired ? 'expired' : giftCard.status,
      expiresAt: giftCard.expiresAt,
      isReloadable: giftCard.isReloadable,
      message:
        giftCard.status === 'active' && !isExpired ? 'Gift card is valid' : `Gift card is ${isExpired ? 'expired' : giftCard.status}`,
    };
  }
}

export const checkGiftCardBalanceUseCase = new CheckGiftCardBalanceUseCase();
