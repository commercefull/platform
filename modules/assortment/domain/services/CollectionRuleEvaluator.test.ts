import { assertValidConditions, conditionsToFilters } from './CollectionRuleEvaluator';
import { CollectionValidationError } from '../errors/AssortmentErrors';
import type { CollectionCondition } from '../entities/Collection';

describe('CollectionRuleEvaluator', () => {
  it('should map query condition to search filter', () => {
    const filters = conditionsToFilters([{ field: 'query', operator: 'contains', value: 'shoe' }]);
    expect(filters.query).toBe('shoe');
  });

  it('should map categoryId equals to category filter', () => {
    const filters = conditionsToFilters([{ field: 'categoryId', operator: 'equals', value: 'cat-1' }]);
    expect(filters.categoryId).toBe('cat-1');
  });

  it('should skip categoryId notEquals since exclusion is not expressible', () => {
    const filters = conditionsToFilters([{ field: 'categoryId', operator: 'notEquals', value: 'cat-1' }]);
    expect(filters.categoryId).toBeUndefined();
  });

  it('should map priceCents operators to min/max bounds', () => {
    const conditions: CollectionCondition[] = [
      { field: 'priceCents', operator: 'gte', value: 1000 },
      { field: 'priceCents', operator: 'lt', value: 5000 },
    ];
    const filters = conditionsToFilters(conditions);
    expect(filters.priceMinCents).toBe(1000);
    expect(filters.priceMaxCents).toBe(5000);
  });

  it('should collect multiple tag conditions into tags array', () => {
    const filters = conditionsToFilters([
      { field: 'tag', operator: 'equals', value: 'summer' },
      { field: 'tag', operator: 'equals', value: 'sale' },
    ]);
    expect(filters.tags).toEqual(['summer', 'sale']);
  });

  it('should map isFeatured boolean and string values', () => {
    expect(conditionsToFilters([{ field: 'isFeatured', operator: 'equals', value: true }]).isFeatured).toBe(true);
    expect(conditionsToFilters([{ field: 'isFeatured', operator: 'equals', value: 'true' }]).isFeatured).toBe(true);
    expect(conditionsToFilters([{ field: 'isFeatured', operator: 'equals', value: false }]).isFeatured).toBe(false);
  });

  it('should throw when condition field is unknown', () => {
    expect(() => assertValidConditions([{ field: 'unknown' as never, operator: 'equals', value: 'x' }])).toThrow(CollectionValidationError);
  });

  it('should throw when operator is invalid for field', () => {
    expect(() => assertValidConditions([{ field: 'priceCents', operator: 'equals', value: 100 }])).toThrow(CollectionValidationError);
    expect(() => assertValidConditions([{ field: 'query', operator: 'equals', value: 'x' }])).toThrow(CollectionValidationError);
  });
});
