/**
 * Create Promotion Record Use Case
 * Validates input and creates a promotion record (business API semantics).
 * Distinct from CreatePromotionUseCase, which models the cart-scoped
 * GraphQL promotion API.
 */

import type { CreatePromotionInput, PromotionRepository, Promotion } from '../../domain/repositories/PromotionRepository';
import { PromotionValidationError } from '../../domain/errors/PromotionErrors';

export type CreatePromotionRecordPort = Pick<PromotionRepository, 'create'>;

export class CreatePromotionRecordUseCase {
  constructor(private readonly promotions: CreatePromotionRecordPort) {}

  async execute(input: CreatePromotionInput): Promise<Promotion> {
    if (!input.name || !input.status || !input.scope || !input.startDate) {
      throw new PromotionValidationError('Missing required fields');
    }

    if (input.priority === undefined) {
      input.priority = 10; // Default priority
    }

    if (input.isExclusive === undefined) {
      input.isExclusive = false; // Default non-exclusive
    }

    return this.promotions.create(input);
  }
}
