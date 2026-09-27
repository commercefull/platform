/**
 * Manage Recommendation Exclusions Use Case — pair and global exclusions.
 */

import type { ExclusionRepository } from '../../domain/repositories/RuleRepository';
import type { RecommendationExclusionProps } from '../../domain/entities/RecommendationExclusion';
import { RecommendationExclusionNotFoundError, RecommendationValidationError } from '../../domain/errors/RecommendationErrors';

export class ManageRecommendationExclusionsUseCase {
  constructor(private readonly exclusions: ExclusionRepository) {}

  async list(organizationId: string): Promise<RecommendationExclusionProps[]> {
    return this.exclusions.list(organizationId);
  }

  async create(
    organizationId: string,
    input: { productId?: string; excludedProductId?: string; scope?: string; reason?: string; storeId?: string | null },
  ): Promise<RecommendationExclusionProps> {
    if (!input.excludedProductId) throw new RecommendationValidationError('excludedProductId is required');
    const scope = input.scope === 'global' ? 'global' : 'pair';
    if (scope === 'pair' && !input.productId) {
      throw new RecommendationValidationError('productId is required for pair exclusions');
    }
    return this.exclusions.create({
      organizationId,
      storeId: input.storeId ?? null,
      productId: input.productId ?? input.excludedProductId,
      excludedProductId: input.excludedProductId,
      scope,
      reason: input.reason ?? null,
    });
  }

  async delete(organizationId: string, exclusionId: string): Promise<void> {
    const all = await this.exclusions.list(organizationId);
    if (!all.some(e => e.recommendationExclusionId === exclusionId)) {
      throw new RecommendationExclusionNotFoundError(exclusionId);
    }
    await this.exclusions.delete(exclusionId);
  }
}
