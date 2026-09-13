// Tax Types
export type TaxCalculationMethod = 'unit_based' | 'row_based' | 'total_based';
export type TaxRateType = 'percentage' | 'fixed';
export type TaxExemptionStatus = 'pending' | 'approved' | 'active' | 'expired' | 'revoked' | 'rejected';
export type TaxExemptionType =
  | 'business'
  | 'individual'
  | 'government'
  | 'nonprofit'
  | 'educational'
  | 'reseller'
  | 'diplomatic'
  | 'other'
  // Rule-engine parity types (Epic B)
  | 'resale'
  | 'vatReverseCharge'
  | 'agricultural'
  | 'manufacturing'
  | 'medical'
  | 'export';

export type TaxZone = {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  countries: string[];
  states?: string[];
  postcodes?: string[];
  cities?: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export type TaxRate = {
  id: string;
  taxCategoryId: string;
  taxZoneId: string;
  name: string;
  description?: string;
  rate: number;
  type: TaxRateType;
  priority: number;
  isCompound: boolean;
  includeInPrice: boolean;
  isShippingTaxable: boolean;
  fixedAmount?: number;
  minimumAmount?: number;
  maximumAmount?: number;
  threshold?: number;
  startDate: number;
  endDate?: number;
  isActive: boolean;
  metadata?: unknown;
  createdAt: number;
  updatedAt: number;
};

export type TaxCategory = {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  metadata?: unknown;
  createdAt: number;
  updatedAt: number;
};

export type CustomerTaxExemption = {
  id: string;
  customerId: string;
  taxZoneId?: string;
  type: TaxExemptionType;
  status: TaxExemptionStatus;
  name: string;
  exemptionNumber: string;
  businessName?: string;
  exemptionReason?: string;
  documentUrl?: string;
  startDate: number;
  expiryDate?: number;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: number;
  notes?: string;
  metadata?: unknown;
  // Epic B — exemption scope (category-aware, amount-bounded, partial)
  applicableTaxCategoryIds?: string[] | null;
  minOrderAmount?: number | null;
  maxOrderAmount?: number | null;
  exemptionPercent?: number;
  createdAt: number;
  updatedAt: number;
};

export type TaxSettings = {
  id: string;
  organizationId: string;
  calculationMethod: TaxCalculationMethod;
  pricesIncludeTax: boolean;
  displayPricesWithTax: boolean;
  taxBasedOn: 'shipping_address' | 'billing_address' | 'store_address' | 'origin_address';
  shippingTaxClass?: string;
  displayTaxTotals: 'itemized' | 'combined' | 'none';
  applyTaxToShipping: boolean;
  applyDiscountBeforeTax: boolean;
  roundTaxAtSubtotal: boolean;
  taxDecimalPlaces: number;
  defaultTaxCategory?: string;
  defaultTaxZone?: string;
  taxProvider?: 'internal' | 'avalara' | 'taxjar' | 'external';
  taxProviderSettings?: unknown;
  metadata?: unknown;
  createdAt: number;
  updatedAt: number;
};

export type TaxBreakdownItem = {
  rateId: string;
  rateName: string;
  rateValue: number;
  taxableAmount: number;
  taxAmount: number;
  jurisdictionLevel: string;
  jurisdictionName: string;
};

export type LineItemTax = {
  lineItemId: string;
  productId: string;
  taxAmount: number;
  taxBreakdown: TaxBreakdownItem[];
};

export type TaxCalculationResult = {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxBreakdown: TaxBreakdownItem[];
  taxZoneApplied?: string;
  taxCategoryApplied?: string;
  calculationReference?: string;
  lineItemTaxes?: LineItemTax[];
};

export type AddressInput = {
  country: string;
  region?: string;
  city?: string;
  postalCode?: string;
};

// Epic B — Exemption evaluation verdict
export type ExemptionVerdict = 'exempt' | 'notExempt' | 'partiallyExempt' | 'pending';

// Epic B — Context for evaluating an exemption against a line item
export interface ExemptionEvaluationContext {
  taxCategoryId?: string;
  orderSubtotal: number;
  now?: Date;
}
