/**
 * CreateReward Use Case
 *
 * Creates a new reward that can be redeemed with loyalty points.
 */

export interface CreateRewardInput {
  programId?: string;
  name: string;
  description: string;
  type: 'discount' | 'free_product' | 'free_shipping' | 'experience' | 'gift_card';
  pointsCost: number;
  value?: number;
  valueType?: 'percentage' | 'fixed';
  productId?: string;
  categoryId?: string;
  minOrderValue?: number;
  maxUsagePerCustomer?: number;
  totalQuantity?: number;
  validFrom?: Date;
  validTo?: Date;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateRewardOutput {
  rewardId: string;
  name: string;
  pointsCost: number;
  type: string;
  isActive: boolean;
  createdAt: string;
}

export class CreateRewardUseCase {
  constructor(private readonly loyaltyRepository: any) {}

  async execute(input: CreateRewardInput): Promise<CreateRewardOutput> {
    const {
      programId,
      name,
      description,
      type,
      pointsCost,
      value,
      valueType,
      productId,
      categoryId,
      minOrderValue,
      maxUsagePerCustomer,
      totalQuantity,
      validFrom,
      validTo,
      isActive = true,
      metadata,
    } = input;

    // Validate input
    if (pointsCost <= 0) {
      throw new Error('Points cost must be greater than 0');
    }

    if (type === 'discount' && (!value || !valueType)) {
      throw new Error('Discount rewards require value and valueType');
    }

    if (type === 'free_product' && !productId) {
      throw new Error('Free product rewards require a productId');
    }

    // Create reward
    const reward = await this.loyaltyRepository.createReward({
      programId,
      name,
      description,
      type,
      pointsCost,
      value,
      valueType,
      productId,
      categoryId,
      minOrderValue,
      maxUsagePerCustomer,
      totalQuantity,
      remainingQuantity: totalQuantity,
      validFrom: validFrom || new Date(),
      validTo,
      isActive,
      metadata,
      createdAt: new Date(),
    });

    return {
      rewardId: reward.rewardId,
      name: reward.name,
      pointsCost: reward.pointsCost,
      type: reward.type,
      isActive: reward.isActive,
      createdAt: reward.createdAt.toISOString(),
    };
  }
}
