import { unixTimestamp } from '../../libs/date';

// Tax Types
export type TaxCalculationMethod = 'unit_based' | 'row_based' | 'total_based';
export type TaxRateType = 'percentage' | 'fixed_amount' | 'compound' | 'combined';
export type TaxExemptionStatus = 'pending' | 'active' | 'expired' | 'revoked' | 'rejected';
export type TaxExemptionType = 'business' | 'government' | 'nonprofit' | 'educational' | 'reseller' | 'diplomatic' | 'other';

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
  metadata?: any;
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
  metadata?: any;
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
  metadata?: any;
  createdAt: number;
  updatedAt: number;
};

export type TaxSettings = {
  id: string;
  merchantId: string;
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
  taxProviderSettings?: any;
  metadata?: any;
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
