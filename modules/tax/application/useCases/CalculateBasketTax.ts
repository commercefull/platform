/**
 * CalculateBasketTax Use Case
 *
 * Orchestrates tax calculation for an entire basket: input validation,
 * dispatch to the legacy calculation when available, otherwise loads the
 * basket through the taxable-basket port and runs the complex pipeline with
 * shipping/billing addresses.
 */

import { TaxableBasketNotFoundError, TaxValidationError } from '../../domain/errors/TaxErrors';
import type { TaxableBasketPort } from '../ports/TaxableBasketPort';
import type { TaxAddressInput } from './CalculateLineItemTax';

export interface CalculateBasketTaxCommand {
  basketId?: string;
  shippingAddress?: TaxAddressInput;
  billingAddress?: TaxAddressInput;
  customerId?: string;
  organizationId?: string;
}

interface BasketTaxCalculationPort {
  calculateTaxForBasket?(
    basketId: string,
    address: { country: string; region?: string; postal_code?: string },
    customerId?: string,
  ): Promise<unknown>;
  calculateComplexTax(
    items: Array<{ product_id: string; tax_category_id?: string; quantity: number; priceCents: number }>,
    shippingAddress: { country: string; region?: string; postal_code?: string; city?: string },
    billingAddress: { country: string; region?: string; postal_code?: string; city?: string },
    subtotalCents: number,
    shippingAmountCents: number,
    customerId?: string,
    organizationId?: string,
  ): Promise<unknown>;
}

export class CalculateBasketTaxUseCase {
  constructor(
    private readonly taxableBasket: TaxableBasketPort,
    private readonly taxCalculation: BasketTaxCalculationPort,
  ) {}

  async execute(command: CalculateBasketTaxCommand): Promise<unknown> {
    const { basketId, shippingAddress, billingAddress, customerId, organizationId } = command;

    if (!basketId || !shippingAddress || !shippingAddress.country) {
      throw new TaxValidationError('Basket ID and shipping country are required');
    }

    if (typeof this.taxCalculation.calculateTaxForBasket === 'function') {
      return this.taxCalculation.calculateTaxForBasket(
        basketId,
        {
          country: shippingAddress.country,
          region: shippingAddress.region,
          postal_code: shippingAddress.postalCode,
        },
        customerId,
      );
    }

    const basket = await this.taxableBasket.findById(basketId);

    if (!basket) {
      throw new TaxableBasketNotFoundError(basketId);
    }

    const dbShippingAddr = {
      country: shippingAddress.country,
      region: shippingAddress.region,
      postal_code: shippingAddress.postalCode,
      city: shippingAddress.city,
    };

    const dbBillingAddr = billingAddress
      ? {
          country: billingAddress.country,
          region: billingAddress.region,
          postal_code: billingAddress.postalCode,
          city: billingAddress.city,
        }
      : dbShippingAddr;

    const dbItems = basket.items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      priceCents: item.priceCents,
      tax_category_id: undefined,
    }));

    return this.taxCalculation.calculateComplexTax(
      dbItems,
      dbShippingAddr,
      dbBillingAddr,
      basket.subtotalCents,
      0,
      customerId,
      organizationId,
    );
  }
}
