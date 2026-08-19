/**
 * Create Store Use Case
 * Creates a new store that can belong to either a merchant (marketplace) or organization (multi-store)
 */

import { StoreRepository } from '../../domain/repositories/StoreRepository';
import organizationRepo from '../../../organization/infrastructure/repositories/organizationRepo';
import { SystemConfigurationRepository } from '../../../configuration/domain/repositories/SystemConfigurationRepository';
import { Store, type StoreProps } from '../../domain/entities/Store';

// ============================================================================
// Command
// ============================================================================

export class CreateStoreCommand {
  constructor(
    public readonly storeData: {
      name: string;
      slug?: string;
      description?: string;
      storeType: 'merchant_store' | 'organization_store';
      organizationId?: string;
      isHeadquarters?: boolean;
      parentStoreId?: string;
      storeUrl?: string;
      storeEmail?: string;
      storePhone?: string;
      logo?: string;
      banner?: string;
      favicon?: string;
      primaryColor?: string;
      secondaryColor?: string;
      theme?: string;
      address?: unknown;
      isActive?: boolean;
      isVerified?: boolean;
      isFeatured?: boolean;
      defaultCurrency?: string;
      supportedCurrencies?: string[];
      settings?: unknown;
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      socialLinks?: unknown;
      openingHours?: unknown;
      customPages?: unknown;
      customFields?: unknown;
      metadata?: unknown;
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
  organizationId?: string;
  isHeadquarters: boolean;
  parentStoreId?: string;
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
    private readonly systemConfigRepository: SystemConfigurationRepository,
  ) {}

  async execute(command: CreateStoreCommand): Promise<CreateStoreResponse> {
    if (!command.storeData.name) {
      throw new Error('Store name not found.');
    }
    if (!command.storeData.slug) {
      throw new Error('Store slug not found.');
    }

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
      organizationId: command.storeData.organizationId,
      isHeadquarters: command.storeData.isHeadquarters,
      parentStoreId: command.storeData.parentStoreId,
      description: command.storeData.description,
      storeUrl: command.storeData.storeUrl,
      storeEmail: command.storeData.storeEmail,
      storePhone: command.storeData.storePhone,
      address: command.storeData.address as StoreProps['address'],
      logo: command.storeData.logo,
      banner: command.storeData.banner,
      favicon: command.storeData.favicon,
      primaryColor: command.storeData.primaryColor,
      secondaryColor: command.storeData.secondaryColor,
      theme: command.storeData.theme,
      defaultCurrency: command.storeData.defaultCurrency,
      supportedCurrencies: command.storeData.supportedCurrencies,
      metadata: command.storeData.metadata as Record<string, unknown> | undefined,
    });

    // Save store
    const savedStore = await this.storeRepository.save(store);

    return {
      storeId: savedStore.storeId,
      name: savedStore.name,
      slug: savedStore.slug,
      storeType: savedStore.storeType,
      organizationId: savedStore.organizationId,
      isHeadquarters: savedStore.isHeadquarters,
      parentStoreId: savedStore.parentStoreId,
      storeUrl: savedStore.storeUrl,
      isActive: savedStore.isActive,
      isVerified: savedStore.isVerified,
      createdAt: savedStore.createdAt.toISOString(),
    };
  }

  private async validateStoreOwnership(command: CreateStoreCommand, _systemConfig: unknown): Promise<void> {
    const { storeType, organizationId, isHeadquarters, parentStoreId } = command.storeData;

    if (storeType === 'merchant_store') {
      if (!organizationId) {
        throw new Error('Organization ID is required for merchant-owned stores.');
      }
    } else if (storeType === 'organization_store') {
      if (!organizationId) {
        throw new Error('Organization ID is required for organization-owned stores.');
      }

      // Check if organization exists
      const organization = await organizationRepo.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found.');
      }

      if (isHeadquarters && parentStoreId) {
        throw new Error('Headquarters store cannot have a parent store.');
      }

      if (parentStoreId) {
        const parentStore = await this.storeRepository.findById(parentStoreId);
        if (!parentStore) {
          throw new Error('Parent store not found.');
        }
        if (parentStore.organizationId !== organizationId) {
          throw new Error('Parent store must belong to the same organization.');
        }
      }
    } else {
      throw new Error('Invalid store type. Must be either "merchant_store" or "organization_store".');
    }
  }

  private generateStoreId(): string {
    return crypto.randomUUID();
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
