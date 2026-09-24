import {
  matchCondition,
  matchesConditions,
  countMatchingConditions,
  normalizeCondition,
  normalizeConditions,
  AttributeCondition,
  ConditionOperator,
  ConditionContext,
} from './conditions';

describe('libs/rules/conditions', () => {
  describe('matchCondition — eq / neq', () => {
    it('eq matches equal values', () => {
      const ctx: ConditionContext = { country: 'US' };
      expect(matchCondition({ attribute: 'country', operator: 'eq', value: 'US' }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'country', operator: 'eq', value: 'CA' }, ctx)).toBe(false);
    });

    it('neq matches non-equal values', () => {
      const ctx: ConditionContext = { country: 'US' };
      expect(matchCondition({ attribute: 'country', operator: 'neq', value: 'CA' }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'country', operator: 'neq', value: 'US' }, ctx)).toBe(false);
    });

    it('eq handles missing context key (undefined)', () => {
      const ctx: ConditionContext = {};
      expect(matchCondition({ attribute: 'missing', operator: 'eq', value: undefined }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'missing', operator: 'eq', value: 'x' }, ctx)).toBe(false);
    });
  });

  describe('matchCondition — gt / gte / lt / lte', () => {
    const ctx: ConditionContext = { total: 100 };

    it('gt', () => {
      expect(matchCondition({ attribute: 'total', operator: 'gt', value: 50 }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'total', operator: 'gt', value: 100 }, ctx)).toBe(false);
    });

    it('gte', () => {
      expect(matchCondition({ attribute: 'total', operator: 'gte', value: 100 }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'total', operator: 'gte', value: 101 }, ctx)).toBe(false);
    });

    it('lt', () => {
      expect(matchCondition({ attribute: 'total', operator: 'lt', value: 101 }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'total', operator: 'lt', value: 100 }, ctx)).toBe(false);
    });

    it('lte', () => {
      expect(matchCondition({ attribute: 'total', operator: 'lte', value: 100 }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'total', operator: 'lte', value: 99 }, ctx)).toBe(false);
    });

    it('coerces numeric strings', () => {
      const strCtx: ConditionContext = { total: '100' };
      expect(matchCondition({ attribute: 'total', operator: 'gt', value: 50 }, strCtx)).toBe(true);
    });

    it('returns false for non-numeric values in numeric operators', () => {
      const badCtx: ConditionContext = { total: 'abc' };
      expect(matchCondition({ attribute: 'total', operator: 'gt', value: 50 }, badCtx)).toBe(false);
    });
  });

  describe('matchCondition — in / notIn', () => {
    const ctx: ConditionContext = { category: 'electronics' };

    it('in matches when value is in array', () => {
      expect(matchCondition({ attribute: 'category', operator: 'in', value: ['electronics', 'books'] }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'category', operator: 'in', value: ['books', 'toys'] }, ctx)).toBe(false);
    });

    it('notIn matches when value is not in array', () => {
      expect(matchCondition({ attribute: 'category', operator: 'notIn', value: ['books'] }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'category', operator: 'notIn', value: ['electronics'] }, ctx)).toBe(false);
    });

    it('in returns false when value is not an array', () => {
      expect(matchCondition({ attribute: 'category', operator: 'in', value: 'electronics' }, ctx)).toBe(false);
    });
  });

  describe('matchCondition — contains / notContains', () => {
    it('contains on string', () => {
      const ctx: ConditionContext = { name: 'Wireless Headphones' };
      expect(matchCondition({ attribute: 'name', operator: 'contains', value: 'Wireless' }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'name', operator: 'contains', value: 'Wired' }, ctx)).toBe(false);
    });

    it('contains on array', () => {
      const ctx: ConditionContext = { tags: ['new', 'sale'] };
      expect(matchCondition({ attribute: 'tags', operator: 'contains', value: 'sale' }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'tags', operator: 'contains', value: 'clearance' }, ctx)).toBe(false);
    });

    it('notContains', () => {
      const ctx: ConditionContext = { name: 'Wireless Headphones' };
      expect(matchCondition({ attribute: 'name', operator: 'notContains', value: 'Wired' }, ctx)).toBe(true);
    });

    it('returns false for null/undefined haystack', () => {
      const ctx: ConditionContext = { name: null };
      expect(matchCondition({ attribute: 'name', operator: 'contains', value: 'x' }, ctx)).toBe(false);
    });
  });

  describe('matchCondition — startsWith / endsWith', () => {
    const ctx: ConditionContext = { sku: 'ABC-123' };

    it('startsWith', () => {
      expect(matchCondition({ attribute: 'sku', operator: 'startsWith', value: 'ABC' }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'sku', operator: 'startsWith', value: 'XYZ' }, ctx)).toBe(false);
    });

    it('endsWith', () => {
      expect(matchCondition({ attribute: 'sku', operator: 'endsWith', value: '123' }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'sku', operator: 'endsWith', value: '456' }, ctx)).toBe(false);
    });

    it('returns false for non-string values', () => {
      const numCtx: ConditionContext = { sku: 123 };
      expect(matchCondition({ attribute: 'sku', operator: 'startsWith', value: '1' }, numCtx)).toBe(false);
    });
  });

  describe('matchCondition — isNull / isNotNull', () => {
    it('isNull matches null and undefined', () => {
      expect(matchCondition({ attribute: 'x', operator: 'isNull' }, { x: null })).toBe(true);
      expect(matchCondition({ attribute: 'x', operator: 'isNull' }, {})).toBe(true);
      expect(matchCondition({ attribute: 'x', operator: 'isNull' }, { x: 'val' })).toBe(false);
    });

    it('isNotNull matches non-null', () => {
      expect(matchCondition({ attribute: 'x', operator: 'isNotNull' }, { x: 'val' })).toBe(true);
      expect(matchCondition({ attribute: 'x', operator: 'isNotNull' }, { x: 0 })).toBe(true);
      expect(matchCondition({ attribute: 'x', operator: 'isNotNull' }, { x: null })).toBe(false);
      expect(matchCondition({ attribute: 'x', operator: 'isNotNull' }, {})).toBe(false);
    });
  });

  describe('matchCondition — regex', () => {
    it('matches valid regex', () => {
      const ctx: ConditionContext = { email: 'user@example.com' };
      expect(matchCondition({ attribute: 'email', operator: 'regex', value: '^.+@example\\.com$' }, ctx)).toBe(true);
      expect(matchCondition({ attribute: 'email', operator: 'regex', value: '^.+@other\\.com$' }, ctx)).toBe(false);
    });

    it('returns false for invalid regex', () => {
      const ctx: ConditionContext = { email: 'user@example.com' };
      expect(matchCondition({ attribute: 'email', operator: 'regex', value: '[' }, ctx)).toBe(false);
    });

    it('returns false for non-string actual', () => {
      const ctx: ConditionContext = { email: 123 };
      expect(matchCondition({ attribute: 'email', operator: 'regex', value: '^.+$' }, ctx)).toBe(false);
    });
  });

  describe('matchCondition — unknown operator', () => {
    it('returns false for unknown operator', () => {
      const ctx: ConditionContext = { x: 1 };
      expect(matchCondition({ attribute: 'x', operator: 'unknown' as ConditionOperator, value: 1 }, ctx)).toBe(false);
    });
  });

  describe('matchesConditions', () => {
    const conditions: AttributeCondition[] = [
      { attribute: 'country', operator: 'eq', value: 'US' },
      { attribute: 'total', operator: 'gte', value: 100 },
    ];

    it('all mode requires every condition to pass', () => {
      expect(matchesConditions({ country: 'US', total: 100 }, conditions)).toBe(true);
      expect(matchesConditions({ country: 'US', total: 50 }, conditions)).toBe(false);
      expect(matchesConditions({ country: 'CA', total: 100 }, conditions)).toBe(false);
    });

    it('any mode requires at least one condition to pass', () => {
      expect(matchesConditions({ country: 'US', total: 50 }, conditions, 'any')).toBe(true);
      expect(matchesConditions({ country: 'CA', total: 100 }, conditions, 'any')).toBe(true);
      expect(matchesConditions({ country: 'CA', total: 50 }, conditions, 'any')).toBe(false);
    });

    it('empty conditions always match', () => {
      expect(matchesConditions({}, [])).toBe(true);
      expect(matchesConditions({}, [], 'any')).toBe(true);
    });
  });

  describe('countMatchingConditions', () => {
    it('counts how many conditions match', () => {
      const conditions: AttributeCondition[] = [
        { attribute: 'a', operator: 'eq', value: 1 },
        { attribute: 'b', operator: 'eq', value: 2 },
        { attribute: 'c', operator: 'eq', value: 3 },
      ];
      expect(countMatchingConditions({ a: 1, b: 2, c: 99 }, conditions)).toBe(2);
      expect(countMatchingConditions({ a: 1, b: 2, c: 3 }, conditions)).toBe(3);
      expect(countMatchingConditions({}, conditions)).toBe(0);
    });
  });

  describe('normalizeCondition / normalizeConditions', () => {
    it('normalizes legacy field → attribute', () => {
      const normalized = normalizeCondition({ field: 'order.total', operator: 'gt', value: 100 });
      expect(normalized.attribute).toBe('order.total');
      expect(normalized.operator).toBe('gt');
      expect(normalized.value).toBe(100);
    });

    it('keeps attribute when both field and attribute present (attribute wins)', () => {
      const normalized = normalizeCondition({ attribute: 'order.total', field: 'legacy', operator: 'eq', value: 1 });
      expect(normalized.attribute).toBe('order.total');
    });

    it('normalizes a list', () => {
      const list = normalizeConditions([
        { field: 'a', operator: 'eq', value: 1 },
        { attribute: 'b', operator: 'gt', value: 2 },
      ]);
      expect(list[0].attribute).toBe('a');
      expect(list[1].attribute).toBe('b');
    });
  });
});
