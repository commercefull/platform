/**
 * Types and enums for pricing rules
 */

export enum PricingRuleType {
  QUANTITY_BASED = 'quantity_based',
  TIME_BASED = 'time_based',
  CUSTOMER_SEGMENT = 'customer_segment',
  BUNDLE = 'bundle',
  DYNAMIC = 'dynamic',
  CONTRACT = 'contract',
  CURRENCY_CONVERSION = 'currency_conversion',
}

export enum PricingRuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
  EXPIRED = 'expired',
}

export enum PricingAdjustmentType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  OVERRIDE = 'override',
  EXCHANGE = 'exchange', // For currency exchange rate adjustments
}

export enum PricingRuleScope {
  GLOBAL = 'global',
  PRODUCT = 'product',
  CATEGORY = 'category',
  CUSTOMER = 'customer',
  CUSTOMER_GROUP = 'customer_group',
}

export interface PricingCondition {
  type: string;
  parameters: Record<string, any>;
}

export interface PricingAdjustment {
  type: PricingAdjustmentType;
  value: number;
  target?: string; // What the adjustment applies to (e.g., 'base_price', 'variant_price')
}

export interface PricingRule {
  id: string;
  pricingRuleId?: string; // Alias for id
  name: string;
  description?: string;
  type: PricingRuleType;
  ruleType?: 'percentage' | 'fixed'; // Alias for type
  scope: PricingRuleScope;
  status: PricingRuleStatus;
  isActive?: boolean; // Alias for status === ACTIVE
  priority: number;
  conditions: PricingCondition[];
  adjustments: PricingAdjustment[];
  productIds?: string[];
  variantIds?: string[];
  categoryIds?: string[];
  customerIds?: string[];
  customerGroupIds?: string[];
  startDate?: Date;
  endDate?: Date;
  minimumQuantity?: number;
  maximumQuantity?: number;
  minimumOrderAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  merchantId?: string;
  metadata?: Record<string, any>;
}

export type PricingRuleCreateProps = Omit<PricingRule, 'id' | 'pricingRuleId' | 'createdAt' | 'updatedAt'>;
export type PricingRuleUpdateProps = Partial<Omit<PricingRule, 'id' | 'pricingRuleId' | 'createdAt' | 'updatedAt'>>;

/**
 * Currency Price Rule - Extended from PricingRule for currency-specific pricing
 */
export interface CurrencyPriceRule extends PricingRule {
  currencyCode: string; // Target currency
  regionCode?: string; // Optional region specificity
  minOrderValue?: number; // Minimum order value for rule to apply
  maxOrderValue?: number; // Maximum order value for rule to apply
}

export type CurrencyPriceRuleCreateProps = Omit<CurrencyPriceRule, 'id' | 'createdAt' | 'updatedAt'>;
export type CurrencyPriceRuleUpdateProps = Partial<Omit<CurrencyPriceRule, 'id' | 'createdAt' | 'updatedAt'>>;

export interface PriceContext {
  customerId?: string;
  customerGroupIds?: string[];
  quantity?: number;
  date?: Date;
  cartTotal?: number;
  productIds?: string[];
  variantIds?: string[];
  variantId?: string; // Single variant ID for single product price calculations
  currencyCode?: string; // Requested currency code
  regionCode?: string; // Customer region for region-specific pricing
  additionalData?: Record<string, any>;
  excludeRuleIds?: string[]; // IDs of pricing rules to exclude from calculation
}

export interface PricingResult {
  originalPrice: number;
  finalPrice: number;
  appliedRules: {
    ruleId: string;
    ruleName: string;
    adjustmentType: PricingAdjustmentType;
    adjustmentValue: number;
    impact: number; // How much this rule changed the price
  }[];
  currency: string;
  exchangeRate?: number; // Added for currency conversion tracking
  originalCurrency?: string; // Original currency code before conversion
}

export interface TierPrice {
  id: string;
  tierPriceId?: string; // Alias for id
  productId: string;
  variantId?: string;
  productVariantId?: string; // Alias for variantId
  quantityMin: number;
  quantityMax?: number;
  price: number;
  customerGroupId?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerPriceList {
  id: string;
  name: string;
  description?: string;
  customerIds: string[];
  customerGroupIds: string[];
  priority: number;
  startDate?: Date;
  endDate?: Date;
  status: PricingRuleStatus;
  createdAt: Date;
  updatedAt: Date;
  merchantId?: string;
}

export interface CustomerPrice {
  id: string;
  priceListId: string;
  productId: string;
  variantId?: string;
  adjustmentType: PricingAdjustmentType;
  adjustmentValue: number;
  createdAt: Date;
  updatedAt: Date;
}
