/**
 * Business Entity
 * Represents a top-level organization that can operate in different modes:
 * - Marketplace: Owns merchants who sell through the platform
 * - Multi-Store: Directly owns stores with shared inventory and branding
 */

export type BusinessType = 'marketplace' | 'multi_store' | 'single_store';

export interface BusinessProps {
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  businessType: BusinessType;
  domain?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive: boolean;
  settings: {
    allowMultipleStores: boolean;
    allowMultipleWarehouses: boolean;
    enableMarketplace: boolean;
    defaultCurrency: string;
    defaultLanguage: string;
    timezone: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Business {
  private props: BusinessProps;

  private constructor(props: BusinessProps) {
    this.props = props;
  }

  static create(props: {
    businessId: string;
    name: string;
    businessType?: BusinessType;
    description?: string;
    domain?: string;
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
    defaultCurrency?: string;
    defaultLanguage?: string;
    timezone?: string;
    metadata?: Record<string, any>;
  }): Business {
    const now = new Date();
    return new Business({
      businessId: props.businessId,
      name: props.name,
      slug: Business.generateSlug(props.name),
      description: props.description,
      businessType: props.businessType || 'single_store',
      domain: props.domain,
      logo: props.logo,
      favicon: props.favicon,
      primaryColor: props.primaryColor || '#007bff',
      secondaryColor: props.secondaryColor || '#6c757d',
      isActive: true,
      settings: {
        allowMultipleStores: props.businessType === 'multi_store',
        allowMultipleWarehouses: props.businessType !== 'single_store',
        enableMarketplace: props.businessType === 'marketplace',
        defaultCurrency: props.defaultCurrency || 'USD',
        defaultLanguage: props.defaultLanguage || 'en',
        timezone: props.timezone || 'UTC'
      },
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: BusinessProps): Business {
    return new Business(props);
  }

  // Getters
  get businessId(): string { return this.props.businessId; }
  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get description(): string | undefined { return this.props.description; }
  get businessType(): BusinessType { return this.props.businessType; }
  get domain(): string | undefined { return this.props.domain; }
  get logo(): string | undefined { return this.props.logo; }
  get favicon(): string | undefined { return this.props.favicon; }
  get primaryColor(): string | undefined { return this.props.primaryColor; }
  get secondaryColor(): string | undefined { return this.props.secondaryColor; }
  get isActive(): boolean { return this.props.isActive; }
  get settings(): BusinessProps['settings'] { return this.props.settings; }
  get metadata(): Record<string, any> | undefined { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Computed properties
  get isMarketplace(): boolean { return this.props.businessType === 'marketplace'; }
  get isMultiStore(): boolean { return this.props.businessType === 'multi_store'; }
  get isSingleStore(): boolean { return this.props.businessType === 'single_store'; }

  // Domain methods
  updateBasicInfo(updates: {
    name?: string;
    description?: string;
    domain?: string;
  }): void {
    if (updates.name) {
      this.props.name = updates.name;
      this.props.slug = Business.generateSlug(updates.name);
    }
    if (updates.description !== undefined) this.props.description = updates.description;
    if (updates.domain !== undefined) this.props.domain = updates.domain;
    this.touch();
  }

  updateBranding(branding: {
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }): void {
    if (branding.logo !== undefined) this.props.logo = branding.logo;
    if (branding.favicon !== undefined) this.props.favicon = branding.favicon;
    if (branding.primaryColor !== undefined) this.props.primaryColor = branding.primaryColor;
    if (branding.secondaryColor !== undefined) this.props.secondaryColor = branding.secondaryColor;
    this.touch();
  }

  changeBusinessType(newType: BusinessType): void {
    this.props.businessType = newType;
    // Update settings based on business type
    this.props.settings = {
      ...this.props.settings,
      allowMultipleStores: newType === 'multi_store',
      allowMultipleWarehouses: newType !== 'single_store',
      enableMarketplace: newType === 'marketplace'
    };
    this.touch();
  }

  updateSettings(settings: Partial<BusinessProps['settings']>): void {
    this.props.settings = { ...this.props.settings, ...settings };
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
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
      businessId: this.props.businessId,
      name: this.props.name,
      slug: this.props.slug,
      description: this.props.description,
      businessType: this.props.businessType,
      domain: this.props.domain,
      logo: this.props.logo,
      favicon: this.props.favicon,
      primaryColor: this.props.primaryColor,
      secondaryColor: this.props.secondaryColor,
      isActive: this.props.isActive,
      settings: this.props.settings,
      metadata: this.props.metadata,
      isMarketplace: this.isMarketplace,
      isMultiStore: this.isMultiStore,
      isSingleStore: this.isSingleStore,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }
}
