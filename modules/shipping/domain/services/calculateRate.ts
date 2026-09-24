import type { ShippingRateRecord as ShippingRate } from '../entities/ShippingModel';

export function calculateRate(rate: ShippingRate, orderTotalCents: number, itemCount: number, weight?: number): number {
  if (rate.rateType === 'free') return 0;

  if (rate.freeThresholdCents && orderTotalCents >= Number(rate.freeThresholdCents)) {
    return 0;
  }

  let calculatedRateCents = Number(rate.baseRateCents);

  switch (rate.rateType) {
    case 'flat':
      break;
    case 'itemBased':
      calculatedRateCents += Number(rate.perItemRateCents || 0) * itemCount;
      break;
    case 'priceBased':
      if (rate.rateMatrix) {
        const matrix = typeof rate.rateMatrix === 'string' ? JSON.parse(rate.rateMatrix) : rate.rateMatrix;
        for (const tier of matrix.tiers || []) {
          // tier.min/tier.max are order totals in cents; tier.rate is a rate in cents
          if (orderTotalCents >= tier.min && orderTotalCents < tier.max) {
            calculatedRateCents = tier.rate;
            break;
          }
        }
      }
      break;
    case 'weightBased':
      if (weight && rate.rateMatrix) {
        const matrix = typeof rate.rateMatrix === 'string' ? JSON.parse(rate.rateMatrix) : rate.rateMatrix;
        for (const tier of matrix.tiers || []) {
          if (weight >= tier.min && weight < tier.max) {
            calculatedRateCents = tier.rate;
            break;
          }
        }
      }
      break;
  }

  if (rate.minRateCents) calculatedRateCents = Math.max(calculatedRateCents, Number(rate.minRateCents));
  if (rate.maxRateCents) calculatedRateCents = Math.min(calculatedRateCents, Number(rate.maxRateCents));

  return calculatedRateCents;
}
