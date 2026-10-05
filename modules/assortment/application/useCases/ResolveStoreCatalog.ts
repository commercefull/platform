/**
 * Resolve Store Catalog Use Case
 *
 * Returns the effective product set a store sells, per its StoreAssortment:
 * - `all`/`exclude` — full catalog minus exclude entries and hidden products
 * - `include` — union of included products/collections/categories, minus
 *   exclude entries and hidden products
 *
 * Consumed by the storefront, search indexing, and agentic-checkout feeds.
 */

import type { StoreAssortmentRepository } from '../../domain/repositories/AssortmentRepository';
import type { CatalogQueryPort, CatalogProductRef } from '../ports/CatalogQueryPort';
import type { ResolveCollectionProductsUseCase } from './ResolveCollectionProducts';
import type { StoreLookupPort } from '../ports/StoreLookupPort';
import type { AssortmentMode } from '../../domain/entities/StoreAssortment';
import type { StoreAssortmentEntry } from '../../domain/entities/StoreAssortmentEntry';
import { StoreAssortmentNotFoundError } from '../../domain/errors/AssortmentErrors';
import { expandAssortmentTarget } from './assortmentExpansion';

const RESOLVE_PAGE = 500;
const MAX_PAGES = 20;

export class ResolveStoreCatalogCommand {
  constructor(
    public readonly storeId: string,
    public readonly limit: number = 100,
    public readonly offset: number = 0,
    /** When set, channel-scoped entries apply only to this sales channel. */
    public readonly channelId?: string,
  ) {}
}

export interface ResolveStoreCatalogResponse {
  storeId: string;
  mode: AssortmentMode;
  products: CatalogProductRef[];
  total: number;
}

/**
 * Compact filter form of a store's sellable set — lets catalog queries
 * constrain by id lists instead of hydrating the whole catalog.
 * `includeProductIds` set means "only these"; `excludeProductIds` means
 * "everything except these". `null` means unconstrained.
 */
export interface AssortmentFilter {
  includeProductIds?: string[];
  excludeProductIds?: string[];
}

export class ResolveStoreCatalogUseCase {
  constructor(
    private readonly assortmentStoreRepo: StoreAssortmentRepository,
    private readonly resolveCollectionProducts: ResolveCollectionProductsUseCase,
    private readonly catalog: CatalogQueryPort,
    private readonly storeLookup: StoreLookupPort,
  ) {}

  async execute(command: ResolveStoreCatalogCommand): Promise<ResolveStoreCatalogResponse> {
    if (!(await this.storeLookup.storeExists(command.storeId))) {
      throw new StoreAssortmentNotFoundError(command.storeId);
    }

    const assortment = await this.assortmentStoreRepo.findByStoreId(command.storeId);
    const mode = assortment?.mode ?? 'all';
    // Entries with no channel apply to every channel; channel-scoped entries
    // apply only when resolving that channel's catalog.
    const entries = (await this.assortmentStoreRepo.findEntriesByStoreId(command.storeId)).filter(
      (e: StoreAssortmentEntry) => !e.channelId || e.channelId === command.channelId,
    );

    const excludedIds = new Set<string>();
    const hiddenIds = new Set<string>();
    for (const e of entries.filter(e => e.effect === 'exclude' || e.isHidden)) {
      for (const id of await this.expandTarget(e.targetType, e.targetId)) {
        if (e.effect === 'exclude') excludedIds.add(id);
        if (e.isHidden) hiddenIds.add(id);
      }
    }
    const blocked = new Set([...excludedIds, ...hiddenIds]);

    if (mode === 'include') {
      const includedIds = new Set<string>();
      for (const e of entries.filter(e => e.effect === 'include')) {
        for (const id of await this.expandTarget(e.targetType, e.targetId)) {
          if (!blocked.has(id)) includedIds.add(id);
        }
      }
      const products = [...includedIds].length ? await this.catalog.findProductsByIds([...includedIds]) : [];
      return {
        storeId: command.storeId,
        mode,
        products: products.slice(command.offset, command.offset + command.limit),
        total: products.length,
      };
    }

    // 'all' / 'exclude': page the catalog, dropping blocked ids. `total` is the
    // pre-filter catalog count minus the number of blocked ids present in it.
    const products: CatalogProductRef[] = [];
    let total = 0;
    let catalogOffset = 0;
    const targetEnd = command.offset + command.limit;

    for (let page = 0; page < MAX_PAGES && products.length < targetEnd; page++) {
      const chunk = await this.catalog.searchProducts({}, RESOLVE_PAGE, catalogOffset);
      total = chunk.total;
      for (const p of chunk.products) {
        if (!blocked.has(p.productId)) products.push(p);
      }
      if (chunk.products.length < RESOLVE_PAGE) break;
      catalogOffset += RESOLVE_PAGE;
    }

    return {
      storeId: command.storeId,
      mode,
      products: products.slice(command.offset, command.offset + command.limit),
      total: Math.max(total - blocked.size, 0),
    };
  }

  /**
   * Resolve the store/channel sellable constraint in filter form.
   * Returns null when the assortment does not constrain the catalog at all.
   */
  async resolveAssortmentFilter(storeId: string, channelId?: string): Promise<AssortmentFilter | null> {
    const assortment = await this.assortmentStoreRepo.findByStoreId(storeId);
    const mode = assortment?.mode ?? 'all';
    const entries = (await this.assortmentStoreRepo.findEntriesByStoreId(storeId)).filter(
      (e: StoreAssortmentEntry) => !e.channelId || e.channelId === channelId,
    );

    const excludedIds = new Set<string>();
    const hiddenIds = new Set<string>();
    for (const e of entries.filter(e => e.effect === 'exclude' || e.isHidden)) {
      for (const id of await this.expandTarget(e.targetType, e.targetId)) {
        if (e.effect === 'exclude') excludedIds.add(id);
        if (e.isHidden) hiddenIds.add(id);
      }
    }
    const blocked = new Set([...excludedIds, ...hiddenIds]);

    if (mode === 'include') {
      const includedIds = new Set<string>();
      for (const e of entries.filter(e => e.effect === 'include')) {
        for (const id of await this.expandTarget(e.targetType, e.targetId)) {
          if (!blocked.has(id)) includedIds.add(id);
        }
      }
      return { includeProductIds: [...includedIds] };
    }

    if (blocked.size === 0) return null;
    return { excludeProductIds: [...blocked] };
  }

  private async expandTarget(targetType: string, targetId: string): Promise<string[]> {
    return expandAssortmentTarget(
      { resolveCollectionProducts: this.resolveCollectionProducts, catalog: this.catalog },
      targetType,
      targetId,
    );
  }
}
