/**
 * Update Store Use Case
 * Updates an existing store's details
 */

import { StoreRepository } from '../../domain/repositories/StoreRepository';
import { StoreCurrencyRepository } from '../../domain/repositories/StoreCurrencyRepository';
import { Store, type StoreProps } from '../../domain/entities/Store';
import { StoreNotFoundError, StoreSlugAlreadyExistsError, StoreValidationError } from '../../domain/errors/StoreErrors';
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
    },
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

type StoreUpdates = UpdateStoreCommand['updates'];

// ============================================================================
// Use Case
// ============================================================================

export class UpdateStoreUseCase {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeCurrencyRepository?: StoreCurrencyRepository,
  ) {}

  async execute(command: UpdateStoreCommand): Promise<UpdateStoreResponse> {
    // Find existing store
    const store = await this.storeRepository.findById(command.storeId);
    if (!store) {
      throw new StoreNotFoundError(command.storeId);
    }

    await this.assertUniqueIdentifiers(store, command);

    // Update the store using specific update methods
    const updates = command.updates;
    this.applyBasicInfo(store, updates);
    this.applyBranding(store, updates);
    this.applyProfileFields(store, updates);
    await this.applyCurrencies(store, updates);
    this.applyStatus(store, updates);

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

  private async assertUniqueIdentifiers(store: Store, command: UpdateStoreCommand): Promise<void> {
    // Check slug uniqueness if being updated
    if (command.updates.slug && command.updates.slug !== store.slug) {
      const existingStore = await this.storeRepository.findBySlug(command.updates.slug);
      if (existingStore && existingStore.storeId !== command.storeId) {
        throw new StoreSlugAlreadyExistsError(command.updates.slug);
      }
    }

    // Check storeUrl uniqueness if being updated
    if (command.updates.storeUrl && command.updates.storeUrl !== store.storeUrl) {
      const existingStore = await this.storeRepository.findByUrl(command.updates.storeUrl);
      if (existingStore && existingStore.storeId !== command.storeId) {
        throw new StoreValidationError(`Store with URL '${command.updates.storeUrl}' already exists.`);
      }
    }
  }

  private applyBasicInfo(store: Store, updates: StoreUpdates): void {
    if (!updates.name && !updates.description && !updates.storeUrl && !updates.storeEmail && !updates.storePhone) return;
    store.updateBasicInfo({
      name: updates.name,
      description: updates.description,
      storeUrl: updates.storeUrl,
      storeEmail: updates.storeEmail,
      storePhone: updates.storePhone,
    });
  }

  private applyBranding(store: Store, updates: StoreUpdates): void {
    if (!updates.logo && !updates.banner && !updates.favicon && !updates.primaryColor && !updates.secondaryColor && !updates.theme) {
      return;
    }
    store.updateBranding({
      logo: updates.logo,
      banner: updates.banner,
      favicon: updates.favicon,
      primaryColor: updates.primaryColor,
      secondaryColor: updates.secondaryColor,
      theme: updates.theme,
    });
  }

  private applyProfileFields(store: Store, updates: StoreUpdates): void {
    // Address updates
    if (updates.address) {
      store.updateAddress(updates.address as StoreProps['address'] | undefined);
    }

    // SEO updates
    if (updates.metaTitle || updates.metaDescription || updates.metaKeywords) {
      store.updateSEO({
        metaTitle: updates.metaTitle,
        metaDescription: updates.metaDescription,
        metaKeywords: updates.metaKeywords,
      });
    }

    // Settings updates
    if (updates.settings) {
      store.updateSettings(updates.settings as Partial<StoreProps['settings']> | undefined);
    }

    // Social links
    if (updates.socialLinks) {
      store.updateSocialLinks(updates.socialLinks as Record<string, string>);
    }

    // Opening hours
    if (updates.openingHours) {
      store.setOpeningHours(updates.openingHours);
    }
  }

  // Currency updates — supported currencies live in the `storeCurrency`
  // membership table, not on the store row itself.
  private async applyCurrencies(store: Store, updates: StoreUpdates): Promise<void> {
    if ((!updates.supportedCurrencies && !updates.defaultCurrency) || !this.storeCurrencyRepository) return;
    const supportedCurrencies = updates.supportedCurrencies ?? (await this.storeCurrencyRepository.getSupportedCodes(store.storeId));
    const defaultCurrency =
      updates.defaultCurrency ?? (await this.storeCurrencyRepository.getDefaultCode(store.storeId)) ?? supportedCurrencies[0];
    await this.storeCurrencyRepository.replaceAll(store.storeId, supportedCurrencies, defaultCurrency);
  }

  private applyStatus(store: Store, updates: StoreUpdates): void {
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
  }
}
