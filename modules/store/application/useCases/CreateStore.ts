/**
 * Create Store Use Case
 * Creates a new store that can belong to either a merchant (marketplace) or business (multi-store)
 */

import { StoreRepository } from '../../domain/repositories/StoreRepository';
import { BusinessRepository } from '../../../business/domain/repositories/BusinessRepository';
import { SystemConfigurationRepository } from '../../../configuration/domain/repositories/SystemConfigurationRepository';
import { Store } from '../../domain/entities/Store';

// ============================================================================
// Command
// ============================================================================

export class CreateStoreCommand {
  constructor(
    public readonly storeData: {
      name: string;
      slug?: string;
      description?: string;
      storeType: 'merchant_store' | 'business_store';
      merchantId?: string; // For marketplace mode
      businessId?: string; // For multi-store mode
      storeUrl?: string;
      storeEmail?: string;
      storePhone?: string;
      logo?: string;
      banner?: string;
      favicon?: string;
      primaryColor?: string;
      secondaryColor?: string;
      theme?: string;
      address?: any;
      isActive?: boolean;
      isVerified?: boolean;
      isFeatured?: boolean;
      defaultCurrency?: string;
      supportedCurrencies?: string[];
      settings?: any;
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      socialLinks?: any;
      openingHours?: any;
      customPages?: any;
      customFields?: any;
      metadata?: any;
    },
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreateStoreResponse {
  storeId: string;
  name: string;
  slug: string;
  storeType: string;
  merchantId?: string;
  businessId?: string;
  storeUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateStoreUseCase {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly systemConfigRepository: SystemConfigurationRepository,
  ) {}

  async execute(command: CreateStoreCommand): Promise<CreateStoreResponse> {
    // Validate store creation against system configuration
    const systemConfig = await this.systemConfigRepository.findActive();

    if (!systemConfig) {
      throw new Error('System configuration not found. Cannot create store.');
    }

    // Validate ownership based on store type and system mode
    await this.validateStoreOwnership(command, systemConfig);

    // Generate slug if not provided
    const slug = command.storeData.slug || this.generateSlug(command.storeData.name);

    // Check if slug is unique
    const existingStore = await this.storeRepository.findBySlug(slug);
    if (existingStore) {
      throw new Error(`Store with slug '${slug}' already exists.`);
    }

    // Check if storeUrl is unique (if provided)
    if (command.storeData.storeUrl) {
      const existingUrlStore = await this.storeRepository.findByUrl(command.storeData.storeUrl);
      if (existingUrlStore) {
        throw new Error(`Store with URL '${command.storeData.storeUrl}' already exists.`);
      }
    }

    // Create store entity
    const store = Store.create({
      storeId: this.generateStoreId(),
      name: command.storeData.name,
      storeType: command.storeData.storeType,
      merchantId: command.storeData.merchantId,
      businessId: command.storeData.businessId,
      description: command.storeData.description,
      storeUrl: command.storeData.storeUrl,
      storeEmail: command.storeData.storeEmail,
      storePhone: command.storeData.storePhone,
      address: command.storeData.address,
      logo: command.storeData.logo,
      banner: command.storeData.banner,
      favicon: command.storeData.favicon,
      primaryColor: command.storeData.primaryColor,
      secondaryColor: command.storeData.secondaryColor,
      theme: command.storeData.theme,
      defaultCurrency: command.storeData.defaultCurrency,
      supportedCurrencies: command.storeData.supportedCurrencies,
      metadata: command.storeData.metadata,
    });

    // Save store
    const savedStore = await this.storeRepository.save(store);

    return {
      storeId: savedStore.storeId,
      name: savedStore.name,
      slug: savedStore.slug,
      storeType: savedStore.storeType,
      merchantId: savedStore.merchantId,
      businessId: savedStore.businessId,
      storeUrl: savedStore.storeUrl,
      isActive: savedStore.isActive,
      isVerified: savedStore.isVerified,
      createdAt: savedStore.createdAt.toISOString(),
    };
  }

  private async validateStoreOwnership(command: CreateStoreCommand, systemConfig: any): Promise<void> {
    const { storeType, merchantId, businessId } = command.storeData;

    if (storeType === 'merchant_store') {
      // Marketplace mode: store must belong to a merchant
      if (!merchantId) {
        throw new Error('Merchant ID is required for merchant-owned stores.');
      }

      // In marketplace mode, businessId should not be provided
      if (businessId) {
        throw new Error('Business ID should not be provided for merchant-owned stores.');
      }

      // Check if merchant exists (would need merchant repository)
      // const merchant = await this.merchantRepository.findById(merchantId);
      // if (!merchant) {
      //   throw new Error('Merchant not found.');
      // }
    } else if (storeType === 'business_store') {
      // Multi-store mode: store must belong to a business
      if (!businessId) {
        throw new Error('Business ID is required for business-owned stores.');
      }

      // In multi-store mode, merchantId should not be provided
      if (merchantId) {
        throw new Error('Merchant ID should not be provided for business-owned stores.');
      }

      // Check if business exists
      const business = await this.businessRepository.findById(businessId);
      if (!business) {
        throw new Error('Business not found.');
      }

      // Check if business is active
      if (!business.isActive) {
        throw new Error('Cannot create store for inactive business.');
      }
    } else {
      throw new Error('Invalid store type. Must be either "merchant_store" or "business_store".');
    }
  }

  private generateStoreId(): string {
    return `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
