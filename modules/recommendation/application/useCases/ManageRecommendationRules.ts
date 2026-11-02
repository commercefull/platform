/**
 * Manage Recommendation Rules Use Case — merchant CRUD for rules.
 * Emits recommendation.rule_* events for audit/webhook consumers.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import type { RuleRepository } from '../../domain/repositories/RuleRepository';
import {
  RULE_PRICE_BANDS,
  RULE_SOURCE_TYPES,
  RULE_TARGET_SORTS,
  RULE_TARGET_TYPES,
  type RecommendationRuleProps,
} from '../../domain/entities/RecommendationRule';
import { RecommendationRuleNotFoundError, RecommendationValidationError } from '../../domain/errors/RecommendationErrors';

const RELATION_TYPES = ['related', 'accessory', 'cross_sell', 'up_sell'];

export class ManageRecommendationRulesUseCase {
  constructor(private readonly rules: RuleRepository) {}

  async list(organizationId: string): Promise<RecommendationRuleProps[]> {
    return this.rules.list(organizationId);
  }

  async create(
    organizationId: string,
    input: Partial<RecommendationRuleProps> & { storeId?: string | null },
  ): Promise<RecommendationRuleProps> {
    this.validate(input);
    const created = await this.rules.create({
      organizationId,
      storeId: input.storeId ?? null,
      name: input.name!,
      sourceType: input.sourceType!,
      sourceId: input.sourceId!,
      targetType: input.targetType!,
      targetId: input.targetId!,
      relationType: input.relationType ?? 'related',
      targetSort: input.targetSort ?? 'bestSelling',
      priceBand: input.priceBand ?? 'any',
      maxItems: input.maxItems ?? 4,
      priority: input.priority ?? 0,
      isActive: input.isActive ?? true,
    });
    await eventBus.emit('recommendation.rule_created', { recommendationRuleId: created.recommendationRuleId, organizationId });
    return created;
  }

  async update(organizationId: string, ruleId: string, input: Partial<RecommendationRuleProps>): Promise<RecommendationRuleProps> {
    const existing = await this.rules.findById(ruleId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new RecommendationRuleNotFoundError(ruleId);
    }
    this.validate({ ...existing, ...input });
    const updated = await this.rules.update(ruleId, {
      name: input.name,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      targetType: input.targetType,
      targetId: input.targetId,
      relationType: input.relationType,
      targetSort: input.targetSort,
      priceBand: input.priceBand,
      maxItems: input.maxItems,
      priority: input.priority,
      isActive: input.isActive,
      storeId: input.storeId,
    });
    if (!updated) throw new RecommendationRuleNotFoundError(ruleId);
    await eventBus.emit('recommendation.rule_updated', { recommendationRuleId: ruleId, organizationId });
    return updated;
  }

  async delete(organizationId: string, ruleId: string): Promise<void> {
    const existing = await this.rules.findById(ruleId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new RecommendationRuleNotFoundError(ruleId);
    }
    await this.rules.delete(ruleId);
    await eventBus.emit('recommendation.rule_deleted', { recommendationRuleId: ruleId, organizationId });
  }

  private validate(input: Partial<RecommendationRuleProps>): void {
    if (!input.name?.trim()) throw new RecommendationValidationError('name is required');
    if (!input.sourceId) throw new RecommendationValidationError('sourceId is required');
    if (!input.targetId) throw new RecommendationValidationError('targetId is required');

    const enumChecks: Array<[keyof RecommendationRuleProps, readonly string[]]> = [
      ['sourceType', RULE_SOURCE_TYPES],
      ['targetType', RULE_TARGET_TYPES],
      ['relationType', RELATION_TYPES],
      ['targetSort', RULE_TARGET_SORTS],
      ['priceBand', RULE_PRICE_BANDS],
    ];
    for (const [field, allowed] of enumChecks) {
      const value = input[field];
      if (value && !allowed.includes(value as string)) {
        throw new RecommendationValidationError(`${field} must be one of ${allowed.join(', ')}`);
      }
    }

    if (input.maxItems !== undefined && (input.maxItems < 1 || input.maxItems > 50)) {
      throw new RecommendationValidationError('maxItems must be between 1 and 50');
    }
  }
}
