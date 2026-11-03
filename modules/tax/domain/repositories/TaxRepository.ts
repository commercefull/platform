/**
 * Tax Repository Port
 *
 * Domain interfaces for tax settings persistence. Row records mirror the
 * generated schema shape.
 */

export interface TaxSettings {
  taxSettingsId: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  calculationMethod: 'unitBased' | 'itemBased';
  pricesIncludeTax: boolean;
  displayPricesWithTax: boolean;
  taxBasedOn: 'shippingAddress' | 'billingAddress';
  shippingTaxClass: string | null;
  displayTaxTotals: 'itemized' | 'summary';
  applyTaxToShipping: boolean;
  applyDiscountBeforeTax: boolean;
  roundTaxAtSubtotal: boolean;
  taxDecimalPlaces: number;
  defaultTaxCategory: string | null;
  defaultTaxZone: string | null;
  taxProvider: 'internal' | 'external' | null;
  taxProviderSettings: unknown | null;
}

export interface TaxSettingsRepository {
  findByMerchant(organizationId: string): Promise<TaxSettings | null>;
}
