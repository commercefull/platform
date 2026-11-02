/**
 * Pricing Rule Evaluator — domain service
 *
 * Pure pricing logic extracted from the former application-layer
 * PricingService: rule-condition matching, adjustment application, and
 * currency-rule conversion. No I/O — repositories and ports are queried
 * by the application layer and their results passed in.
 *
 * All amounts are integer cents. Rule operands (adjustment values) are
 * stored in major units and converted to cents at application time.
 */

import { CurrencyPriceRule, PriceContext, PricingAdjustment, PricingAdjustmentType, PricingRule, PricingRuleScope } from '../pricingRule';
import { Currency } from '../currency';
import { getCurrencyDecimals, toMinorUnits } from '../../../../libs/money';

/**
 * Normalized evaluation context shared by the constraint and
 * custom-condition checks.
 */
interface RuleEvaluationContext {
  date: Date;
  quantity: number;
  cartTotal: number;
  customerId?: string;
  customerGroupIds: string[];
  productIds: string[];
  additionalData: Record<string, unknown>;
  context: PriceContext;
}

// One predicate per custom condition type — returns true when the
// condition passes. Types absent from the table are skipped (unknown
// conditions never fail a rule).
const CONDITION_CHECKS: Record<string, (params: Record<string, unknown>, ctx: RuleEvaluationContext) => boolean> = {
  date_range: (p, c) =>
    !(p.startDate && new Date(p.startDate as string) > c.date) && !(p.endDate && new Date(p.endDate as string) < c.date),
  day_of_week: (p, c) => (p.days as number[]).includes(c.date.getDay()),
  time_of_day: (p, c) => c.date.getHours() >= (p.startHour as number) && c.date.getHours() < (p.endHour as number),
  store: (p, c) => !!c.context.storeId && !!(p.storeIds as string[] | undefined)?.includes(c.context.storeId),
  channel: (p, c) => !!c.context.channelId && !!(p.channelIds as string[] | undefined)?.includes(c.context.channelId),
  cart_total: (p, c) => compareScalar(c.cartTotal, p),
  item_quantity: (p, c) => compareScalar(c.quantity, p),
  category: (p, c) => {
    const wanted = toIdList(p.value ?? p.categoryIds);
    return wanted.length === 0 || wanted.some(id => (c.context.categoryIds ?? []).includes(id));
  },
  customer_group: (p, c) => {
    const wanted = toIdList(p.value ?? p.customerGroupIds);
    return wanted.length === 0 || wanted.some(id => c.customerGroupIds.includes(id));
  },
  // Requires additional customer data lookup — for now, just checks the
  // attribute in additionalData.
  customer_attribute: (p, c) => {
    const attrs = c.additionalData.customerAttributes as Record<string, unknown> | undefined;
    if (!attrs) return false;
    const attribute = p.attribute as string;
    return !!attrs[attribute] && attrs[attribute] === p.value;
  },
};

/**
 * Evaluate whether a pricing rule's conditions are met given the context.
 */
export function isRuleApplicable(rule: PricingRule, context: PriceContext): boolean {
  const { customerId, customerGroupIds = [], quantity = 1, cartTotal = 0, productIds = [], additionalData = {} } = context;

  // Extract date from context or use current date as default
  const evalCtx: RuleEvaluationContext = {
    date: context.date || new Date(),
    quantity,
    cartTotal,
    customerId,
    customerGroupIds,
    productIds,
    additionalData,
    context,
  };

  if (!passesRuleConstraints(rule, evalCtx)) {
    return false;
  }

  // Evaluate custom conditions in the rule
  for (const condition of rule.conditions) {
    const check = CONDITION_CHECKS[condition.type];
    if (check && !check(condition.parameters, evalCtx)) {
      return false;
    }
  }

  // All conditions passed
  return true;
}

// Static rule fields: schedule window, quantity bounds, order minimum,
// and scope targeting.
function passesRuleConstraints(rule: PricingRule, ctx: RuleEvaluationContext): boolean {
  if (rule.startDate && new Date(rule.startDate) > ctx.date) {
    return false;
  }

  if (rule.endDate && new Date(rule.endDate) < ctx.date) {
    return false;
  }

  if (rule.minimumQuantity && ctx.quantity < rule.minimumQuantity) {
    return false;
  }

  if (rule.maximumQuantity && ctx.quantity > rule.maximumQuantity) {
    return false;
  }

  if (rule.minimumOrderAmountCents && ctx.cartTotal < rule.minimumOrderAmountCents) {
    return false;
  }

  return passesScopeConstraints(rule, ctx);
}

// Scope targeting: product / customer / customer-group membership.
function passesScopeConstraints(rule: PricingRule, ctx: RuleEvaluationContext): boolean {
  if (rule.scope === PricingRuleScope.PRODUCT && rule.productIds) {
    return ctx.productIds.some(pid => rule.productIds?.includes(pid));
  }

  if (rule.scope === PricingRuleScope.CUSTOMER && rule.customerIds) {
    return !!ctx.customerId && rule.customerIds.includes(ctx.customerId);
  }

  if (rule.scope === PricingRuleScope.CUSTOMER_GROUP && rule.customerGroupIds) {
    return ctx.customerGroupIds.some(gid => rule.customerGroupIds?.includes(gid));
  }

  return true;
}

function compareScalar(actual: number, params: Record<string, unknown>): boolean {
  const value = Number(params.value);
  switch (params.operator) {
    case 'neq':
      return actual !== value;
    case 'gt':
      return actual > value;
    case 'gte':
      return actual >= value;
    case 'lt':
      return actual < value;
    case 'lte':
      return actual <= value;
    case 'in':
      return toIdList(params.value).map(Number).includes(actual);
    default:
      return actual === value;
  }
}

function toIdList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string')
    return value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  if (value != null) return [String(value)];
  return [];
}

/**
 * Apply a rule's adjustments to a price, in order.
 * FIXED and OVERRIDE set an absolute price (operand in major units of
 * `currencyCode`, converted to minor units via ISO 4217 exponent);
 * PERCENTAGE reduces the current price. Returns the adjusted price and
 * whether any adjustment was applied.
 */
export function applyAdjustments(
  priceCents: number,
  adjustments: PricingAdjustment[],
  currencyCode: string = 'USD',
): { priceCents: number; applied: boolean } {
  let current = priceCents;
  let applied = false;

  for (const adjustment of adjustments) {
    if (adjustment.type === PricingAdjustmentType.FIXED) {
      current = toMinorUnits(adjustment.value, currencyCode);
      applied = true;
    } else if (adjustment.type === PricingAdjustmentType.PERCENTAGE) {
      current = Math.round(current * (1 - adjustment.value / 100));
      applied = true;
    } else if (adjustment.type === PricingAdjustmentType.OVERRIDE) {
      current = toMinorUnits(adjustment.value, currencyCode);
      applied = true;
    }
  }

  return { priceCents: current, applied };
}

/**
 * Select the highest-priority currency price rule applicable to a price.
 * Threshold operands and the price are both integer cents.
 */
export function selectCurrencyPriceRule(rules: CurrencyPriceRule[], priceCents: number): CurrencyPriceRule | null {
  const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const rule of sortedRules) {
    if (
      (rule.minOrderValueCents === undefined || priceCents >= rule.minOrderValueCents) &&
      (rule.maxOrderValueCents === undefined || priceCents <= rule.maxOrderValueCents)
    ) {
      if (rule.adjustments[0]) {
        return rule;
      }
    }
  }

  return null;
}

export interface CurrencyConversion {
  convertedPriceCents: number;
  exchangeRate: number;
  /** The currency rule adjustment applied, if any */
  appliedAdjustment?: PricingAdjustment;
  appliedRuleId?: string;
  appliedRuleName?: string;
}

/**
 * Convert a price between two currencies. When a currency price rule is
 * given, its adjustment is applied on top of (or instead of, for EXCHANGE)
 * the base exchange rate.
 */
export function convertAmount(
  priceCents: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rule?: CurrencyPriceRule | null,
): CurrencyConversion {
  let exchangeRate = (toCurrency.exchangeRate ?? 1) / (fromCurrency.exchangeRate ?? 1);
  // Exchange rates are defined in major units (1 FROM → rate TO). The stored
  // price is in FROM minor units, so scale by the minor-unit exponent delta
  // between the two currencies: 10^(dec(to) - dec(from)). Without this a
  // USD→JPY conversion (2→0 decimals) overcharges 100× and USD→KWD (2→3)
  // undercharges 10×.
  const exponentScale = 10 ** (getCurrencyDecimals(toCurrency.code) - getCurrencyDecimals(fromCurrency.code));
  let convertedPrice = priceCents * exchangeRate * exponentScale;

  const adjustment = rule?.adjustments[0];
  if (adjustment) {
    if (adjustment.type === PricingAdjustmentType.FIXED) {
      convertedPrice += toMinorUnits(adjustment.value, toCurrency.code);
    } else if (adjustment.type === PricingAdjustmentType.PERCENTAGE) {
      convertedPrice *= 1 + adjustment.value / 100;
    } else if (adjustment.type === PricingAdjustmentType.EXCHANGE) {
      // Override the exchange rate
      exchangeRate = adjustment.value;
      convertedPrice = priceCents * exchangeRate * exponentScale;
    }
  }

  return {
    convertedPriceCents: Math.round(convertedPrice),
    exchangeRate,
    appliedAdjustment: adjustment,
    appliedRuleId: rule?.id,
    appliedRuleName: rule ? rule.name || `Currency conversion to ${toCurrency.code}` : undefined,
  };
}
