/**
 * Manage Product Collection Use Case
 * Creates or updates a collection and manages its collection map items
 */

import type { ProductCollection, ProductCollectionMap, ProductCollectionPort, ProductCollectionMapPort } from '../../domain/repositories/ProductCatalogPorts';
import { ProductCollectionNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';

// ============================================================================
// Command
// ============================================================================

export interface CollectionMapItem {
  productId: string;
  position?: number;
}

export class ManageProductCollectionCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly productCollectionId?: string,
    public readonly description?: string,
    public readonly imageUrl?: string,
    public readonly isActive?: boolean,
    public readonly position?: number,
    public readonly organizationId?: string,
    /** Products to add to the collection */
    public readonly addProducts?: CollectionMapItem[],
    /** productCollectionMapIds to remove from the collection */
    public readonly removeMapIds?: string[],
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ManageProductCollectionResponse {
  collection: ProductCollection;
  mapItems: ProductCollectionMap[];
}

// ============================================================================
// Use Case
// ============================================================================

export class ManageProductCollectionUseCase {
  constructor(
    private readonly productCollectionRepo: ProductCollectionPort,
    private readonly productCollectionMapRepo: ProductCollectionMapPort,
  ) {}

  async execute(command: ManageProductCollectionCommand): Promise<ManageProductCollectionResponse> {
    if (!command.name?.trim()) {
      throw new ProductValidationError('Collection name is required');
    }
    if (!command.slug?.trim()) {
      throw new ProductValidationError('Collection slug is required');
    }

    let collection: ProductCollection;

    if (command.productCollectionId) {
      // Update existing collection
      const updated = await this.productCollectionRepo.update(command.productCollectionId, {
        name: command.name,
        slug: command.slug,
        description: command.description,
        imageUrl: command.imageUrl,
        isActive: command.isActive,
        organizationId: command.organizationId,
      });
      if (!updated) {
        throw new ProductCollectionNotFoundError(command.productCollectionId);
      }
      collection = updated;
    } else {
      // Create new collection
      collection = await this.productCollectionRepo.create({
        name: command.name,
        slug: command.slug,
        description: command.description,
        imageUrl: command.imageUrl,
        isActive: command.isActive ?? true,
        organizationId: command.organizationId,
      });
    }

    // Remove map items
    if (command.removeMapIds?.length) {
      for (const mapId of command.removeMapIds) {
        await this.productCollectionMapRepo.delete(mapId);
      }
    }

    // Add new map items
    if (command.addProducts?.length) {
      for (const item of command.addProducts) {
        await this.productCollectionMapRepo.create({
          productCollectionId: collection.productCollectionId,
          productId: item.productId,
          position: item.position ?? 0,
        });
      }
    }

    const mapItems = await this.productCollectionMapRepo.findByCollection(collection.productCollectionId);

    return { collection, mapItems };
  }
}
