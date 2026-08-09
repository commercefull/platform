/**
 * Shipping Conditions Evaluator
 *
 * Evaluates the `conditions` JSON field on a ShippingRate to determine
 * whether the rate is applicable to a given order and to apply any
 * condition-based rate adjustments (e.g., surcharges or discounts).
 *
 * Supported condition keys (all optional):
 *   minOrderValue   number        Rate applies only if subtotal >= value
 *   maxOrderValue   number        Rate applies only if subtotal <= value
 *   minWeight       number        Rate applies only if totalWeight >= value
 *   maxWeight       number        Rate applies only if totalWeight <= value
 *   minItemCount    number        Rate applies only if itemCount >= value
 *   maxItemCount    number        Rate applies only if itemCount <= value
 *   countries       string[]      Rate applies only if destination country is in list
 *   excludeCountries string[]     Rate applies only if destination country is NOT in list
 *   states          string[]      Rate applies only if destination state is in list
 *   postalCodePatterns string[]   Glob patterns matched against destination postalCode
 *   dateRange       { from: string, to: string }  ISO date window
 *   surcharge       number        Flat surcharge added to the calculated rate
 *   discount        number        Flat discount subtracted from the calculated rate
 */

export interface ShippingConditionContext {
  subtotal: number;
  itemCount: number;
  totalWeight?: number;
  country?: string;
  state?: string;
  postalCode?: string;
  currency?: string;
  orderDate?: Date;
}

export interface ShippingConditionsResult {
  applicable: boolean;
  adjustment: number;
  reason?: string;
}

function matchGlob(pattern: string, value: string): boolean {
  const regex = new RegExp(
    '^' +
      pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') +
      '$',
    'i',
  );
  return regex.test(value);
}

export function evaluateConditions(
  conditions: unknown,
  ctx: ShippingConditionContext,
): ShippingConditionsResult {
  if (!conditions || typeof conditions !== 'object') {
    return { applicable: true, adjustment: 0 };
  }

  const cond = conditions as Record<string, unknown>;
  const _adjustment = 0;

  // Order value range
  if (cond.minOrderValue !== undefined && ctx.subtotal < Number(cond.minOrderValue)) {
    return { applicable: false, adjustment: 0, reason: `Order subtotal below minimum ${cond.minOrderValue}` };
  }
  if (cond.maxOrderValue !== undefined && ctx.subtotal > Number(cond.maxOrderValue)) {
    return { applicable: false, adjustment: 0, reason: `Order subtotal above maximum ${cond.maxOrderValue}` };
  }

  // Weight range
  if (cond.minWeight !== undefined) {
    const w = ctx.totalWeight ?? 0;
    if (w < Number(cond.minWeight)) {
      return { applicable: false, adjustment: 0, reason: `Order weight below minimum ${cond.minWeight}` };
    }
  }
  if (cond.maxWeight !== undefined) {
    const w = ctx.totalWeight ?? 0;
    if (w > Number(cond.maxWeight)) {
      return { applicable: false, adjustment: 0, reason: `Order weight above maximum ${cond.maxWeight}` };
    }
  }

  // Item count range
  if (cond.minItemCount !== undefined && ctx.itemCount < Number(cond.minItemCount)) {
    return { applicable: false, adjustment: 0, reason: `Item count below minimum ${cond.minItemCount}` };
  }
  if (cond.maxItemCount !== undefined && ctx.itemCount > Number(cond.maxItemCount)) {
    return { applicable: false, adjustment: 0, reason: `Item count above maximum ${cond.maxItemCount}` };
  }

  // Country restrictions
  if (Array.isArray(cond.countries) && cond.countries.length > 0) {
    if (!ctx.country || !cond.countries.includes(ctx.country)) {
      return { applicable: false, adjustment: 0, reason: `Country ${ctx.country} not in allowed list` };
    }
  }
  if (Array.isArray(cond.excludeCountries) && cond.excludeCountries.length > 0) {
    if (ctx.country && cond.excludeCountries.includes(ctx.country)) {
      return { applicable: false, adjustment: 0, reason: `Country ${ctx.country} is excluded` };
    }
  }

  // State restrictions
  if (Array.isArray(cond.states) && cond.states.length > 0) {
    if (!ctx.state || !cond.states.includes(ctx.state)) {
      return { applicable: false, adjustment: 0, reason: `State ${ctx.state} not in allowed list` };
    }
  }

  // Postal code patterns
  if (Array.isArray(cond.postalCodePatterns) && cond.postalCodePatterns.length > 0) {
    if (!ctx.postalCode || !cond.postalCodePatterns.some((p: string) => matchGlob(p, ctx.postalCode!))) {
      return { applicable: false, adjustment: 0, reason: `Postal code ${ctx.postalCode} does not match allowed patterns` };
    }
  }

  // Date range
  if (cond.dateRange) {
    const now = ctx.orderDate ?? new Date();
    const dateRange = cond.dateRange as Record<string, string>;
    if (dateRange.from) {
      const from = new Date(dateRange.from);
      if (now < from) {
        return { applicable: false, adjustment: 0, reason: `Rate not yet valid (valid from ${dateRange.from})` };
      }
    }
    if (dateRange.to) {
      const to = new Date(dateRange.to);
      if (now > to) {
        return { applicable: false, adjustment: 0, reason: `Rate expired (valid until ${dateRange.to})` };
      }
    }
  }

  // Rate adjustments
  let adj = 0;
  if (typeof cond.surcharge === 'number') {
    adj += cond.surcharge;
  }
  if (typeof cond.discount === 'number') {
    adj -= cond.discount;
  }

  return { applicable: true, adjustment: adj };
}
