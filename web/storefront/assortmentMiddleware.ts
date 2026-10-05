/**
 * Assortment Middleware
 *
 * Resolves the current store/channel assortment into a compact product-id
 * filter (`res.locals.assortmentFilter`) so storefront catalog handlers can
 * constrain PLP/search/PDP to sellable products without importing the
 * assortment module (web → modules is the only allowed direction).
 *
 * Fails open: when the store has no assortment configured or resolution
 * errors, `assortmentFilter` stays null and the catalog is unconstrained.
 * Add-to-basket still enforces sellability server-side via SellabilityPort.
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { resolveStoreCatalogUseCase } from '../../modules/assortment';
import { logger } from '../../libs/logger';

export interface StorefrontAssortmentFilter {
  includeProductIds?: string[];
  excludeProductIds?: string[];
}

export async function resolveAssortment(req: HttpRequest, res: HttpResponse, next: HttpNext): Promise<void> {
  res.locals.assortmentFilter = null;
  const storeId = (res.locals.storeId as string) || '';
  if (storeId) {
    try {
      const channelId = (res.locals.channelId as string) || undefined;
      res.locals.assortmentFilter = await resolveStoreCatalogUseCase.resolveAssortmentFilter(storeId, channelId);
    } catch (error) {
      logger.warn('assortment filter resolution failed — catalog left unconstrained', {
        storeId,
        path: req.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  next();
}
