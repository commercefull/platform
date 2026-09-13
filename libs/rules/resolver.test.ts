import { resolveMostSpecific, resolveBestMatch, filterDateActive, filterMatching } from './resolver';
import { AttributeCondition, ConditionContext } from './conditions';

interface TestRule {
  id: string;
  conditions: AttributeCondition[];
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
  priority?: number;
}

describe('libs/rules/resolver', () => {
  const rules: TestRule[] = [
    { id: 'generic', conditions: [{ attribute: 'country', operator: 'eq', value: 'US' }] }, // specificity 1
    {
      id: 'state',
      conditions: [
        { attribute: 'country', operator: 'eq', value: 'US' },
        { attribute: 'state', operator: 'eq', value: 'CA' },
      ],
    }, // specificity 2
    {
      id: 'city',
      conditions: [
        { attribute: 'country', operator: 'eq', value: 'US' },
        { attribute: 'state', operator: 'eq', value: 'CA' },
        { attribute: 'city', operator: 'eq', value: 'SF' },
      ],
    }, // specificity 3
    { id: 'noConditions', conditions: [] }, // specificity 0, always matches
  ];

  describe('resolveMostSpecific', () => {
    it('returns rules ranked by specificity descending', () => {
      const ctx: ConditionContext = { country: 'US', state: 'CA', city: 'SF' };
      const resolved = resolveMostSpecific(rules, ctx);
      expect(resolved.map(r => r.id)).toEqual(['city', 'state', 'generic', 'noConditions']);
    });

    it('excludes non-matching rules', () => {
      const ctx: ConditionContext = { country: 'CA' };
      const resolved = resolveMostSpecific(rules, ctx);
      expect(resolved.map(r => r.id)).toEqual(['noConditions']);
    });

    it('returns empty array when nothing matches and no unconditional rule', () => {
      const strictRules = rules.filter(r => r.conditions.length > 0);
      const ctx: ConditionContext = { country: 'CA' };
      const resolved = resolveMostSpecific(strictRules, ctx);
      expect(resolved).toEqual([]);
    });

    it('preserves insertion order on specificity ties (stable sort)', () => {
      const tieRules: TestRule[] = [
        { id: 'a', conditions: [{ attribute: 'x', operator: 'eq', value: 1 }] },
        { id: 'b', conditions: [{ attribute: 'y', operator: 'eq', value: 2 }] },
      ];
      const ctx: ConditionContext = { x: 1, y: 2 };
      const resolved = resolveMostSpecific(tieRules, ctx);
      expect(resolved.map(r => r.id)).toEqual(['a', 'b']);
    });

    it('handles empty candidates', () => {
      expect(resolveMostSpecific([], {})).toEqual([]);
    });
  });

  describe('resolveBestMatch', () => {
    it('returns the single best match', () => {
      const ctx: ConditionContext = { country: 'US', state: 'CA', city: 'SF' };
      const best = resolveBestMatch(rules, ctx);
      expect(best?.id).toBe('city');
    });

    it('returns null when nothing matches', () => {
      const strictRules = rules.filter(r => r.conditions.length > 0);
      const ctx: ConditionContext = { country: 'CA' };
      expect(resolveBestMatch(strictRules, ctx)).toBeNull();
    });
  });

  describe('filterDateActive', () => {
    it('includes rules with no date bounds', () => {
      const r: TestRule[] = [{ id: 'a', conditions: [] }];
      expect(filterDateActive(r)).toHaveLength(1);
    });

    it('excludes rules not yet effective', () => {
      const future = new Date(Date.now() + 86400000);
      const r: TestRule[] = [{ id: 'a', conditions: [], effectiveFrom: future }];
      expect(filterDateActive(r)).toHaveLength(0);
    });

    it('excludes expired rules', () => {
      const past = new Date(Date.now() - 86400000);
      const r: TestRule[] = [{ id: 'a', conditions: [], effectiveTo: past }];
      expect(filterDateActive(r)).toHaveLength(0);
    });

    it('includes rules within date bounds', () => {
      const past = new Date(Date.now() - 86400000);
      const future = new Date(Date.now() + 86400000);
      const r: TestRule[] = [{ id: 'a', conditions: [], effectiveFrom: past, effectiveTo: future }];
      expect(filterDateActive(r)).toHaveLength(1);
    });

    it('accepts ISO date strings', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const future = new Date(Date.now() + 86400000).toISOString();
      const r: TestRule[] = [{ id: 'a', conditions: [], effectiveFrom: past, effectiveTo: future }];
      expect(filterDateActive(r)).toHaveLength(1);
    });
  });

  describe('filterMatching', () => {
    it('includes matching rules', () => {
      const ctx: ConditionContext = { country: 'US' };
      expect(filterMatching(rules, ctx).map(r => r.id)).toContain('generic');
    });

    it('includes rules with no conditions', () => {
      const ctx: ConditionContext = {};
      expect(filterMatching(rules, ctx).map(r => r.id)).toContain('noConditions');
    });
  });
});
