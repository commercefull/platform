/**
 * Stacking Resolver
 *
 * Resolves which matched rules may co-apply when multiple rules match a
 * transaction. Ports the proven `exclusiveApplied` loop from
 * `PromotionEvaluationService` into a reusable, tested function.
 *
 * Semantics:
 * - `none`    — this rule cannot be applied at all if any other rule applies
 *               (effectively "opt out of stacking").
 * - `stackable` — this rule applies alongside other stackable rules.
 * - `exclusive` — once this rule applies, no further rules are considered.
 *
 * Resolution order: candidates are processed in the order given (callers should
 * pre-sort by priority). The first `exclusive` rule that applies stops further
 * evaluation, mirroring the existing promotion service behaviour.
 *
 * Admission criteria (mirrors `libs/money.ts`):
 * - No dependencies on `modules/*`, no I/O.
 */

/** How a rule interacts with other simultaneously-matched rules. */
export type Stackability = 'none' | 'stackable' | 'exclusive';

/** Minimum shape a candidate must have to participate in stacking. */
export interface StackableRule {
  stackability: Stackability;
  priority: number;
}

/**
 * Given a list of already-matched rules (pre-sorted by priority descending),
 * return the subset that should actually apply according to stacking rules.
 *
 * - `none` rules are dropped if any other rule is present.
 * - `stackable` rules are kept.
 * - The first `exclusive` rule is kept and truncates the rest.
 *
 * If no `stackable` or `exclusive` rules are present, `none` rules are still
 * dropped (they only apply in isolation — but since they were already matched,
 * callers wanting "single rule" semantics should use `resolveBestMatch` instead).
 */
export function resolveStackable<T extends StackableRule>(matched: T[]): T[] {
  if (matched.length === 0) return [];

  const hasStackableOrExclusive = matched.some(r => r.stackability === 'stackable' || r.stackability === 'exclusive');

  const result: T[] = [];
  for (const rule of matched) {
    if (rule.stackability === 'none') {
      // `none` rules only apply when no other rules are present.
      if (!hasStackableOrExclusive && result.length === 0) {
        result.push(rule);
      }
      continue;
    }

    if (rule.stackability === 'exclusive') {
      result.push(rule);
      break; // exclusive stops further stacking
    }

    // stackable
    result.push(rule);
  }

  return result;
}

/**
 * Convenience: sort candidates by priority descending (stable) before stacking.
 * Higher priority is evaluated first.
 */
export function sortByPriority<T extends StackableRule>(candidates: T[]): T[] {
  const decorated = candidates.map((rule, index) => ({ rule, index }));
  decorated.sort((a, b) => {
    if (b.rule.priority !== a.rule.priority) return b.rule.priority - a.rule.priority;
    return a.index - b.index; // stable on ties
  });
  return decorated.map(d => d.rule);
}
