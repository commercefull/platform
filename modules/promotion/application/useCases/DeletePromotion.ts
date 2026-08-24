/**
 * Delete Promotion Use Case
 * Deletes a promotion
 */

import promotionRuleRepository from '../../infrastructure/repositories/PromotionRuleRepository';
import { PromotionNotFoundError } from '../../domain/errors/PromotionErrors';

// Command
export class DeletePromotionCommand {
  constructor(public readonly promotionId: string) {}
}

// Response
export interface DeletePromotionResponse {
  promotionId: string;
  deleted: boolean;
}

// Use Case
export class DeletePromotionUseCase {
  constructor(private readonly promotionRepo: typeof promotionRuleRepository.promotions) {}

  async execute(command: DeletePromotionCommand): Promise<DeletePromotionResponse> {
    // Check if promotion exists
    const existingPromotion = await this.promotionRepo.findById(command.promotionId);
    if (!existingPromotion) {
      throw new PromotionNotFoundError(command.promotionId);
    }

    // Delete promotion
    const deleted = await this.promotionRepo.delete(command.promotionId);

    return {
      promotionId: command.promotionId,
      deleted,
    };
  }
}
