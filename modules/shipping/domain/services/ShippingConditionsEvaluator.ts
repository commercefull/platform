/**
 * Shipping Conditions Evaluator
 *
 * Evaluates the `conditions` JSON field on a ShippingRate to determine
 * whether the rate is applicable to a given order and to apply any
 * condition-based rate adjustments (e.g., surcharges or discounts).
 *
 * Supported condition keys (all optional):
 *   minOrderValue   number        Rate applies only if subtotal >= value (cents)
 *   maxOrderValue   number        Rate applies only if subtotal <= value (cents)
 *   minWeight       number        Rate applies only if totalWeight >= value
 *   maxWeight       number        Rate applies only if totalWeight <= value
 *   minItemCount    number        Rate applies only if itemCount >= value
 *   maxItemCount    number        Rate applies only if itemCount <= value
 *   countries       string[]      Rate applies only if destination country is in list
 *   excludeCountries string[]     Rate applies only if destination country is NOT in list
 *   states          string[]      Rate applies only if destination state is in list
 *   postalCodePatterns string[]   Glob patterns matched against destination postalCode
 *   dateRange       { from: string, to: string }  ISO date window
 *   surcharge       number        Flat surcharge added to the calculated rate (cents)
 *   discount        number        Flat discount subtracted from the calculated rate (cents)
 */

export interface ShippingConditionContext {
  subtotalCents: number;
  itemCount: number;
  totalWeight?: number;
  country?: string;
  state?: string;
  postalCode?: string;
  /** Ship-from country — enables origin→destination lane conditions. */
  originCountry?: string;
  currency?: string;
  orderDate?: Date;
}

export interface ShippingConditionsResult {
  applicable: boolean;
  adjustmentCents: number;
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

type ConditionRecord = Record<string, unknown>;

// Applicability checks, evaluated in order — each returns a rejection
// reason or null when the condition passes. The first failure wins.
const CONDITION_CHECKS: Array<(cond: ConditionRecord, ctx: ShippingConditionContext) => string | null> = [
  // Order value range
  (cond, ctx) =>
    cond.minOrderValue !== undefined && ctx.subtotalCents < Number(cond.minOrderValue)
      ? `Order subtotal below minimum ${cond.minOrderValue}`
      : null,
  (cond, ctx) =>
    cond.maxOrderValue !== undefined && ctx.subtotalCents > Number(cond.maxOrderValue)
      ? `Order subtotal above maximum ${cond.maxOrderValue}`
      : null,

  // Weight range
  (cond, ctx) =>
    cond.minWeight !== undefined && (ctx.totalWeight ?? 0) < Number(cond.minWeight) ? `Order weight below minimum ${cond.minWeight}` : null,
  (cond, ctx) =>
    cond.maxWeight !== undefined && (ctx.totalWeight ?? 0) > Number(cond.maxWeight) ? `Order weight above maximum ${cond.maxWeight}` : null,

  // Item count range
  (cond, ctx) =>
    cond.minItemCount !== undefined && ctx.itemCount < Number(cond.minItemCount) ? `Item count below minimum ${cond.minItemCount}` : null,
  (cond, ctx) =>
    cond.maxItemCount !== undefined && ctx.itemCount > Number(cond.maxItemCount) ? `Item count above maximum ${cond.maxItemCount}` : null,

  // Country restrictions
  (cond, ctx) =>
    Array.isArray(cond.countries) && cond.countries.length > 0 && (!ctx.country || !cond.countries.includes(ctx.country))
      ? `Country ${ctx.country} not in allowed list`
      : null,
  (cond, ctx) =>
    Array.isArray(cond.excludeCountries) && cond.excludeCountries.length > 0 && ctx.country && cond.excludeCountries.includes(ctx.country)
      ? `Country ${ctx.country} is excluded`
      : null,

  // Origin country restrictions (ship-from → ship-to lanes)
  (cond, ctx) =>
    Array.isArray(cond.originCountries) &&
    cond.originCountries.length > 0 &&
    (!ctx.originCountry || !cond.originCountries.includes(ctx.originCountry))
      ? `Origin country ${ctx.originCountry} not in allowed list`
      : null,
  (cond, ctx) =>
    Array.isArray(cond.excludeOriginCountries) &&
    cond.excludeOriginCountries.length > 0 &&
    ctx.originCountry &&
    cond.excludeOriginCountries.includes(ctx.originCountry)
      ? `Origin country ${ctx.originCountry} is excluded`
      : null,

  // State restrictions
  (cond, ctx) =>
    Array.isArray(cond.states) && cond.states.length > 0 && (!ctx.state || !cond.states.includes(ctx.state))
      ? `State ${ctx.state} not in allowed list`
      : null,

  // Postal code patterns
  (cond, ctx) =>
    Array.isArray(cond.postalCodePatterns) &&
    cond.postalCodePatterns.length > 0 &&
    (!ctx.postalCode || !cond.postalCodePatterns.some((p: string) => matchGlob(p, ctx.postalCode!)))
      ? `Postal code ${ctx.postalCode} does not match allowed patterns`
      : null,

  dateRangeRejection,
];

// Date window: { from?: string, to?: string } ISO bounds
function dateRangeRejection(cond: ConditionRecord, ctx: ShippingConditionContext): string | null {
  if (!cond.dateRange) return null;

  const now = ctx.orderDate ?? new Date();
  const dateRange = cond.dateRange as Record<string, string>;
  if (dateRange.from && now < new Date(dateRange.from)) {
    return `Rate not yet valid (valid from ${dateRange.from})`;
  }
  if (dateRange.to && now > new Date(dateRange.to)) {
    return `Rate expired (valid until ${dateRange.to})`;
  }
  return null;
}

export function evaluateConditions(conditions: unknown, ctx: ShippingConditionContext): ShippingConditionsResult {
  if (!conditions || typeof conditions !== 'object') {
    return { applicable: true, adjustmentCents: 0 };
  }

  const cond = conditions as ConditionRecord;

  for (const check of CONDITION_CHECKS) {
    const reason = check(cond, ctx);
    if (reason) {
      return { applicable: false, adjustmentCents: 0, reason };
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

  return { applicable: true, adjustmentCents: adj };
}
