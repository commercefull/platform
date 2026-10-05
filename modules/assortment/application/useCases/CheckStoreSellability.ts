/**
 * Check Store Sellability Use Case
 *
 * Answers whether a single product is sellable on a store (and optional
 * sales channel) according to its assortment configuration:
 * - missing assortment row behaves like `mode: 'all'` — sellable
 * - `all`/`exclude` — sellable unless excluded or hidden
 * - `include` — sellable only when included and not excluded/hidden
 *
 * Channel-scoped entries apply only when `channelId` matches; entries
 * without a channel apply to every channel of the store.
 */

import type { StoreAssortmentRepository } from '../../domain/repositories/AssortmentRepository';
import type { CatalogQueryPort } from '../ports/CatalogQueryPort';
import type { ResolveCollectionProductsUseCase } from './ResolveCollectionProducts';
import type { StoreAssortmentEntry } from '../../domain/entities/StoreAssortmentEntry';
import { expandAssortmentTarget } from './assortmentExpansion';

export class CheckStoreSellabilityCommand {
  constructor(
    public readonly storeId: string,
    public readonly productId: string,
    public readonly channelId?: string,
  ) {}
}

export class CheckStoreSellabilityUseCase {
  constructor(
    private readonly assortmentStoreRepo: StoreAssortmentRepository,
    private readonly resolveCollectionProducts: Pick<ResolveCollectionProductsUseCase, 'execute'>,
    private readonly catalog: Pick<CatalogQueryPort, 'searchProducts'>,
  ) {}

  async execute(command: CheckStoreSellabilityCommand): Promise<boolean> {
    const assortment = await this.assortmentStoreRepo.findByStoreId(command.storeId);
    const entries = (await this.assortmentStoreRepo.findEntriesByStoreId(command.storeId)).filter(
      (e: StoreAssortmentEntry) => !e.channelId || e.channelId === command.channelId,
    );

    const deps = { resolveCollectionProducts: this.resolveCollectionProducts, catalog: this.catalog };

    const blocked = new Set<string>();
    for (const e of entries.filter(e => e.effect === 'exclude' || e.isHidden)) {
      for (const id of await expandAssortmentTarget(deps, e.targetType, e.targetId)) {
        blocked.add(id);
      }
    }
    if (blocked.has(command.productId)) return false;

    if (!assortment || assortment.mode !== 'include') {
      return true;
    }

    for (const e of entries.filter(e => e.effect === 'include')) {
      const ids = await expandAssortmentTarget(deps, e.targetType, e.targetId);
      if (ids.includes(command.productId)) return true;
    }
    return false;
  }
}
