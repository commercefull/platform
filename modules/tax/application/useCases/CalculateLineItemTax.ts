/**
 * CalculateLineItemTax Use Case
 *
 * Orchestrates tax calculation for a single line item: input validation,
 * dispatch to the legacy simplified calculation when available, otherwise the
 * complex per-item pipeline. The response payload shape is preserved for the
 * caller.
 */

import { TaxValidationError } from '../../domain/errors/TaxErrors';

export interface TaxAddressInput {
  country: string;
  region?: string;
  postalCode?: string;
  city?: string;
}

export interface CalculateLineItemTaxCommand {
  productId?: string;
  quantity?: number;
  priceCents?: number;
  shippingAddress?: TaxAddressInput;
  customerId?: string;
  organizationId?: string;
}

interface LineTaxResult {
  taxAmountCents: number;
  rate: number;
  taxableAmountCents: number;
  totalCents: number;
}

interface TaxCalculationPort {
  calculateTaxForLineItem?(
    productId: string,
    quantity: number,
    priceCents: number,
    address: { country: string; region?: string; postalCode?: string },
    customerId?: string,
  ): Promise<LineTaxResult>;
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

export class CalculateLineItemTaxUseCase {
  constructor(private readonly taxCalculation: TaxCalculationPort) {}

  async execute(command: CalculateLineItemTaxCommand): Promise<unknown> {
    const { productId, quantity, priceCents, shippingAddress, customerId, organizationId } = command;

    if (!productId || !quantity || priceCents === undefined || !shippingAddress || !shippingAddress.country) {
      throw new TaxValidationError('Product ID, quantity, priceCents, and shipping country are required');
    }

    const parsedQuantity = Number(quantity);
    const parsedPriceCents = Number(priceCents);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      throw new TaxValidationError('Quantity must be a positive number');
    }

    if (isNaN(parsedPriceCents) || parsedPriceCents < 0) {
      throw new TaxValidationError('Price must be a non-negative number');
    }

    if (typeof this.taxCalculation.calculateTaxForLineItem === 'function') {
      const taxResult = await this.taxCalculation.calculateTaxForLineItem(productId, parsedQuantity, parsedPriceCents, {
        country: shippingAddress.country,
        region: shippingAddress.region,
        postalCode: shippingAddress.postalCode,
      }, customerId);

      const subtotalCents = taxResult.taxableAmountCents;
      return {
        subtotalCents,
        taxAmountCents: taxResult.taxAmountCents,
        totalCents: taxResult.totalCents,
        rate: taxResult.rate,
        taxBreakdown:
          taxResult.taxAmountCents > 0
            ? [
                {
                  rateId: 'default',
                  rateName: 'Tax',
                  rateValue: taxResult.rate,
                  taxableAmountCents: subtotalCents,
                  taxAmountCents: taxResult.taxAmountCents,
                },
              ]
            : [],
      };
    }

    const dbAddress = {
      country: shippingAddress.country,
      region: shippingAddress.region,
      postal_code: shippingAddress.postalCode,
      city: shippingAddress.city,
    };

    return this.taxCalculation.calculateComplexTax(
      [
        {
          product_id: productId,
          quantity: parsedQuantity,
          priceCents: parsedPriceCents,
          tax_category_id: undefined,
        },
      ],
      dbAddress,
      dbAddress,
      parsedPriceCents * parsedQuantity,
      0,
      customerId,
      organizationId,
    );
  }
}
