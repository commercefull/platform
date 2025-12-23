/**
 * Data Model Alignment Types
 *
 * TypeScript interfaces for the new data model entities supporting
 * multi-store, marketplace, and B2B scenarios.
 */

// =============================================================================
// Organization & Commerce Context
// =============================================================================

export interface Organization {
  organizationId: string;
  name: string;
  slug: string;
  type: 'single' | 'multi_store' | 'marketplace' | 'b2b';
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface StoreChannel {
  storeChannelId: string;
  storeId: string;
  channelId: string;
  status: 'active' | 'inactive' | 'pending';
  launchDate: Date | null;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Assortment Management
// =============================================================================

export interface Assortment {
  assortmentId: string;
  organizationId: string;
  name: string;
  description: string | null;
  scopeType: 'store' | 'seller' | 'account' | 'channel';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AssortmentScope {
  assortmentScopeId: string;
  assortmentId: string;
  storeId: string | null;
  sellerId: string | null;
  accountId: string | null;
  channelId: string | null;
  createdAt: Date;
}

export interface AssortmentItem {
  assortmentItemId: string;
  assortmentId: string;
  productVariantId: string;
  visibility: 'listed' | 'hidden';
  buyable: boolean;
  minQty: number;
  maxQty: number | null;
  incrementQty: number;
  leadTimeDays: number | null;
  discontinueDate: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Pricing
// =============================================================================

export interface PriceListScope {
  priceListScopeId: string;
  priceListId: string;
  storeId: string | null;
  channelId: string | null;
  accountId: string | null;
  sellerId: string | null;
  customerSegmentId: string | null;
  priority: number;
  createdAt: Date;
}

// =============================================================================
// Fulfillment & Inventory
// =============================================================================

export interface FulfillmentLocation {
  locationId: string;
  organizationId: string;
  type: 'warehouse' | 'store' | 'dropship_vendor' | '3pl' | 'dark_store';
  name: string;
  code: string | null;
  addressId: string | null;
  timezone: string;
  sellerId: string | null;
  isActive: boolean;
  capabilities: {
    canShip?: boolean;
    canPickup?: boolean;
    canLocalDeliver?: boolean;
  };
  operatingHours: Record<string, { open: string; close: string }>;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryReservation {
  reservationId: string;
  orderId: string;
  productVariantId: string;
  locationId: string;
  quantity: number;
  status: 'reserved' | 'released' | 'consumed';
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderAllocation {
  allocationId: string;
  orderLineId: string;
  locationId: string;
  sellerId: string | null;
  quantity: number;
  status: 'allocated' | 'picked' | 'packed' | 'shipped';
  createdAt: Date;
  updatedAt: Date;
}

export interface FulfillmentNetworkRule {
  ruleId: string;
  organizationId: string;
  storeId: string | null;
  channelId: string | null;
  name: string;
  priority: number;
  ruleType: 'location_preference' | 'ship_from_store' | 'bopis' | 'seller_only';
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Marketplace
// =============================================================================

export interface CommissionPlan {
  commissionPlanId: string;
  organizationId: string;
  name: string;
  rules: {
    categoryRules?: Array<{
      categoryId: string;
      percentage: number;
    }>;
    fixedFees?: Array<{
      name: string;
      amount: number;
    }>;
    defaultPercentage?: number;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerPolicy {
  sellerPolicyId: string;
  sellerId: string;
  returnsPolicy: string | null;
  shippingPolicy: string | null;
  slaDays: number;
  customPolicies: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payout {
  payoutId: string;
  sellerId: string;
  orderId: string | null;
  settlementId: string | null;
  grossAmount: number;
  commissionAmount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  status: 'pending' | 'scheduled' | 'processing' | 'completed' | 'failed';
  scheduledDate: Date | null;
  processedAt: Date | null;
  paymentReference: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// B2B
// =============================================================================

export interface PaymentTerms {
  paymentTermsId: string;
  organizationId: string;
  name: string;
  code: string;
  days: number;
  discountPercentage: number | null;
  discountDays: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxExemption {
  taxExemptionId: string;
  accountId: string;
  type: 'resale' | 'nonprofit' | 'government' | 'manufacturing';
  certificateRef: string | null;
  certificateDocument: string | null;
  jurisdiction: string | null;
  validFrom: Date;
  validTo: Date | null;
  status: 'active' | 'expired' | 'revoked';
  verifiedAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Extended Existing Types (added fields)
// =============================================================================

export interface StoreExtended {
  organizationId: string | null;
  taxZoneId: string | null;
  priceRoundingRules: Record<string, unknown>;
  defaultCurrency: string;
  defaultLanguage: string;
}

export interface ChannelExtended {
  organizationId: string | null;
  region: string | null;
  domain: string | null;
  appId: string | null;
}

export interface ProductExtended {
  organizationId: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  platformVisible: boolean;
}

export interface BasketExtended {
  storeId: string | null;
  channelId: string | null;
  accountId: string | null;
}

export interface BasketItemExtended {
  sellerId: string | null;
}

export interface OrderExtended {
  storeId: string | null;
  channelId: string | null;
  accountId: string | null;
  merchantId: string | null;
  purchaseOrderNumber: string | null;
  parentOrderId: string | null;
}

export interface OrderLineExtended {
  sellerId: string | null;
}

export interface MerchantExtended {
  type: 'internal' | 'external';
  commissionPlanId: string | null;
}

export interface B2BCompanyExtended {
  organizationId: string | null;
  paymentTermsId: string | null;
  creditLimit: number | null;
  availableCredit: number | null;
}

export interface InventoryLevelExtended {
  safetyStockQty: number;
  inboundQty: number;
  locationId: string | null;
}

export interface PriceListExtended {
  organizationId: string | null;
  type: 'retail' | 'wholesale' | 'contract' | 'promo';
}
