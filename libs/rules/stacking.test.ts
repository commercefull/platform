import { resolveStackable, sortByPriority, StackableRule, Stackability } from './stacking';

interface TestRule extends StackableRule {
  id: string;
}

const make = (id: string, stackability: Stackability, priority: number): TestRule => ({ id, stackability, priority });

describe('libs/rules/stacking', () => {
  describe('resolveStackable', () => {
    it('returns empty for empty input', () => {
      expect(resolveStackable([])).toEqual([]);
    });

    it('keeps all stackable rules', () => {
      const rules = [make('a', 'stackable', 10), make('b', 'stackable', 5)];
      expect(resolveStackable(rules).map(r => r.id)).toEqual(['a', 'b']);
    });

    it('keeps an exclusive rule and truncates the rest', () => {
      const rules = [make('a', 'stackable', 10), make('b', 'exclusive', 8), make('c', 'stackable', 5)];
      expect(resolveStackable(rules).map(r => r.id)).toEqual(['a', 'b']);
    });

    it('exclusive as first rule keeps only it', () => {
      const rules = [make('a', 'exclusive', 10), make('b', 'stackable', 5)];
      expect(resolveStackable(rules).map(r => r.id)).toEqual(['a']);
    });

    it('drops none rules when stackable/exclusive present', () => {
      const rules = [make('a', 'none', 10), make('b', 'stackable', 5)];
      expect(resolveStackable(rules).map(r => r.id)).toEqual(['b']);
    });

    it('keeps a single none rule when it is the only one', () => {
      const rules = [make('a', 'none', 10)];
      expect(resolveStackable(rules).map(r => r.id)).toEqual(['a']);
    });

    it('keeps the first none rule when multiple none rules present and no stackable', () => {
      // `none` rules cannot stack with any other rule. The first one applies
      // (no prior rule), the second is dropped (a prior rule already applied).
      const rules = [make('a', 'none', 10), make('b', 'none', 5)];
      expect(resolveStackable(rules).map(r => r.id)).toEqual(['a']);
    });

    it('handles a mix: stackable + none + exclusive', () => {
      const rules = [make('a', 'stackable', 10), make('b', 'none', 8), make('c', 'exclusive', 6), make('d', 'stackable', 4)];
      // a kept (stackable), b dropped (none, others present), c kept + truncates d
      expect(resolveStackable(rules).map(r => r.id)).toEqual(['a', 'c']);
    });
  });

  describe('sortByPriority', () => {
    it('sorts by priority descending (stable)', () => {
      const rules = [make('a', 'stackable', 1), make('b', 'stackable', 10), make('c', 'stackable', 5)];
      const sorted = sortByPriority(rules);
      expect(sorted.map(r => r.id)).toEqual(['b', 'c', 'a']);
    });

    it('preserves insertion order on priority ties', () => {
      const rules = [make('a', 'stackable', 5), make('b', 'stackable', 5), make('c', 'stackable', 5)];
      const sorted = sortByPriority(rules);
      expect(sorted.map(r => r.id)).toEqual(['a', 'b', 'c']);
    });

    it('combined: sort then resolve', () => {
      const rules = [make('low-stack', 'stackable', 1), make('high-exclusive', 'exclusive', 10), make('mid-stack', 'stackable', 5)];
      const resolved = resolveStackable(sortByPriority(rules));
      // high-exclusive first → truncates the rest
      expect(resolved.map(r => r.id)).toEqual(['high-exclusive']);
    });
  });
});
