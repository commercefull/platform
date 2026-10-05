/**
 * Assortment Customer Controller
 *
 * Public storefront reads: published collections and collection pages.
 */

import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { browseCollectionsUseCase } from '../../application/useCases/wired';
import { CollectionNotFoundError } from '../../domain/errors/AssortmentErrors';

function scope(res: HttpResponse): { storeId?: string; channelId?: string } | undefined {
  const storeId = (res.locals.storeId as string | undefined) || undefined;
  const channelId = (res.locals.channelId as string | undefined) || undefined;
  return storeId || channelId ? { storeId, channelId } : undefined;
}

export const listCollections = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId } = req.query as Record<string, string | undefined>;
  const collections = await browseCollectionsUseCase.list(organizationId, scope(res));
  jsonResponse(res, 200, { success: true, data: collections });
};

export const getCollectionBySlug = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const query = req.query as Record<string, string | undefined>;
    const limit = Math.min(Math.max(parseInt(query.limit ?? '50', 10) || 50, 1), 200);
    const offset = Math.max(parseInt(query.offset ?? '0', 10) || 0, 0);
    const page = await browseCollectionsUseCase.getBySlug(req.params.slug, limit, offset, undefined, scope(res));
    jsonResponse(res, 200, { success: true, data: page });
  } catch (error) {
    if (error instanceof CollectionNotFoundError) {
      jsonResponse(res, 404, { success: false, error: error.message });
      return;
    }
    throw error;
  }
};
