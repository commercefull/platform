import type { ShippingRate } from '../../../../libs/db/types';

export function calculateRate(rate: ShippingRate, orderTotal: number, itemCount: number, weight?: number): number {
  if (rate.rateType === 'free') return 0;

  if (rate.freeThreshold && orderTotal >= parseFloat(rate.freeThreshold)) {
    return 0;
  }

  let calculatedRate = parseFloat(rate.baseRate);

  switch (rate.rateType) {
    case 'flat':
      break;
    case 'itemBased':
      calculatedRate += parseFloat(rate.perItemRate || '0') * itemCount;
      break;
    case 'priceBased':
      if (rate.rateMatrix) {
        const matrix = typeof rate.rateMatrix === 'string' ? JSON.parse(rate.rateMatrix) : rate.rateMatrix;
        for (const tier of matrix.tiers || []) {
          if (orderTotal >= tier.min && orderTotal < tier.max) {
            calculatedRate = tier.rate;
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
            calculatedRate = tier.rate;
            break;
          }
        }
      }
      break;
  }

  if (rate.minRate) calculatedRate = Math.max(calculatedRate, parseFloat(rate.minRate));
  if (rate.maxRate) calculatedRate = Math.min(calculatedRate, parseFloat(rate.maxRate));

  return calculatedRate;
}
