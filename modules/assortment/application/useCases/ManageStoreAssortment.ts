/**
 * Manage Store Assortment Use Case
 *
 * Grouped facade for a store's assortment config (mode) and its
 * include/exclude entries. A missing StoreAssortment row means mode 'all'.
 */

import { generateUUID } from '../../../../libs/uuid';
import { eventBus } from '../../../../libs/events/eventBus';
import { StoreAssortment, type AssortmentMode } from '../../domain/entities/StoreAssortment';
import { StoreAssortmentEntry, type AssortmentTargetType, type AssortmentEffect } from '../../domain/entities/StoreAssortmentEntry';
import type { StoreAssortmentRepository } from '../../domain/repositories/AssortmentRepository';
import type { StoreLookupPort } from '../ports/StoreLookupPort';
import {
  AssortmentEntryNotFoundError,
  CollectionValidationError,
  StoreAssortmentNotFoundError,
} from '../../domain/errors/AssortmentErrors';

const VALID_MODES: AssortmentMode[] = ['all', 'include', 'exclude'];
const VALID_TARGET_TYPES: AssortmentTargetType[] = ['product', 'collection', 'category'];
const VALID_EFFECTS: AssortmentEffect[] = ['include', 'exclude'];

export interface StoreAssortmentConfig {
  assortment: StoreAssortment;
  entries: StoreAssortmentEntry[];
}

export class ManageStoreAssortmentUseCase {
  constructor(
    private readonly assortmentStoreRepo: StoreAssortmentRepository,
    private readonly storeLookup: StoreLookupPort,
  ) {}

  async getConfig(storeId: string): Promise<StoreAssortmentConfig> {
    const assortment = (await this.assortmentStoreRepo.findByStoreId(storeId)) ?? StoreAssortment.create(storeId, 'all');
    const entries = await this.assortmentStoreRepo.findEntriesByStoreId(storeId);
    return { assortment, entries };
  }

  async setMode(storeId: string, mode: AssortmentMode): Promise<StoreAssortment> {
    await this.assertStore(storeId);
    if (!VALID_MODES.includes(mode)) {
      throw new CollectionValidationError(`Invalid assortment mode: ${mode}`);
    }
    const existing = await this.assortmentStoreRepo.findByStoreId(storeId);
    const assortment = existing ?? StoreAssortment.create(storeId, mode);
    if (existing) assortment.setMode(mode);
    const saved = await this.assortmentStoreRepo.upsert(assortment);
    eventBus.emit('assortment.updated', { storeId, mode: saved.mode });
    return saved;
  }

  async addEntry(
    storeId: string,
    input: {
      targetType: AssortmentTargetType;
      targetId: string;
      effect: AssortmentEffect;
      channelId?: string;
      position?: number;
      isHidden?: boolean;
    },
  ): Promise<StoreAssortmentEntry> {
    await this.assertStore(storeId);
    if (!VALID_TARGET_TYPES.includes(input.targetType)) {
      throw new CollectionValidationError(`Invalid assortment targetType: ${input.targetType}`);
    }
    if (!VALID_EFFECTS.includes(input.effect)) {
      throw new CollectionValidationError(`Invalid assortment effect: ${input.effect}`);
    }
    if (!input.targetId) {
      throw new CollectionValidationError('targetId is required');
    }

    const entry = StoreAssortmentEntry.create({
      assortmentStoreEntryId: generateUUID(),
      storeId,
      channelId: input.channelId,
      targetType: input.targetType,
      targetId: input.targetId,
      effect: input.effect,
      position: input.position,
      isHidden: input.isHidden,
    });
    const saved = await this.assortmentStoreRepo.createEntry(entry);
    eventBus.emit('assortment.updated', { storeId, entryId: saved.assortmentStoreEntryId });
    return saved;
  }

  async removeEntry(assortmentStoreEntryId: string): Promise<void> {
    const deleted = await this.assortmentStoreRepo.deleteEntry(assortmentStoreEntryId);
    if (!deleted) throw new AssortmentEntryNotFoundError(assortmentStoreEntryId);
    eventBus.emit('assortment.updated', { entryId: assortmentStoreEntryId });
  }

  private async assertStore(storeId: string): Promise<void> {
    if (!(await this.storeLookup.storeExists(storeId))) {
      throw new StoreAssortmentNotFoundError(storeId);
    }
  }
}
