/**
 * Delete Promotion Use Case
 * Deletes a promotion
 */

import { PromotionRepository } from '../../domain/repositories/PromotionRepository';
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
  constructor(private readonly promotionRepo: PromotionRepository) {}

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
