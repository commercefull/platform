/**
 * Update Store Use Case
 * Updates an existing store's details
 */

import { StoreRepository } from '../../domain/repositories/StoreRepository';
import { Store } from '../../domain/entities/Store';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class UpdateStoreCommand {
  constructor(
    public readonly storeId: string,
    public readonly updates: {
      name?: string;
      slug?: string;
      description?: string;
      storeUrl?: string;
      storeEmail?: string;
      storePhone?: string;
      logo?: string;
      banner?: string;
      favicon?: string;
      primaryColor?: string;
      secondaryColor?: string;
      theme?: string;
      address?: Record<string, unknown>;
      isActive?: boolean;
      isFeatured?: boolean;
      defaultCurrency?: string;
      supportedCurrencies?: string[];
      settings?: Record<string, unknown>;
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      socialLinks?: Record<string, unknown>;
      openingHours?: Record<string, unknown>;
      customPages?: Record<string, unknown>;
      customFields?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UpdateStoreResponse {
  storeId: string;
  name: string;
  slug: string;
  storeType: string;
  isActive: boolean;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdateStoreUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(command: UpdateStoreCommand): Promise<UpdateStoreResponse> {
    // Find existing store
    const store = await this.storeRepository.findById(command.storeId);
    if (!store) {
      throw new Error(`Store not found: ${command.storeId}`);
    }

    // Check slug uniqueness if being updated
    if (command.updates.slug && command.updates.slug !== store.slug) {
      const existingStore = await this.storeRepository.findBySlug(command.updates.slug);
      if (existingStore && existingStore.storeId !== command.storeId) {
        throw new Error(`Store with slug '${command.updates.slug}' already exists.`);
      }
    }

    // Check storeUrl uniqueness if being updated
    if (command.updates.storeUrl && command.updates.storeUrl !== store.storeUrl) {
      const existingStore = await this.storeRepository.findByUrl(command.updates.storeUrl);
      if (existingStore && existingStore.storeId !== command.storeId) {
        throw new Error(`Store with URL '${command.updates.storeUrl}' already exists.`);
      }
    }

    // Update the store using specific update methods
    const updates = command.updates;

    // Basic info updates
    if (updates.name || updates.description || updates.storeUrl || updates.storeEmail || updates.storePhone) {
      store.updateBasicInfo({
        name: updates.name,
        description: updates.description,
        storeUrl: updates.storeUrl,
        storeEmail: updates.storeEmail,
        storePhone: updates.storePhone,
      });
    }

    // Branding updates
    if (updates.logo || updates.banner || updates.favicon || updates.primaryColor || updates.secondaryColor || updates.theme) {
      store.updateBranding({
        logo: updates.logo,
        banner: updates.banner,
        favicon: updates.favicon,
        primaryColor: updates.primaryColor,
        secondaryColor: updates.secondaryColor,
        theme: updates.theme,
      });
    }

    // Address updates
    if (updates.address) {
      store.updateAddress(updates.address as any);
    }

    // SEO updates
    if (updates.metaTitle || updates.metaDescription || updates.metaKeywords) {
      store.updateSEO({
        metaTitle: updates.metaTitle,
        metaDescription: updates.metaDescription,
        metaKeywords: updates.metaKeywords,
      });
    }

    // Currency updates
    if (updates.supportedCurrencies || updates.defaultCurrency) {
      store.updateCurrencies(
        updates.supportedCurrencies || store.supportedCurrencies || [],
        updates.defaultCurrency
      );
    }

    // Settings updates
    if (updates.settings) {
      store.updateSettings(updates.settings as any);
    }

    // Social links
    if (updates.socialLinks) {
      store.updateSocialLinks(updates.socialLinks as Record<string, string>);
    }

    // Opening hours
    if (updates.openingHours) {
      store.setOpeningHours(updates.openingHours);
    }

    // Status updates
    if (updates.isActive !== undefined) {
      if (updates.isActive) {
        store.activate();
      } else {
        store.deactivate();
      }
    }

    if (updates.isFeatured !== undefined) {
      if (updates.isFeatured) {
        store.feature();
      } else {
        store.unfeature();
      }
    }

    // Save
    const updatedStore = await this.storeRepository.save(store);

    // Emit event
    eventBus.emit('store.updated', {
      storeId: updatedStore.storeId,
      changes: Object.keys(command.updates),
    });

    return {
      storeId: updatedStore.storeId,
      name: updatedStore.name,
      slug: updatedStore.slug,
      storeType: updatedStore.storeType,
      isActive: updatedStore.isActive,
      updatedAt: updatedStore.updatedAt.toISOString(),
    };
  }
}
