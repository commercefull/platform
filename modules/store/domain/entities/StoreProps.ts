/**
 * StoreProps — property bag for the Store aggregate.
 */

export type StoreType = 'merchant_store' | 'organization_store';
export type StoreChannel = 'physical' | 'digital' | 'hybrid';

export interface StoreProps {
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  storeType: StoreType;
  channel: StoreChannel;

  // Ownership
  organizationId?: string;
  isHeadquarters: boolean;
  parentStoreId?: string;

  // Branding
  logo?: string;
  banner?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: string;
  colorScheme?: Record<string, string>;

  // Contact & Location
  storeUrl?: string;
  storeEmail?: string;
  storePhone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  // Business Settings
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  storeRating?: number;
  reviewCount?: number;
  followerCount?: number;
  productCount?: number;
  orderCount?: number;

  // Store Policies
  storePolicies?: {
    returnPolicy?: string;
    shippingPolicy?: string;
    privacyPolicy?: string;
    termsOfService?: string;
  };

  // Shipping & Payment
  shippingMethods?: string[];
  paymentMethods?: string[];

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];

  // Social & Links
  socialLinks?: Record<string, string>;
  openingHours?: Record<string, unknown>;
  customPages?: Record<string, unknown>;
  customFields?: Record<string, unknown>;

  // Store-specific settings
  settings?: {
    allowGuestCheckout: boolean;
    requireAccountForPurchase: boolean;
    enableWishlist: boolean;
    enableProductReviews: boolean;
    enableStoreLocator: boolean;
    inventoryDisplayMode: 'always_show' | 'hide_when_out' | 'show_low_stock';
    priceDisplayMode: 'inclusive_tax' | 'exclusive_tax';
    pickup?: {
      enabled: boolean;
      prepareTimeMinutes: number;
      maxHoldDays: number;
      notifyOnReady: boolean;
      notifyMethods: ('email' | 'sms' | 'push')[];
      pickupInstructions: string;
      requireIdVerification: boolean;
      allowCurbside: boolean;
      operatingHours: Record<string, { open: string; close: string }>;
    };
    localDelivery?: {
      enabled: boolean;
      radiusKm?: number;
      postalCodes: string[];
      deliveryFee: number;
      freeDeliveryThreshold?: number;
      estimatedDeliveryMinutes: number;
      maxDailyOrders: number;
      availableSlots: Array<{ day: string; startTime: string; endTime: string; maxOrders: number }>;
    };
    fulfillment?: {
      /** Whether this store location fulfills ship-from online orders. */
      fulfillOnlineOrders?: boolean;
    };
  };

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

