import type { SegmentCondition} from '../entities/SegmentDefinition';
import type { CustomerProfile } from '../entities/CustomerProfile';

export function evaluateCondition(condition: SegmentCondition, profile: CustomerProfile): boolean {
  const value = getFieldValue(condition.field, profile);

  switch (condition.operator) {
    case 'eq':
      return value === condition.value;
    case 'neq':
      return value !== condition.value;
    case 'gt':
      return typeof value === 'number' && typeof condition.value === 'number' && value > condition.value;
    case 'gte':
      return typeof value === 'number' && typeof condition.value === 'number' && value >= condition.value;
    case 'lt':
      return typeof value === 'number' && typeof condition.value === 'number' && value < condition.value;
    case 'lte':
      return typeof value === 'number' && typeof condition.value === 'number' && value <= condition.value;
    case 'in':
      return Array.isArray(condition.values) && condition.values.includes(value);
    case 'notIn':
      return Array.isArray(condition.values) && !condition.values.includes(value);
    case 'contains':
      return Array.isArray(value) && condition.value !== undefined && value.includes(condition.value);
    case 'notContains':
      return Array.isArray(value) && condition.value !== undefined && !value.includes(condition.value);
    case 'between':
      return (
        typeof value === 'number' &&
        Array.isArray(condition.values) &&
        condition.values.length === 2 &&
        typeof condition.values[0] === 'number' &&
        typeof condition.values[1] === 'number' &&
        value >= condition.values[0] &&
        value <= condition.values[1]
      );
    case 'isNull':
      return value === null || value === undefined;
    case 'isNotNull':
      return value !== null && value !== undefined;
    case 'startsWith':
      return typeof value === 'string' && typeof condition.value === 'string' && value.startsWith(condition.value);
    case 'endsWith':
      return typeof value === 'string' && typeof condition.value === 'string' && value.endsWith(condition.value);
    default:
      return false;
  }
}

export function evaluateConditions(
  conditions: SegmentCondition[],
  matchMode: 'all' | 'any',
  profile: CustomerProfile,
): boolean {
  if (conditions.length === 0) return true;
  if (matchMode === 'all') {
    return conditions.every(c => evaluateCondition(c, profile));
  }
  return conditions.some(c => evaluateCondition(c, profile));
}

function getFieldValue(field: string, profile: CustomerProfile): unknown {
  const accessorMap: Record<string, () => unknown> = {
    lifetimeValue: () => profile.lifetimeValue,
    totalOrders: () => profile.totalOrders,
    averageOrderValue: () => profile.averageOrderValue,
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
