/**
 * Apply Promotion Use Case
 */

import { PromotionRepository } from '../../domain/repositories/PromotionRepository';

// ============================================================================
// Command
// ============================================================================

export class ApplyPromotionCommand {
  constructor(
    public readonly code: string,
    public readonly subtotal: number,
    public readonly customerId?: string
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ApplyPromotionResponse {
  valid: boolean;
  promotionId?: string;
  code?: string;
  type?: string;
  discountAmount?: number;
  message?: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ApplyPromotionUseCase {
  constructor(private readonly promotionRepository: PromotionRepository) {}

  async execute(command: ApplyPromotionCommand): Promise<ApplyPromotionResponse> {
    if (!command.code?.trim()) {
      return { valid: false, message: 'Promotion code is required' };
    }

    const result = await this.promotionRepository.validateCode(
      command.code.toUpperCase(),
      command.subtotal,
      command.customerId
    );

    if (!result.valid) {
      return { valid: false, message: result.message || 'Invalid promotion code' };
    }

    return {
      valid: true,
      promotionId: result.promotion?.promotionId,
      code: result.promotion?.code,
      type: result.promotion?.type,
      discountAmount: result.discount,
      message: 'Promotion applied successfully'
    };
  }
}
