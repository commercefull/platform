/**
 * ManageRecommendationRules tests — validation, tenant scoping, audit events.
 */

import { lazyMock, ORG_ID, emitMock } from '../../tests/testUtils';
import { ManageRecommendationRulesUseCase } from './ManageRecommendationRules';
import type { RuleRepository } from '../../domain/repositories/RuleRepository';
import type { RecommendationRuleProps } from '../../domain/entities/RecommendationRule';
import { RecommendationRuleNotFoundError, RecommendationValidationError } from '../../domain/errors/RecommendationErrors';

function rule(overrides: Partial<RecommendationRuleProps> = {}): RecommendationRuleProps {
  return {
    recommendationRuleId: 'rule-1',
    organizationId: ORG_ID,
    storeId: null,
    name: 'Cameras → Memory',
    sourceType: 'category',
    sourceId: 'cat-cameras',
    targetType: 'category',
    targetId: 'cat-memory',
    relationType: 'accessory',
    targetSort: 'bestSelling',
    priceBand: 'any',
    maxItems: 4,
    priority: 0,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

const validInput: Partial<RecommendationRuleProps> = {
  name: 'Cameras → Memory',
  sourceType: 'category',
  sourceId: 'cat-cameras',
  targetType: 'category',
  targetId: 'cat-memory',
};

describe('ManageRecommendationRulesUseCase', () => {
  let rules: jest.Mocked<RuleRepository>;
  let useCase: ManageRecommendationRulesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    rules = lazyMock<RuleRepository>();
    useCase = new ManageRecommendationRulesUseCase(rules);
  });

  it('should create a rule and emit recommendation.rule_created', async () => {
    rules.create.mockResolvedValue(rule());

    const created = await useCase.create(ORG_ID, validInput);

    expect(rules.create).toHaveBeenCalledWith(expect.objectContaining({ organizationId: ORG_ID, relationType: 'related', maxItems: 4 }));
    expect(created.recommendationRuleId).toBe('rule-1');
    expect(emitMock).toHaveBeenCalledWith('recommendation.rule_created', { recommendationRuleId: 'rule-1', organizationId: ORG_ID });
  });

  it('should reject create without a name', async () => {
    await expect(useCase.create(ORG_ID, { ...validInput, name: ' ' })).rejects.toThrow(RecommendationValidationError);
    expect(rules.create).not.toHaveBeenCalled();
  });

  it('should reject an invalid sourceType', async () => {
    await expect(useCase.create(ORG_ID, { ...validInput, sourceType: 'weather' as RecommendationRuleProps['sourceType'] })).rejects.toThrow(
      RecommendationValidationError,
    );
  });

  it('should reject maxItems outside 1-50', async () => {
    await expect(useCase.create(ORG_ID, { ...validInput, maxItems: 0 })).rejects.toThrow(RecommendationValidationError);
    await expect(useCase.create(ORG_ID, { ...validInput, maxItems: 51 })).rejects.toThrow(RecommendationValidationError);
  });

  it('should update a rule in the same organization', async () => {
    rules.findById.mockResolvedValue(rule());
    rules.update.mockResolvedValue(rule({ name: 'Renamed' }));

    const updated = await useCase.update(ORG_ID, 'rule-1', { name: 'Renamed' });

    expect(updated.name).toBe('Renamed');
    expect(emitMock).toHaveBeenCalledWith('recommendation.rule_updated', { recommendationRuleId: 'rule-1', organizationId: ORG_ID });
  });

  it('should reject updating a rule owned by another organization', async () => {
    rules.findById.mockResolvedValue(rule({ organizationId: 'other-org' }));

    await expect(useCase.update(ORG_ID, 'rule-1', { name: 'x' })).rejects.toThrow(RecommendationRuleNotFoundError);
    expect(rules.update).not.toHaveBeenCalled();
  });

  it('should reject deleting a missing rule', async () => {
    rules.findById.mockResolvedValue(null);
    await expect(useCase.delete(ORG_ID, 'rule-1')).rejects.toThrow(RecommendationRuleNotFoundError);
  });

  it('should delete a rule and emit recommendation.rule_deleted', async () => {
    rules.findById.mockResolvedValue(rule());

    await useCase.delete(ORG_ID, 'rule-1');

    expect(rules.delete).toHaveBeenCalledWith('rule-1');
    expect(emitMock).toHaveBeenCalledWith('recommendation.rule_deleted', { recommendationRuleId: 'rule-1', organizationId: ORG_ID });
  });
});
