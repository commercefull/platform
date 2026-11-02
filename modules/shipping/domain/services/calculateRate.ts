import type { ShippingRateRecord as ShippingRate } from '../entities/ShippingModel';

export function calculateRate(rate: ShippingRate, orderTotalCents: number, itemCount: number, weight?: number): number {
  if (rate.rateType === 'free') return 0;

  if (rate.freeThresholdCents && orderTotalCents >= Number(rate.freeThresholdCents)) {
    return 0;
  }

  let calculatedRateCents = rateByType(rate, orderTotalCents, itemCount, weight);

  if (rate.minRateCents) calculatedRateCents = Math.max(calculatedRateCents, Number(rate.minRateCents));
  if (rate.maxRateCents) calculatedRateCents = Math.min(calculatedRateCents, Number(rate.maxRateCents));

  return calculatedRateCents;
}

function rateByType(rate: ShippingRate, orderTotalCents: number, itemCount: number, weight?: number): number {
  const baseRateCents = Number(rate.baseRateCents);
  if (rate.rateType === 'itemBased') {
    return baseRateCents + Number(rate.perItemRateCents || 0) * itemCount;
  }
  if (rate.rateType === 'priceBased') {
    // tier.min/tier.max are order totals in cents; tier.rate is a rate in cents
    return tierRate(rate, orderTotalCents) ?? baseRateCents;
  }
  if (rate.rateType === 'weightBased' && weight) {
    return tierRate(rate, weight) ?? baseRateCents;
  }
  return baseRateCents;
}

function tierRate(rate: ShippingRate, value: number): number | undefined {
  if (!rate.rateMatrix) return undefined;
  const matrix = typeof rate.rateMatrix === 'string' ? JSON.parse(rate.rateMatrix) : rate.rateMatrix;
  for (const tier of matrix.tiers || []) {
    if (value >= tier.min && value < tier.max) {
      return tier.rate;
    }
  }
  return undefined;
}
