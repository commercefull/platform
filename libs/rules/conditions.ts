/**
 * AttributeCondition — Shared Kernel Rule Primitive
 *
 * Declarative eligibility condition matching used by promotion, tax, shipping,
 * pricing, loyalty, fraud, and returns rule engines. Replaces the ad-hoc
 * `if` checks scattered across domain entities with a single, testable matcher.
 *
 * Admission criteria (mirrors `libs/money.ts`):
 * - No dependencies, no I/O, no module-specific business rules.
 * - Stable API, agreed by all consuming contexts.
 *
 * Backward compatibility: the legacy automation shape `{ field, operator, value }`
 * is accepted transparently — `field` is treated as an alias for `attribute`.
 */

/** Operators supported by `AttributeCondition`. */
export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'isNull'
  | 'isNotNull'
  | 'regex';

/**
 * A single declarative condition: "the context value at `attribute` must relate
 * to `value` according to `operator`".
 *
 * `value` is `unknown` because different operators expect different shapes
 * (scalar for `eq`/`gt`, array for `in`, string for `regex`).
 */
export interface AttributeCondition {
  /** Context key to resolve. Alias `field` is accepted for backward compat. */
  attribute: string;
  operator: ConditionOperator;
  value?: unknown;
}

/** Match mode for a list of conditions. */
export type ConditionMatchMode = 'all' | 'any';

/** Context is a flat map of attribute name → value. */
export type ConditionContext = Record<string, unknown>;

/**
 * Normalise a legacy or partial condition object into a canonical
 * `AttributeCondition`. Accepts `{ field, ... }` as an alias for `attribute`.
 */
export function normalizeCondition(raw: {
  attribute?: string;
  field?: string;
  operator: ConditionOperator;
  value?: unknown;
}): AttributeCondition {
  return {
    attribute: raw.attribute ?? raw.field ?? '',
    operator: raw.operator,
    value: raw.value,
  };
}

/** Convert a list of legacy `{ field }` conditions to canonical `{ attribute }`. */
export function normalizeConditions(
  raw: Array<{ attribute?: string; field?: string; operator: ConditionOperator; value?: unknown }>,
): AttributeCondition[] {
  return raw.map(normalizeCondition);
}

/**
 * Evaluate a single condition against a resolved context value.
 * Returns `false` if the operator is unknown or types are incompatible.
 */
export function matchCondition(condition: AttributeCondition, context: ConditionContext): boolean {
  const actual = context[condition.attribute];

  switch (condition.operator) {
    case 'eq':
      return actual === condition.value;

    case 'neq':
      return actual !== condition.value;

    case 'gt':
      return toNumber(actual) > toNumber(condition.value);

    case 'gte':
      return toNumber(actual) >= toNumber(condition.value);

    case 'lt':
      return toNumber(actual) < toNumber(condition.value);

    case 'lte':
      return toNumber(actual) <= toNumber(condition.value);

    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(actual);

    case 'notIn':
      return Array.isArray(condition.value) && !condition.value.includes(actual);

    case 'contains':
      return contains(actual, condition.value);

    case 'notContains':
      return !contains(actual, condition.value);

    case 'startsWith':
      return typeof actual === 'string' && typeof condition.value === 'string' && actual.startsWith(condition.value);

    case 'endsWith':
      return typeof actual === 'string' && typeof condition.value === 'string' && actual.endsWith(condition.value);

    case 'isNull':
      return actual === null || actual === undefined;

    case 'isNotNull':
      return actual !== null && actual !== undefined;

    case 'regex': {
      if (typeof actual !== 'string' || typeof condition.value !== 'string') return false;
      try {
        return new RegExp(condition.value).test(actual);
      } catch {
        return false;
      }
    }

    default:
      return false;
  }
}

/**
 * Evaluate a list of conditions against a context.
 * `matchMode: 'all'` (default) requires every condition to pass (AND).
 * `matchMode: 'any'` requires at least one condition to pass (OR).
 * An empty conditions list always matches.
 */
export function matchesConditions(
  context: ConditionContext,
  conditions: AttributeCondition[],
  matchMode: ConditionMatchMode = 'all',
): boolean {
  if (conditions.length === 0) return true;

  if (matchMode === 'any') {
    return conditions.some(c => matchCondition(c, context));
  }
  return conditions.every(c => matchCondition(c, context));
}

/** Count how many conditions in a list match the context (specificity score). */
export function countMatchingConditions(context: ConditionContext, conditions: AttributeCondition[]): number {
  return conditions.reduce((count, c) => (matchCondition(c, context) ? count + 1 : count), 0);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (typeof value === 'bigint') return Number(value);
  return NaN;
}

function contains(haystack: unknown, needle: unknown): boolean {
  if (haystack == null || needle == null) return false;
  if (Array.isArray(haystack)) return haystack.some(item => item === needle);
  if (typeof haystack === 'string') return typeof needle === 'string' && haystack.includes(needle);
  return false;
}
