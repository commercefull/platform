/**
 * Create Promotion Use Case
 * Creates a new promotion
 */

import { PromotionRepo } from '../../repos/promotionRepo';

// Command
export class CreatePromotionCommand {
  constructor(
    public readonly name: string,
    public readonly type: 'percentage' | 'fixed_amount' | 'free_shipping',
    public readonly value: number,
    public readonly code?: string,
    public readonly description?: string,
    public readonly minOrderAmount?: number,
    public readonly maxDiscountAmount?: number,
    public readonly usageLimit?: number,
    public readonly usageLimitPerCustomer?: number,
    public readonly startsAt?: Date,
    public readonly endsAt?: Date,
    public readonly merchantId?: string,
  ) {}
}

// Response
export interface CreatePromotionResponse {
  promotionId: string;
  code?: string;
  name: string;
  status: string;
  createdAt: string;
}

// Use Case
export class CreatePromotionUseCase {
  constructor(private readonly promotionRepo: PromotionRepo) {}

  async execute(command: CreatePromotionCommand): Promise<CreatePromotionResponse> {
    // Validate command
    if (!command.name?.trim()) {
      throw new Error('Promotion name is required');
    }
    if (!command.type) {
      throw new Error('Promotion type is required');
    }
    if (command.value === undefined || command.value < 0) {
      throw new Error('Valid promotion value is required');
    }

    // Check for duplicate code if provided
    if (command.code) {
      const existing = await this.promotionRepo.findById(command.code);
      if (existing) {
        throw new Error(`Promotion with code "${command.code}" already exists`);
      }
    }

    // Create promotion using repository
    const promotion = await this.promotionRepo.create({
      name: command.name,
      description: command.description,
      status: command.startsAt && command.startsAt > new Date() ? 'scheduled' : 'active',
      scope: 'cart', // Default scope
      startDate: command.startsAt,
      endDate: command.endsAt,
      isActive: true,
      maxUsage: command.usageLimit,
      maxUsagePerCustomer: command.usageLimitPerCustomer,
      minOrderAmount: command.minOrderAmount,
      maxDiscountAmount: command.maxDiscountAmount,
      merchantId: command.merchantId,
      // Add actions based on type
      actions: [
        {
          type: this.mapTypeToAction(command.type),
          value: command.value,
        },
      ],
    });

    return this.mapToResponse(promotion);
  }

  private mapTypeToAction(type: string): 'discountByPercentage' | 'discountByAmount' | 'discountShipping' {
    switch (type) {
      case 'percentage':
        return 'discountByPercentage';
      case 'fixed_amount':
        return 'discountByAmount';
      case 'free_shipping':
        return 'discountShipping';
      default:
        return 'discountByAmount';
    }
  }

  private mapToResponse(promotion: any): CreatePromotionResponse {
    return {
      promotionId: promotion.promotionId,
      code: promotion.code,
      name: promotion.name,
      status: promotion.status,
      createdAt: promotion.createdAt?.toISOString() || new Date().toISOString(),
    };
  }
}
