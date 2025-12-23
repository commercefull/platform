/**
 * Store Entity
 * Unified store concept that works for both marketplace and multi-store scenarios
 */

export type StoreType = 'merchant_store' | 'business_store';

export interface StoreProps {
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  storeType: StoreType;

  // Ownership - either merchant or business
  merchantId?: string; // For marketplace stores
  businessId?: string; // For business stores

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
  supportedCurrencies?: string[];
  defaultCurrency?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];

  // Social & Links
  socialLinks?: Record<string, string>;
  openingHours?: Record<string, any>;
  customPages?: Record<string, any>;
  customFields?: Record<string, any>;

  // Store-specific settings
  settings?: {
    allowGuestCheckout: boolean;
    requireAccountForPurchase: boolean;
    enableWishlist: boolean;
    enableProductReviews: boolean;
    enableStoreLocator: boolean;
    inventoryDisplayMode: 'always_show' | 'hide_when_out' | 'show_low_stock';
    priceDisplayMode: 'inclusive_tax' | 'exclusive_tax';
  };

  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Store {
  private props: StoreProps;

  private constructor(props: StoreProps) {
    this.props = props;
  }

  static create(props: {
    storeId: string;
    name: string;
    storeType: StoreType;
    merchantId?: string;
    businessId?: string;
    description?: string;
    storeUrl?: string;
    storeEmail?: string;
    storePhone?: string;
    address?: StoreProps['address'];
    logo?: string;
    banner?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
    theme?: string;
    defaultCurrency?: string;
    supportedCurrencies?: string[];
    metadata?: Record<string, any>;
  }): Store {
    const now = new Date();

    // Validate ownership
    if (props.storeType === 'merchant_store' && !props.merchantId) {
      throw new Error('Merchant stores must have a merchantId');
    }
    if (props.storeType === 'business_store' && !props.businessId) {
      throw new Error('Business stores must have a businessId');
    }

    return new Store({
      storeId: props.storeId,
      name: props.name,
      slug: Store.generateSlug(props.name),
      description: props.description,
      storeType: props.storeType,
      merchantId: props.merchantId,
      businessId: props.businessId,
      storeUrl: props.storeUrl,
      storeEmail: props.storeEmail,
      storePhone: props.storePhone,
      address: props.address,
      logo: props.logo,
      banner: props.banner,
      favicon: props.favicon,
      primaryColor: props.primaryColor || '#007bff',
      secondaryColor: props.secondaryColor || '#6c757d',
      theme: props.theme,
      isActive: true,
      isVerified: false,
      isFeatured: false,
      defaultCurrency: props.defaultCurrency || 'USD',
      supportedCurrencies: props.supportedCurrencies || ['USD'],
      settings: {
        allowGuestCheckout: true,
        requireAccountForPurchase: false,
        enableWishlist: true,
        enableProductReviews: true,
        enableStoreLocator: false,
        inventoryDisplayMode: 'show_low_stock',
        priceDisplayMode: 'exclusive_tax',
      },
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: StoreProps): Store {
    return new Store(props);
  }

  // Getters
  get storeId(): string {
    return this.props.storeId;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get storeType(): StoreType {
    return this.props.storeType;
  }
  get merchantId(): string | undefined {
    return this.props.merchantId;
  }
  get businessId(): string | undefined {
    return this.props.businessId;
  }
  get ownerId(): string {
    return this.props.merchantId || this.props.businessId!;
  }
  get isMerchantStore(): boolean {
    return this.props.storeType === 'merchant_store';
  }
  get isBusinessStore(): boolean {
    return this.props.storeType === 'business_store';
  }

  // Branding getters
  get logo(): string | undefined {
    return this.props.logo;
  }
  get banner(): string | undefined {
    return this.props.banner;
  }
  get favicon(): string | undefined {
    return this.props.favicon;
  }
  get primaryColor(): string | undefined {
    return this.props.primaryColor;
  }
  get secondaryColor(): string | undefined {
    return this.props.secondaryColor;
  }
  get theme(): string | undefined {
    return this.props.theme;
  }
  get colorScheme(): Record<string, string> | undefined {
    return this.props.colorScheme;
  }

  // Contact & location getters
  get storeUrl(): string | undefined {
    return this.props.storeUrl;
  }
  get storeEmail(): string | undefined {
    return this.props.storeEmail;
  }
  get storePhone(): string | undefined {
    return this.props.storePhone;
  }
  get address(): StoreProps['address'] | undefined {
    return this.props.address;
  }

  // Status getters
  get isActive(): boolean {
    return this.props.isActive;
  }
  get isVerified(): boolean {
    return this.props.isVerified;
  }
  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  // Business info getters
  get storeRating(): number | undefined {
    return this.props.storeRating;
  }
  get reviewCount(): number | undefined {
    return this.props.reviewCount;
  }
  get followerCount(): number | undefined {
    return this.props.followerCount;
  }
  get productCount(): number | undefined {
    return this.props.productCount;
  }
  get orderCount(): number | undefined {
    return this.props.orderCount;
  }

  // Settings getters
  get storePolicies(): StoreProps['storePolicies'] | undefined {
    return this.props.storePolicies;
  }
  get shippingMethods(): string[] | undefined {
    return this.props.shippingMethods;
  }
  get paymentMethods(): string[] | undefined {
    return this.props.paymentMethods;
  }
  get supportedCurrencies(): string[] | undefined {
    return this.props.supportedCurrencies;
  }
  get defaultCurrency(): string | undefined {
    return this.props.defaultCurrency;
  }
  get settings(): StoreProps['settings'] | undefined {
    return this.props.settings;
  }

  // SEO getters
  get metaTitle(): string | undefined {
    return this.props.metaTitle;
  }
  get metaDescription(): string | undefined {
    return this.props.metaDescription;
  }
  get metaKeywords(): string[] | undefined {
    return this.props.metaKeywords;
  }

  // Social getters
  get socialLinks(): Record<string, string> | undefined {
    return this.props.socialLinks;
  }
  get openingHours(): Record<string, any> | undefined {
    return this.props.openingHours;
  }
  get customPages(): Record<string, any> | undefined {
    return this.props.customPages;
  }
  get customFields(): Record<string, any> | undefined {
    return this.props.customFields;
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain methods
  updateBasicInfo(updates: { name?: string; description?: string; storeUrl?: string; storeEmail?: string; storePhone?: string }): void {
    if (updates.name) {
      this.props.name = updates.name;
      this.props.slug = Store.generateSlug(updates.name);
    }
    if (updates.description !== undefined) this.props.description = updates.description;
    if (updates.storeUrl !== undefined) this.props.storeUrl = updates.storeUrl;
    if (updates.storeEmail !== undefined) this.props.storeEmail = updates.storeEmail;
    if (updates.storePhone !== undefined) this.props.storePhone = updates.storePhone;
    this.touch();
  }

  updateBranding(branding: {
    logo?: string;
    banner?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
    theme?: string;
    colorScheme?: Record<string, string>;
  }): void {
    if (branding.logo !== undefined) this.props.logo = branding.logo;
    if (branding.banner !== undefined) this.props.banner = branding.banner;
    if (branding.favicon !== undefined) this.props.favicon = branding.favicon;
    if (branding.primaryColor !== undefined) this.props.primaryColor = branding.primaryColor;
    if (branding.secondaryColor !== undefined) this.props.secondaryColor = branding.secondaryColor;
    if (branding.theme !== undefined) this.props.theme = branding.theme;
    if (branding.colorScheme !== undefined) this.props.colorScheme = branding.colorScheme;
    this.touch();
  }

  updateAddress(address: StoreProps['address']): void {
    this.props.address = address;
    this.touch();
  }

  updatePolicies(policies: StoreProps['storePolicies']): void {
    this.props.storePolicies = { ...this.props.storePolicies, ...policies };
    this.touch();
  }

  updateShippingMethods(methods: string[]): void {
    this.props.shippingMethods = methods;
    this.touch();
  }

  updatePaymentMethods(methods: string[]): void {
    this.props.paymentMethods = methods;
    this.touch();
  }

  updateCurrencies(currencies: string[], defaultCurrency?: string): void {
    this.props.supportedCurrencies = currencies;
    if (defaultCurrency) this.props.defaultCurrency = defaultCurrency;
    this.touch();
  }

  updateSEO(seo: { metaTitle?: string; metaDescription?: string; metaKeywords?: string[] }): void {
    if (seo.metaTitle !== undefined) this.props.metaTitle = seo.metaTitle;
    if (seo.metaDescription !== undefined) this.props.metaDescription = seo.metaDescription;
    if (seo.metaKeywords !== undefined) this.props.metaKeywords = seo.metaKeywords;
    this.touch();
  }

  updateSettings(settings: Partial<StoreProps['settings']>): void {
    if (!settings) return;

    // Ensure we have a valid settings object to work with
    const currentSettings = this.props.settings || {
      allowGuestCheckout: true,
      requireAccountForPurchase: false,
      enableWishlist: true,
      enableProductReviews: true,
      enableStoreLocator: false,
      inventoryDisplayMode: 'show_low_stock' as const,
      priceDisplayMode: 'exclusive_tax' as const,
    };

    const updatedSettings: StoreProps['settings'] = { ...currentSettings };

    // Only update defined properties
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        (updatedSettings as any)[key] = value;
      }
    });

    this.props.settings = updatedSettings;
    this.touch();
  }

  updateSocialLinks(links: Record<string, string>): void {
    this.props.socialLinks = { ...this.props.socialLinks, ...links };
    this.touch();
  }

  setOpeningHours(hours: Record<string, any>): void {
    this.props.openingHours = hours;
    this.touch();
  }

  // Status methods
  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  verify(): void {
    this.props.isVerified = true;
    this.touch();
  }

  feature(): void {
    this.props.isFeatured = true;
    this.touch();
  }

  unfeature(): void {
    this.props.isFeatured = false;
    this.touch();
  }

  // Statistics methods
  updateStats(stats: { rating?: number; reviewCount?: number; followerCount?: number; productCount?: number; orderCount?: number }): void {
    if (stats.rating !== undefined) this.props.storeRating = stats.rating;
    if (stats.reviewCount !== undefined) this.props.reviewCount = stats.reviewCount;
    if (stats.followerCount !== undefined) this.props.followerCount = stats.followerCount;
    if (stats.productCount !== undefined) this.props.productCount = stats.productCount;
    if (stats.orderCount !== undefined) this.props.orderCount = stats.orderCount;
    this.touch();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  toJSON(): Record<string, any> {
    return {
      storeId: this.props.storeId,
      name: this.props.name,
      slug: this.props.slug,
      description: this.props.description,
      storeType: this.props.storeType,
      merchantId: this.props.merchantId,
      businessId: this.props.businessId,
      ownerId: this.ownerId,
      isMerchantStore: this.isMerchantStore,
      isBusinessStore: this.isBusinessStore,
      logo: this.props.logo,
      banner: this.props.banner,
      favicon: this.props.favicon,
      primaryColor: this.props.primaryColor,
      secondaryColor: this.props.secondaryColor,
      theme: this.props.theme,
      storeUrl: this.props.storeUrl,
      storeEmail: this.props.storeEmail,
      storePhone: this.props.storePhone,
      address: this.props.address,
      isActive: this.props.isActive,
      isVerified: this.props.isVerified,
      isFeatured: this.props.isFeatured,
      storeRating: this.props.storeRating,
      reviewCount: this.props.reviewCount,
      followerCount: this.props.followerCount,
      productCount: this.props.productCount,
      orderCount: this.props.orderCount,
      storePolicies: this.props.storePolicies,
      shippingMethods: this.props.shippingMethods,
      paymentMethods: this.props.paymentMethods,
      supportedCurrencies: this.props.supportedCurrencies,
      defaultCurrency: this.props.defaultCurrency,
      settings: this.props.settings,
      metaTitle: this.props.metaTitle,
      metaDescription: this.props.metaDescription,
      metaKeywords: this.props.metaKeywords,
      socialLinks: this.props.socialLinks,
      openingHours: this.props.openingHours,
      customPages: this.props.customPages,
      customFields: this.props.customFields,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
