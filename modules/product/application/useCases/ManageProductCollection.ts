/**
 * Manage Product Collection Use Case
 * Creates or updates a collection and manages its collection map items
 */

import productCollectionRepo from '../../infrastructure/repositories/productCollectionRepo';
import productCollectionMapRepo from '../../infrastructure/repositories/productCollectionMapRepo';
import type { ProductCollection } from '../../infrastructure/repositories/productCollectionRepo';
import type { ProductCollectionMap } from '../../infrastructure/repositories/productCollectionMapRepo';

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
    public readonly merchantId?: string,
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
  async execute(command: ManageProductCollectionCommand): Promise<ManageProductCollectionResponse> {
    if (!command.name?.trim()) {
      throw new Error('Collection name is required');
    }
    if (!command.slug?.trim()) {
      throw new Error('Collection slug is required');
    }

    let collection: ProductCollection;

    if (command.productCollectionId) {
      // Update existing collection
      const updated = await productCollectionRepo.update(command.productCollectionId, {
        name: command.name,
        slug: command.slug,
        description: command.description,
        imageUrl: command.imageUrl,
        isActive: command.isActive,
        position: command.position,
        merchantId: command.merchantId,
      });
      if (!updated) {
        throw new Error(`Collection not found: ${command.productCollectionId}`);
      }
      collection = updated;
    } else {
      // Create new collection
      collection = await productCollectionRepo.create({
        name: command.name,
        slug: command.slug,
        description: command.description,
        imageUrl: command.imageUrl,
        isActive: command.isActive ?? true,
        position: command.position ?? 0,
        merchantId: command.merchantId,
      });
    }

    // Remove map items
    if (command.removeMapIds?.length) {
      for (const mapId of command.removeMapIds) {
        await productCollectionMapRepo.delete(mapId);
      }
    }

    // Add new map items
    if (command.addProducts?.length) {
      for (const item of command.addProducts) {
        await productCollectionMapRepo.create({
          productCollectionId: collection.productCollectionId,
          productId: item.productId,
          position: item.position ?? 0,
        });
      }
    }

    const mapItems = await productCollectionMapRepo.findByCollection(collection.productCollectionId);

    return { collection, mapItems };
  }
}
