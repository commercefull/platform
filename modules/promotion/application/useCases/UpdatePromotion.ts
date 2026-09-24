/**
 * Update Promotion Use Case
 * Updates an existing promotion
 */

import { PromotionRepository, type UpdatePromotionInput } from '../../domain/repositories/PromotionRepository';
import { Promotion } from '../../../../libs/db/types';
import { PromotionNotFoundError, PromotionValidationError } from '../../domain/errors/PromotionErrors';

// Command
export class UpdatePromotionCommand {
  constructor(
    public readonly promotionId: string,
    public readonly updates: Partial<{
      name: string;
      description: string;
      status: string;
      value: number;
      minOrderAmountCents: number;
      maxDiscountAmountCents: number;
      usageLimit: number;
      usageLimitPerCustomer: number;
      startsAt: Date;
      endsAt: Date;
      isActive: boolean;
    }>,
  ) {}
}

// Response
export interface UpdatePromotionResponse {
  promotionId: string;
  name: string;
  status: string;
  updatedAt: string;
}

// Use Case
export class UpdatePromotionUseCase {
  constructor(private readonly promotionRepo: PromotionRepository) {}

  async execute(command: UpdatePromotionCommand): Promise<UpdatePromotionResponse> {
    // Find existing promotion
    const existingPromotion = await this.promotionRepo.findById(command.promotionId);
    if (!existingPromotion) {
      throw new PromotionNotFoundError(command.promotionId);
    }

    // Validate updates
    if (command.updates.value !== undefined && command.updates.value < 0) {
      throw new PromotionValidationError('Promotion value cannot be negative');
    }

    // Prepare update input for repository
    const updateInput: UpdatePromotionInput = {};

    if (command.updates.name !== undefined) updateInput.name = command.updates.name;
    if (command.updates.description !== undefined) updateInput.description = command.updates.description;
    if (command.updates.status !== undefined) updateInput.status = command.updates.status as UpdatePromotionInput['status'];
    if (command.updates.minOrderAmountCents !== undefined) updateInput.minOrderAmountCents = command.updates.minOrderAmountCents;
    if (command.updates.maxDiscountAmountCents !== undefined) updateInput.maxDiscountAmountCents = command.updates.maxDiscountAmountCents;
    if (command.updates.usageLimit !== undefined) updateInput.maxUsage = command.updates.usageLimit;
    if (command.updates.usageLimitPerCustomer !== undefined) updateInput.maxUsagePerCustomer = command.updates.usageLimitPerCustomer;
    if (command.updates.startsAt !== undefined) updateInput.startDate = command.updates.startsAt;
    if (command.updates.endsAt !== undefined) updateInput.endDate = command.updates.endsAt;
    if (command.updates.isActive !== undefined) updateInput.isActive = command.updates.isActive;

    // Update promotion
    const updatedPromotion = await this.promotionRepo.update(command.promotionId, updateInput);

    return this.mapToResponse(updatedPromotion);
  }

  private mapToResponse(promotion: Promotion): UpdatePromotionResponse {
    return {
      promotionId: promotion.promotionId,
      name: promotion.name,
      status: promotion.status,
      updatedAt: promotion.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
