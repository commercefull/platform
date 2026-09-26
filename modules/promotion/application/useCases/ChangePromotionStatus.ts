/**
 * Change Promotion Status Use Case
 * Promotion lifecycle transitions: activate and pause.
 */

import type {
  PromotionRepository,
  Promotion,
  UpdatePromotionInput,
} from '../../domain/repositories/PromotionRepository';
import { PromotionNotFoundError } from '../../domain/errors/PromotionErrors';

export type ChangePromotionStatusPort = Pick<PromotionRepository, 'findById' | 'update'>;

export class ChangePromotionStatusUseCase {
  constructor(private readonly promotions: ChangePromotionStatusPort) {}

  async activate(promotionId: string): Promise<Promotion> {
    await this.requirePromotion(promotionId);
    return this.promotions.update(promotionId, { status: 'active' });
  }

  async pause(promotionId: string): Promise<Promotion> {
    await this.requirePromotion(promotionId);
    return this.promotions.update(promotionId, { status: 'paused' as UpdatePromotionInput['status'] });
  }

  private async requirePromotion(promotionId: string): Promise<void> {
    const existing = await this.promotions.findById(promotionId);
    if (!existing) {
      throw new PromotionNotFoundError(promotionId);
    }
  }
}
