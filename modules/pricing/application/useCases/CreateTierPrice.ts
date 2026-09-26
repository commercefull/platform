/**
 * CreateTierPrice Use Case
 *
 * Creates a tier price after validating required fields.
 */

import { TierPrice } from '../../domain/pricingRule';
import { PricingValidationError } from '../../domain/errors/PricingErrors';

export type TierPriceCreateProps = Omit<TierPrice, 'id' | 'createdAt' | 'updatedAt'>;

interface TierPriceCreatePort {
  create(data: TierPriceCreateProps): Promise<TierPrice>;
}

export class CreateTierPriceUseCase {
  constructor(private readonly tierPrices: TierPriceCreatePort) {}

  async execute(tierPriceData: TierPriceCreateProps): Promise<TierPrice> {
    if (!tierPriceData.productId || !tierPriceData.quantityMin || tierPriceData.priceCents === undefined) {
      throw new PricingValidationError('Missing required fields: productId, quantityMin, and priceCents are required');
    }

    return this.tierPrices.create(tierPriceData);
  }
}
