/**
 * Manage Collections Use Case
 *
 * Grouped facade for collection CRUD + membership management. Replaces
 * product's ManageProductCollection(s) use cases; adds merchandising fields,
 * smart-collection conditions, and soft deletes.
 */

import { generateUUID } from '../../../../libs/uuid';
import { eventBus } from '../../../../libs/events/eventBus';
import { Collection, type CollectionCondition, type CollectionSortOrder } from '../../domain/entities/Collection';
import { CollectionMap } from '../../domain/entities/CollectionMap';
import type {
  CollectionRepository,
  CollectionMapRepository,
  CollectionFilters,
  CollectionPublication,
} from '../../domain/repositories/AssortmentRepository';
import { assertValidConditions } from '../../domain/services/CollectionRuleEvaluator';
import {
  AssortmentEntryNotFoundError,
  CollectionNotFoundError,
  CollectionSlugAlreadyExistsError,
  CollectionValidationError,
} from '../../domain/errors/AssortmentErrors';

export interface CollectionInput {
  name?: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  isAutomated?: boolean;
  conditions?: CollectionCondition[] | null;
  sortOrder?: CollectionSortOrder;
  publishAt?: Date | string | null;
  unpublishAt?: Date | string | null;
  organizationId?: string | null;
}

export interface CollectionMapItemInput {
  productId: string;
  position?: number;
}

export class ManageCollectionsUseCase {
  constructor(
    private readonly collectionRepo: CollectionRepository,
    private readonly collectionMapRepo: CollectionMapRepository,
  ) {}

  async list(filters?: CollectionFilters): Promise<Collection[]> {
    return this.collectionRepo.findAll(filters);
  }

  async getById(assortmentCollectionId: string): Promise<Collection> {
    const collection = await this.collectionRepo.findById(assortmentCollectionId);
    if (!collection) throw new CollectionNotFoundError(assortmentCollectionId);
    return collection;
  }

  async getBySlug(slug: string): Promise<Collection> {
    const collection = await this.collectionRepo.findBySlug(slug);
    if (!collection) throw new CollectionNotFoundError(slug);
    return collection;
  }

  async listMembers(assortmentCollectionId: string): Promise<CollectionMap[]> {
    await this.getById(assortmentCollectionId);
    return this.collectionMapRepo.findByCollection(assortmentCollectionId);
  }

  async create(input: CollectionInput & { products?: CollectionMapItemInput[] }): Promise<Collection> {
    this.assertNameSlug(input.name, input.slug);
    await this.assertSlugAvailable(input.slug as string);
    if (input.isAutomated) this.assertAutomated(input.conditions);
    if (input.conditions?.length) assertValidConditions(input.conditions);

    const collection = Collection.create({
      assortmentCollectionId: generateUUID(),
      organizationId: input.organizationId ?? undefined,
      name: input.name as string,
      slug: input.slug as string,
      description: input.description ?? undefined,
      imageUrl: input.imageUrl ?? undefined,
      bannerUrl: input.bannerUrl ?? undefined,
      metaTitle: input.metaTitle ?? undefined,
      metaDescription: input.metaDescription ?? undefined,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      isAutomated: input.isAutomated,
      conditions: input.conditions ?? undefined,
      sortOrder: input.sortOrder,
      publishAt: toDate(input.publishAt),
      unpublishAt: toDate(input.unpublishAt),
    });
    const saved = await this.collectionRepo.create(collection);

    if (input.products?.length) {
      for (const item of input.products) {
        await this.addMember(saved.assortmentCollectionId, item);
      }
    }

    eventBus.emit('collection.created', {
      assortmentCollectionId: saved.assortmentCollectionId,
      organizationId: saved.organizationId,
    });
    return saved;
  }

  async update(
    assortmentCollectionId: string,
    input: CollectionInput & {
      addProducts?: CollectionMapItemInput[];
      removeMapIds?: string[];
      removeProductIds?: string[];
    },
  ): Promise<Collection> {
    const collection = await this.getById(assortmentCollectionId);

    if (input.slug && input.slug !== collection.slug) {
      await this.assertSlugAvailable(input.slug);
    }
    const nextAutomated = input.isAutomated ?? collection.isAutomated;
    const nextConditions = input.conditions !== undefined ? input.conditions : collection.conditions;
    if (nextAutomated) this.assertAutomated(nextConditions);
    if (nextConditions?.length) assertValidConditions(nextConditions);

    collection.update({
      ...input,
      publishAt: input.publishAt === undefined ? undefined : toDate(input.publishAt),
      unpublishAt: input.unpublishAt === undefined ? undefined : toDate(input.unpublishAt),
    });
    const saved = await this.collectionRepo.update(collection);
    if (!saved) throw new CollectionNotFoundError(assortmentCollectionId);

    for (const mapId of input.removeMapIds ?? []) {
      await this.collectionMapRepo.delete(mapId);
    }
    for (const productId of input.removeProductIds ?? []) {
      await this.collectionMapRepo.deleteByProduct(assortmentCollectionId, productId);
    }
    for (const item of input.addProducts ?? []) {
      await this.addMember(assortmentCollectionId, item);
    }

    eventBus.emit('collection.updated', { assortmentCollectionId });
    return saved;
  }

  async delete(assortmentCollectionId: string): Promise<void> {
    await this.getById(assortmentCollectionId);
    await this.collectionRepo.delete(assortmentCollectionId);
    eventBus.emit('collection.deleted', { assortmentCollectionId });
  }

  async listPublications(assortmentCollectionId: string): Promise<CollectionPublication[]> {
    await this.getById(assortmentCollectionId);
    return this.collectionRepo.listPublications(assortmentCollectionId);
  }

  async setPublication(
    assortmentCollectionId: string,
    input: { storeId?: string; channelId?: string; sortOrder?: number },
  ): Promise<CollectionPublication> {
    await this.getById(assortmentCollectionId);
    if (input.sortOrder !== undefined && (!Number.isInteger(input.sortOrder) || input.sortOrder < 0)) {
      throw new CollectionValidationError('sortOrder must be a non-negative integer');
    }
    return this.collectionRepo.upsertPublication({ assortmentCollectionId, ...input });
  }

  async deletePublication(assortmentCollectionId: string, assortmentCollectionPublicationId: string): Promise<void> {
    await this.getById(assortmentCollectionId);
    const removed = await this.collectionRepo.deletePublication(assortmentCollectionPublicationId);
    if (!removed) throw new AssortmentEntryNotFoundError(assortmentCollectionPublicationId);
  }

  private async addMember(assortmentCollectionId: string, item: CollectionMapItemInput): Promise<CollectionMap> {
    const existing = await this.collectionMapRepo.findByProduct(assortmentCollectionId, item.productId);
    if (existing) return existing;
    return this.collectionMapRepo.create(
      CollectionMap.create({
        assortmentCollectionMapId: generateUUID(),
        assortmentCollectionId,
        productId: item.productId,
        position: item.position,
      }),
    );
  }

  private assertNameSlug(name?: string, slug?: string): void {
    if (!name?.trim()) throw new CollectionValidationError('Collection name is required');
    if (!slug?.trim()) throw new CollectionValidationError('Collection slug is required');
  }

  private assertAutomated(conditions?: CollectionCondition[] | null): void {
    if (!conditions?.length) {
      throw new CollectionValidationError('Automated collections require at least one condition');
    }
  }

  private async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.collectionRepo.findBySlug(slug);
    if (existing) throw new CollectionSlugAlreadyExistsError(slug);
  }
}

function toDate(value?: Date | string | null): Date | undefined {
  if (value === undefined || value === null) return undefined;
  return value instanceof Date ? value : new Date(value);
}
