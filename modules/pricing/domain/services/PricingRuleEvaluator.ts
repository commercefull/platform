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

/**
 * Evaluate whether a pricing rule's conditions are met given the context.
 */
export function isRuleApplicable(rule: PricingRule, context: PriceContext): boolean {
  const { customerId, customerGroupIds = [], quantity = 1, cartTotal = 0, productIds = [], additionalData = {} } = context;

  // Extract date from context or use current date as default
  const date = context.date || new Date();

  // Check date range
  if (rule.startDate && new Date(rule.startDate) > date) {
    return false;
  }

  if (rule.endDate && new Date(rule.endDate) < date) {
    return false;
  }

  // Check quantity constraints
  if (rule.minimumQuantity && quantity < rule.minimumQuantity) {
    return false;
  }

  if (rule.maximumQuantity && quantity > rule.maximumQuantity) {
    return false;
  }

  // Check minimum order amount
  if (rule.minimumOrderAmountCents && cartTotal < rule.minimumOrderAmountCents) {
    return false;
  }

  // Check product constraints
  if (rule.scope === PricingRuleScope.PRODUCT && rule.productIds) {
    const matchesProduct = productIds.some(pid => rule.productIds?.includes(pid));
    if (!matchesProduct) {
      return false;
    }
  }

  // Check customer constraints
  if (rule.scope === PricingRuleScope.CUSTOMER && rule.customerIds) {
    if (!customerId || !rule.customerIds.includes(customerId)) {
      return false;
    }
  }

  // Check customer group constraints
  if (rule.scope === PricingRuleScope.CUSTOMER_GROUP && rule.customerGroupIds) {
    const matchesGroup = customerGroupIds.some(gid => rule.customerGroupIds?.includes(gid));
    if (!matchesGroup) {
      return false;
    }
  }

  // Evaluate custom conditions in the rule
  for (const condition of rule.conditions) {
    const params = condition.parameters;
    switch (condition.type) {
      case 'date_range':
        if (
          (params.startDate && new Date(params.startDate as string) > date) ||
          (params.endDate && new Date(params.endDate as string) < date)
        ) {
          return false;
        }
        break;

      case 'day_of_week': {
        const dayOfWeek = date.getDay();
        if (!(params.days as number[]).includes(dayOfWeek)) {
          return false;
        }
        break;
      }

      case 'time_of_day': {
        const hours = date.getHours();
        if (hours < (params.startHour as number) || hours >= (params.endHour as number)) {
          return false;
        }
        break;
      }

      case 'store':
        if (!context.storeId || !(params.storeIds as string[] | undefined)?.includes(context.storeId)) {
          return false;
        }
        break;

      case 'channel':
        if (!context.channelId || !(params.channelIds as string[] | undefined)?.includes(context.channelId)) {
          return false;
        }
        break;

      case 'cart_total':
        if (!compareScalar(cartTotal, params)) {
          return false;
        }
        break;

      case 'item_quantity':
        if (!compareScalar(quantity, params)) {
          return false;
        }
        break;

      case 'category': {
        const wanted = toIdList(params.value ?? params.categoryIds);
        if (wanted.length > 0 && !wanted.some(id => (context.categoryIds ?? []).includes(id))) {
          return false;
        }
        break;
      }

      case 'customer_group': {
        const wanted = toIdList(params.value ?? params.customerGroupIds);
        if (wanted.length > 0 && !wanted.some(id => customerGroupIds.includes(id))) {
          return false;
        }
        break;
      }

      case 'customer_attribute':
        // This would require additional customer data lookup
        // For now, just check if the attribute exists in additionalData
        if (
          !additionalData.customerAttributes ||
          !(additionalData.customerAttributes as Record<string, unknown>)[params.attribute as string] ||
          (additionalData.customerAttributes as Record<string, unknown>)[params.attribute as string] !== params.value
        ) {
          return false;
        }
        break;

      // Additional condition types can be added here

      default:
        // Unknown condition type, skip it
        break;
    }
  }

  // All conditions passed
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
 * FIXED and OVERRIDE set an absolute price (operand in major units);
 * PERCENTAGE reduces the current price. Returns the adjusted price and
 * whether any adjustment was applied.
 */
export function applyAdjustments(priceCents: number, adjustments: PricingAdjustment[]): { priceCents: number; applied: boolean } {
  let current = priceCents;
  let applied = false;

  for (const adjustment of adjustments) {
    if (adjustment.type === PricingAdjustmentType.FIXED) {
      current = Math.round(adjustment.value * 100);
      applied = true;
    } else if (adjustment.type === PricingAdjustmentType.PERCENTAGE) {
      current = Math.round(current * (1 - adjustment.value / 100));
      applied = true;
    } else if (adjustment.type === PricingAdjustmentType.OVERRIDE) {
      current = Math.round(adjustment.value * 100);
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
  let convertedPrice = priceCents * exchangeRate;

  const adjustment = rule?.adjustments[0];
  if (adjustment) {
    if (adjustment.type === PricingAdjustmentType.FIXED) {
      convertedPrice += adjustment.value * 100;
    } else if (adjustment.type === PricingAdjustmentType.PERCENTAGE) {
      convertedPrice *= 1 + adjustment.value / 100;
    } else if (adjustment.type === PricingAdjustmentType.EXCHANGE) {
      // Override the exchange rate
      exchangeRate = adjustment.value;
      convertedPrice = priceCents * exchangeRate;
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
