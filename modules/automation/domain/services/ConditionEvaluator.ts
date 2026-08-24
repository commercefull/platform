import type { RuleCondition, ConditionMatchMode } from '../entities/AutomationRule';

export function evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean {
  const value = resolveValue(condition, context);

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
    case 'startsWith':
      return typeof value === 'string' && typeof condition.value === 'string' && value.startsWith(condition.value);
    case 'endsWith':
      return typeof value === 'string' && typeof condition.value === 'string' && value.endsWith(condition.value);
    case 'isNull':
      return value === null || value === undefined;
    case 'isNotNull':
      return value !== null && value !== undefined;
    case 'regex':
      if (typeof value !== 'string' || typeof condition.value !== 'string') return false;
      try { return new RegExp(condition.value).test(value); } catch { return false; }
    default:
      return false;
  }
}

export function evaluateConditions(
  conditions: RuleCondition[],
  matchMode: ConditionMatchMode,
  context: Record<string, unknown>,
): boolean {
  if (conditions.length === 0) return true;
  if (matchMode === 'all') {
    return conditions.every(c => evaluateCondition(c, context));
  }
  return conditions.some(c => evaluateCondition(c, context));
}

function resolveValue(condition: RuleCondition, context: Record<string, unknown>): unknown {
  if (condition.dataPath) {
    return resolveDataPath(condition.dataPath, context);
  }

  switch (condition.field) {
    case 'event.type':
      return (context.event as { type?: string } | undefined)?.type;
    case 'event.data.*':
      return context.event;
    case 'customer.tier':
      return (context.customer as { tier?: string } | undefined)?.tier;
    case 'customer.lifetimeValue':
      return (context.customer as { lifetimeValue?: number } | undefined)?.lifetimeValue;
    case 'customer.totalOrders':
      return (context.customer as { totalOrders?: number } | undefined)?.totalOrders;
    case 'customer.daysSinceLastOrder':
      return (context.customer as { daysSinceLastOrder?: number } | undefined)?.daysSinceLastOrder;
    case 'customer.rfmSegment':
      return (context.customer as { rfmSegment?: string } | undefined)?.rfmSegment;
    case 'customer.tags':
      return (context.customer as { tags?: string[] } | undefined)?.tags;
    case 'order.totalAmount':
      return (context.order as { totalAmount?: number } | undefined)?.totalAmount;
    case 'order.itemCount':
      return (context.order as { itemCount?: number } | undefined)?.itemCount;
    case 'order.status':
      return (context.order as { status?: string } | undefined)?.status;
    case 'product.price':
      return (context.product as { price?: number } | undefined)?.price;
    case 'product.categoryId':
      return (context.product as { categoryId?: string } | undefined)?.categoryId;
    case 'product.status':
      return (context.product as { status?: string } | undefined)?.status;
    case 'custom':
      return condition.value;
    default:
      return undefined;
  }
}

function resolveDataPath(path: string, context: Record<string, unknown>): unknown {
  const parts = path.split('.');
  let current: unknown = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
