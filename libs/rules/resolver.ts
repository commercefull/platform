/**
 * Rule Resolver — "Most Specific Wins"
 *
 * When multiple rule definitions could apply to the same transaction line,
 * the one with the most matching conditions wins (highest specificity).
 * This mirrors the `rates.ts` resolver from the standalone rule-engine packages.
 *
 * Admission criteria (mirrors `libs/money.ts`):
 * - No dependencies on `modules/*`, no I/O.
 * - Depends only on `libs/rules/conditions.ts`.
 */

import { AttributeCondition, ConditionContext, countMatchingConditions, matchesConditions } from './conditions';

/** Minimum shape a candidate rule must have to be resolvable. */
export interface ResolvableRule {
  conditions?: AttributeCondition[];
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
}

/**
 * Filter candidates to those that are currently date-active.
 * A rule with no `effectiveFrom`/`effectiveTo` is always active.
 */
export function filterDateActive<T extends ResolvableRule>(candidates: T[], now: Date = new Date()): T[] {
  return candidates.filter(c => {
    if (c.effectiveFrom) {
      const from = c.effectiveFrom instanceof Date ? c.effectiveFrom : new Date(c.effectiveFrom);
      if (now < from) return false;
    }
    if (c.effectiveTo) {
      const to = c.effectiveTo instanceof Date ? c.effectiveTo : new Date(c.effectiveTo);
      if (now > to) return false;
    }
    return true;
  });
}

/**
 * Filter candidates to those whose conditions all match the given context.
 * Rules with no conditions always match.
 */
export function filterMatching<T extends ResolvableRule>(candidates: T[], context: ConditionContext): T[] {
  return candidates.filter(c => (c.conditions ? matchesConditions(context, c.conditions) : true));
}

/**
 * Resolve the most-specific matching, date-active candidates.
 *
 * Returns candidates sorted by specificity (number of matching conditions)
 * descending. When multiple candidates have the same specificity, the original
 * insertion order is preserved (stable sort).
 *
 * Callers typically take `result[0]` for a single-winner resolution, or
 * iterate the full list for stacking scenarios.
 */
export function resolveMostSpecific<T extends ResolvableRule>(candidates: T[], context: ConditionContext, now: Date = new Date()): T[] {
  const active = filterDateActive(candidates, now);
  const matching = filterMatching(active, context);

  // Decorate with specificity score, stable-sort descending, then undecorate.
  const decorated = matching.map((rule, index) => ({
    rule,
    index,
    specificity: rule.conditions ? countMatchingConditions(context, rule.conditions) : 0,
  }));

  decorated.sort((a, b) => {
    if (b.specificity !== a.specificity) return b.specificity - a.specificity;
    return a.index - b.index; // stable: preserve original order on ties
  });

  return decorated.map(d => d.rule);
}

/**
 * Resolve and return only the single best match, or `null` if none match.
 */
export function resolveBestMatch<T extends ResolvableRule>(candidates: T[], context: ConditionContext, now: Date = new Date()): T | null {
  const resolved = resolveMostSpecific(candidates, context, now);
  return resolved.length > 0 ? resolved[0] : null;
}
