/**
 * Storefront Collection Controller
 *
 * Renders themed collection pages for shoppers:
 * - GET /collections — grid of published collections
 * - GET /collections/:slug — collection landing page + resolved products
 */

import { storefrontRespond } from '../../../../libs/storefrontRespond';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { browseCollectionsUseCase } from '../../application/useCases/wired';
import { CollectionNotFoundError } from '../../domain/errors/AssortmentErrors';

function organizationId(res: HttpResponse): string | undefined {
  return (res.locals.store as { organizationId?: string } | null)?.organizationId ?? undefined;
}

function collectionScope(res: HttpResponse): { storeId?: string; channelId?: string } | undefined {
  const storeId = (res.locals.storeId as string | undefined) || undefined;
  const channelId = (res.locals.channelId as string | undefined) || undefined;
  return storeId || channelId ? { storeId, channelId } : undefined;
}

export const listCollectionsPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const collections = await browseCollectionsUseCase.list(organizationId(res), collectionScope(res));
  storefrontRespond(req, res, 'collections/index', {
    pageName: 'Collections',
    collections,
  });
};

export const getCollectionPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { slug } = req.params;
  const page = Math.max(parseInt((req.query.page as string) ?? '1', 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) ?? '12', 10) || 12, 1), 48);

  try {
    // res.locals.assortmentFilter is resolved by web/storefront/assortmentMiddleware
    const sellable = res.locals.assortmentFilter as { includeProductIds?: string[]; excludeProductIds?: string[] } | null | undefined;
    const { collection, products, total } = await browseCollectionsUseCase.getBySlug(
      slug,
      limit,
      (page - 1) * limit,
      sellable ?? undefined,
      collectionScope(res),
    );

    storefrontRespond(req, res, 'collections/detail', {
      pageName: collection.metaTitle || collection.name,
      metaDescription: collection.metaDescription || collection.description,
      collection,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        baseUrl: `/collections/${collection.slug}`,
        limit,
      },
    });
  } catch (error) {
    if (error instanceof CollectionNotFoundError) {
      return storefrontRespond(req, res, '404', { pageName: 'Collection Not Found' });
    }
    throw error;
  }
};
