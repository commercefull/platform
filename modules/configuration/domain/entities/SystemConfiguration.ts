/**
 * System Configuration Entity
 * Manages global system settings and operating modes
 */

export type SystemMode = 'marketplace' | 'multi_store' | 'single_store';

export interface SystemConfigurationProps {
  configId: string;
  systemMode: SystemMode;
  features: {
    enableMarketplace: boolean;
    enableMultiStore: boolean;
    enableMultiWarehouse: boolean;
    enableProductVariants: boolean;
    enableInventoryManagement: boolean;
    enableCoupons: boolean;
    enableSubscriptions: boolean;
    enableAnalytics: boolean;
    enableMultiCurrency: boolean;
    enableMultiLanguage: boolean;
    enableGuestCheckout: boolean;
    enableWishlist: boolean;
    enableProductReviews: boolean;
    enableStoreLocator: boolean;
  };
  businessSettings: {
    defaultBusinessType: SystemMode;
    allowBusinessTypeChanges: boolean;
    maxStoresPerBusiness: number;
    maxWarehousesPerBusiness: number;
    maxMerchantsInMarketplace: number;
  };
  platformSettings: {
    platformName: string;
    platformDomain: string;
    supportEmail: string;
    defaultCurrency: string;
    defaultLanguage: string;
    timezone: string;
    commissionStructure: {
      defaultCommissionRate: number;
      commissionType: 'percentage' | 'fixed';
      tiers?: Array<{
        minRevenue: number;
        maxRevenue: number;
        rate: number;
      }>;
    };
  };
  securitySettings: {
    enableTwoFactorAuth: boolean;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
  };
  notificationSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    defaultTemplates: Record<string, boolean>;
  };
  integrationSettings: {
    paymentGateways: string[];
    shippingProviders: string[];
    analyticsProviders: string[];
    emailProviders: string[];
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class SystemConfiguration {
  private props: SystemConfigurationProps;

  private constructor(props: SystemConfigurationProps) {
    this.props = props;
  }

  static create(props: {
    configId: string;
    systemMode?: SystemMode;
    platformName: string;
    platformDomain: string;
    supportEmail: string;
    defaultCurrency?: string;
    defaultLanguage?: string;
    timezone?: string;
    metadata?: Record<string, any>;
  }): SystemConfiguration {
    const now = new Date();
    const systemMode = props.systemMode || 'single_store';

    return new SystemConfiguration({
      configId: props.configId,
      systemMode,
      features: {
        enableMarketplace: systemMode === 'marketplace',
        enableMultiStore: systemMode === 'multi_store',
        enableMultiWarehouse: systemMode !== 'single_store',
        enableProductVariants: true,
        enableInventoryManagement: true,
        enableCoupons: true,
        enableSubscriptions: false,
        enableAnalytics: true,
        enableMultiCurrency: true,
        enableMultiLanguage: true,
        enableGuestCheckout: true,
        enableWishlist: true,
        enableProductReviews: true,
        enableStoreLocator: systemMode === 'multi_store',
      },
      businessSettings: {
        defaultBusinessType: systemMode,
        allowBusinessTypeChanges: systemMode === 'marketplace',
        maxStoresPerBusiness: systemMode === 'multi_store' ? 50 : 1,
        maxWarehousesPerBusiness: systemMode !== 'single_store' ? 20 : 1,
        maxMerchantsInMarketplace: systemMode === 'marketplace' ? 10000 : 0,
      },
      platformSettings: {
        platformName: props.platformName,
        platformDomain: props.platformDomain,
        supportEmail: props.supportEmail,
        defaultCurrency: props.defaultCurrency || 'USD',
        defaultLanguage: props.defaultLanguage || 'en',
        timezone: props.timezone || 'UTC',
        commissionStructure: {
          defaultCommissionRate: systemMode === 'marketplace' ? 15 : 0,
          commissionType: 'percentage',
        },
      },
      securitySettings: {
        enableTwoFactorAuth: false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
        },
        sessionTimeout: 480, // 8 hours
        maxLoginAttempts: 5,
      },
      notificationSettings: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: false,
        defaultTemplates: {
          orderConfirmation: true,
          shippingUpdate: true,
          passwordReset: true,
          accountVerification: true,
        },
      },
      integrationSettings: {
        paymentGateways: ['stripe'],
        shippingProviders: ['fedex', 'ups', 'usps'],
        analyticsProviders: ['google_analytics'],
        emailProviders: ['sendgrid'],
      },
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: SystemConfigurationProps): SystemConfiguration {
    return new SystemConfiguration(props);
  }

  // Getters
  get configId(): string {
    return this.props.configId;
  }
  get systemMode(): SystemMode {
    return this.props.systemMode;
  }
  get features(): SystemConfigurationProps['features'] {
    return this.props.features;
  }
  get businessSettings(): SystemConfigurationProps['businessSettings'] {
    return this.props.businessSettings;
  }
  get platformSettings(): SystemConfigurationProps['platformSettings'] {
    return this.props.platformSettings;
  }
  get securitySettings(): SystemConfigurationProps['securitySettings'] {
    return this.props.securitySettings;
  }
  get notificationSettings(): SystemConfigurationProps['notificationSettings'] {
    return this.props.notificationSettings;
  }
  get integrationSettings(): SystemConfigurationProps['integrationSettings'] {
    return this.props.integrationSettings;
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

  // Computed properties
  get isMarketplace(): boolean {
    return this.props.systemMode === 'marketplace';
  }
  get isMultiStore(): boolean {
    return this.props.systemMode === 'multi_store';
  }
  get isSingleStore(): boolean {
    return this.props.systemMode === 'single_store';
  }

  // Domain methods
  changeSystemMode(newMode: SystemMode): void {
    this.props.systemMode = newMode;

    // Update features based on new mode
    this.props.features.enableMarketplace = newMode === 'marketplace';
    this.props.features.enableMultiStore = newMode === 'multi_store';
    this.props.features.enableMultiWarehouse = newMode !== 'single_store';
    this.props.features.enableStoreLocator = newMode === 'multi_store';

    // Update business settings
    this.props.businessSettings.defaultBusinessType = newMode;
    this.props.businessSettings.allowBusinessTypeChanges = newMode === 'marketplace';
    this.props.businessSettings.maxStoresPerBusiness = newMode === 'multi_store' ? 50 : 1;
    this.props.businessSettings.maxWarehousesPerBusiness = newMode !== 'single_store' ? 20 : 1;
    this.props.businessSettings.maxMerchantsInMarketplace = newMode === 'marketplace' ? 10000 : 0;

    // Update commission structure
    this.props.platformSettings.commissionStructure.defaultCommissionRate = newMode === 'marketplace' ? 15 : 0;

    this.touch();
  }

  updateFeatures(features: Partial<SystemConfigurationProps['features']>): void {
    this.props.features = { ...this.props.features, ...features };
    this.touch();
  }

  updatePlatformSettings(settings: Partial<SystemConfigurationProps['platformSettings']>): void {
    this.props.platformSettings = { ...this.props.platformSettings, ...settings };
    this.touch();
  }

  updateSecuritySettings(settings: Partial<SystemConfigurationProps['securitySettings']>): void {
    this.props.securitySettings = { ...this.props.securitySettings, ...settings };
    this.touch();
  }

  updateNotificationSettings(settings: Partial<SystemConfigurationProps['notificationSettings']>): void {
    this.props.notificationSettings = { ...this.props.notificationSettings, ...settings };
    this.touch();
  }

  updateIntegrationSettings(settings: Partial<SystemConfigurationProps['integrationSettings']>): void {
    this.props.integrationSettings = { ...this.props.integrationSettings, ...settings };
    this.touch();
  }

  updateBusinessSettings(settings: Partial<SystemConfigurationProps['businessSettings']>): void {
    this.props.businessSettings = { ...this.props.businessSettings, ...settings };
    this.touch();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      ...this.props,
      isMarketplace: this.isMarketplace,
      isMultiStore: this.isMultiStore,
      isSingleStore: this.isSingleStore,
    };
  }
}
