/**
 * AddPriceToList Use Case
 *
 * Adds a customer price to a price list after validating that the list exists
 * and required price fields are present.
 */

import { CustomerPrice, CustomerPriceList } from '../../domain/pricingRule';
import { PriceListNotFoundError, PricingValidationError } from '../../domain/errors/PricingErrors';

export type CustomerPriceCreateProps = Omit<CustomerPrice, 'id' | 'createdAt' | 'updatedAt'>;

interface CustomerPriceWritePort {
  findPriceListById(id: string): Promise<CustomerPriceList | null>;
  createPrice(data: CustomerPriceCreateProps): Promise<CustomerPrice>;
}

export class AddPriceToListUseCase {
  constructor(private readonly customerPrices: CustomerPriceWritePort) {}

  async execute(priceListId: string, priceData: Omit<CustomerPriceCreateProps, 'priceListId'>): Promise<CustomerPrice> {
    const priceList = await this.customerPrices.findPriceListById(priceListId);

    if (!priceList) {
      throw new PriceListNotFoundError(priceListId);
    }

    if (!priceData.productId || !priceData.adjustmentType || priceData.adjustmentValue === undefined) {
      throw new PricingValidationError('Missing required fields: productId, adjustmentType, and adjustmentValue are required');
    }

    return this.customerPrices.createPrice({ ...priceData, priceListId });
  }
}
