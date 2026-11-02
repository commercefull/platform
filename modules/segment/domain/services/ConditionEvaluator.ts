import type { SegmentCondition } from '../entities/SegmentDefinition';
import type { CustomerProfile } from '../entities/CustomerProfile';

type ConditionOperator = SegmentCondition['operator'];

// One predicate per operator — receives the resolved field value and the
// condition itself.
const OPERATORS: Record<ConditionOperator, (value: unknown, c: SegmentCondition) => boolean> = {
  eq: (value, c) => value === c.value,
  neq: (value, c) => value !== c.value,
  gt: (value, c) => typeof value === 'number' && typeof c.value === 'number' && value > c.value,
  gte: (value, c) => typeof value === 'number' && typeof c.value === 'number' && value >= c.value,
  lt: (value, c) => typeof value === 'number' && typeof c.value === 'number' && value < c.value,
  lte: (value, c) => typeof value === 'number' && typeof c.value === 'number' && value <= c.value,
  in: (value, c) => Array.isArray(c.values) && c.values.includes(value),
  notIn: (value, c) => Array.isArray(c.values) && !c.values.includes(value),
  contains: (value, c) => Array.isArray(value) && c.value !== undefined && value.includes(c.value),
  notContains: (value, c) => Array.isArray(value) && c.value !== undefined && !value.includes(c.value),
  between: (value, c) =>
    typeof value === 'number' &&
    Array.isArray(c.values) &&
    c.values.length === 2 &&
    typeof c.values[0] === 'number' &&
    typeof c.values[1] === 'number' &&
    value >= c.values[0] &&
    value <= c.values[1],
  isNull: value => value === null || value === undefined,
  isNotNull: value => value !== null && value !== undefined,
  startsWith: (value, c) => typeof value === 'string' && typeof c.value === 'string' && value.startsWith(c.value),
  endsWith: (value, c) => typeof value === 'string' && typeof c.value === 'string' && value.endsWith(c.value),
};

export function evaluateCondition(condition: SegmentCondition, profile: CustomerProfile): boolean {
  const evaluate = OPERATORS[condition.operator];
  return evaluate ? evaluate(getFieldValue(condition.field, profile), condition) : false;
}

export function evaluateConditions(conditions: SegmentCondition[], matchMode: 'all' | 'any', profile: CustomerProfile): boolean {
  if (conditions.length === 0) return true;
  if (matchMode === 'all') {
    return conditions.every(c => evaluateCondition(c, profile));
  }
  return conditions.some(c => evaluateCondition(c, profile));
}

function getFieldValue(field: string, profile: CustomerProfile): unknown {
  const accessorMap: Record<string, () => unknown> = {
    lifetimeValueCents: () => profile.lifetimeValueCents,
    totalOrders: () => profile.totalOrders,
    averageOrderValueCents: () => profile.averageOrderValueCents,
    daysSinceLastOrder: () => profile.daysSinceLastOrder,
    ordersLast30Days: () => profile.ordersLast30Days,
    ordersLast90Days: () => profile.ordersLast90Days,
    ordersLast12Months: () => profile.ordersLast12Months,
    productViews: () => (profile as unknown as Record<string, unknown>).productViews as number,
    cartCount: () => profile.tags?.length ?? 0,
    abandonedCarts: () => (profile as unknown as Record<string, unknown>).abandonedCarts as number,
    wishlistItemCount: () => (profile as unknown as Record<string, unknown>).wishlistItemCount as number,
    reviewCount: () => (profile as unknown as Record<string, unknown>).reviewCount as number,
    averageReviewRating: () => (profile as unknown as Record<string, unknown>).averageReviewRating as number | null,
    visitCount: () => (profile as unknown as Record<string, unknown>).visitCount as number,
    engagementScore: () => profile.engagementScore,
    churnRisk: () => profile.churnRisk,
    riskScore: () => (profile as unknown as Record<string, unknown>).riskScore as number | null,
    rfmSegment: () => profile.rfmSegment,
    tier: () => (profile as unknown as Record<string, unknown>).tier as string | null,
    status: () => (profile as unknown as Record<string, unknown>).status as string | null,
    email: () => profile.email,
    firstName: () => profile.firstName,
    lastName: () => profile.lastName,
    firstOrderDate: () => (profile as unknown as Record<string, unknown>).firstOrderDate as Date | null,
    lastOrderDate: () => (profile as unknown as Record<string, unknown>).lastOrderDate as Date | null,
    lastVisitDate: () => (profile as unknown as Record<string, unknown>).lastVisitDate as Date | null,
    preferredCategories: () => (profile as unknown as Record<string, unknown>).preferredCategories as string[] | null,
    preferredProducts: () => (profile as unknown as Record<string, unknown>).preferredProducts as string[] | null,
    preferredPaymentMethods: () => (profile as unknown as Record<string, unknown>).preferredPaymentMethods as string[] | null,
    tags: () => profile.tags,
    customAttributes: () => (profile as unknown as Record<string, unknown>).customAttributes as Record<string, unknown> | null,
  };

  const accessor = accessorMap[field];
  return accessor ? accessor() : undefined;
}
