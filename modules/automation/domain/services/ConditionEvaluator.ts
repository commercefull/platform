import type { RuleCondition, ConditionMatchMode } from '../entities/AutomationRule';

type ConditionOperator = RuleCondition['operator'];

// One predicate per operator — receives the resolved field value and the
// condition itself.
const OPERATORS: Record<ConditionOperator, (value: unknown, c: RuleCondition) => boolean> = {
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
  startsWith: (value, c) => typeof value === 'string' && typeof c.value === 'string' && value.startsWith(c.value),
  endsWith: (value, c) => typeof value === 'string' && typeof c.value === 'string' && value.endsWith(c.value),
  isNull: value => value === null || value === undefined,
  isNotNull: value => value !== null && value !== undefined,
  regex: (value, c) => {
    if (typeof value !== 'string' || typeof c.value !== 'string') return false;
    try {
      return new RegExp(c.value).test(value);
    } catch {
      return false;
    }
  },
};

export function evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean {
  const evaluate = OPERATORS[condition.operator];
  return evaluate ? evaluate(resolveValue(condition, context), condition) : false;
}

export function evaluateConditions(conditions: RuleCondition[], matchMode: ConditionMatchMode, context: Record<string, unknown>): boolean {
  if (conditions.length === 0) return true;
  if (matchMode === 'all') {
    return conditions.every(c => evaluateCondition(c, context));
  }
  return conditions.some(c => evaluateCondition(c, context));
}

// Known field paths — each accessor reads one value out of the event context.
const FIELD_RESOLVERS: Record<string, (context: Record<string, unknown>, c: RuleCondition) => unknown> = {
  'event.type': ctx => (ctx.event as { type?: string } | undefined)?.type,
  'event.data.*': ctx => ctx.event,
  'customer.tier': ctx => (ctx.customer as { tier?: string } | undefined)?.tier,
  'customer.lifetimeValue': ctx => (ctx.customer as { lifetimeValue?: number } | undefined)?.lifetimeValue,
  'customer.totalOrders': ctx => (ctx.customer as { totalOrders?: number } | undefined)?.totalOrders,
  'customer.daysSinceLastOrder': ctx => (ctx.customer as { daysSinceLastOrder?: number } | undefined)?.daysSinceLastOrder,
  'customer.rfmSegment': ctx => (ctx.customer as { rfmSegment?: string } | undefined)?.rfmSegment,
  'customer.tags': ctx => (ctx.customer as { tags?: string[] } | undefined)?.tags,
  'order.totalAmount': ctx => (ctx.order as { totalAmount?: number } | undefined)?.totalAmount,
  'order.itemCount': ctx => (ctx.order as { itemCount?: number } | undefined)?.itemCount,
  'order.status': ctx => (ctx.order as { status?: string } | undefined)?.status,
  'product.price': ctx => (ctx.product as { price?: number } | undefined)?.price,
  'product.categoryId': ctx => (ctx.product as { categoryId?: string } | undefined)?.categoryId,
  'product.status': ctx => (ctx.product as { status?: string } | undefined)?.status,
  custom: (_ctx, c) => c.value,
};

function resolveValue(condition: RuleCondition, context: Record<string, unknown>): unknown {
  if (condition.dataPath) {
    return resolveDataPath(condition.dataPath, context);
  }

  const resolve = FIELD_RESOLVERS[condition.field];
  return resolve ? resolve(context, condition) : undefined;
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
