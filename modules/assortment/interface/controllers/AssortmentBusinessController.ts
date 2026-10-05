/**
 * Assortment Business Controller
 *
 * Merchant-facing API for collections and per-store assortment management.
 * Mounted at /business/assortment (replaces /business/products/collections).
 */

import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import {
  manageCollectionsUseCase,
  resolveCollectionProductsUseCase,
  manageStoreAssortmentUseCase,
  resolveStoreCatalogUseCase,
} from '../../application/useCases/wired';
import { ResolveCollectionProductsCommand } from '../../application/useCases/ResolveCollectionProducts';
import { ResolveStoreCatalogCommand } from '../../application/useCases/ResolveStoreCatalog';
import type { CollectionInput } from '../../application/useCases/ManageCollections';
import {
  AssortmentEntryNotFoundError,
  CollectionNotFoundError,
  CollectionSlugAlreadyExistsError,
  StoreAssortmentNotFoundError,
} from '../../domain/errors/AssortmentErrors';

// ============================================================================
// Collections
// ============================================================================

export const listCollections = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId, isActive, isFeatured } = req.query as Record<string, string | undefined>;
  const collections = await manageCollectionsUseCase.list({
    organizationId,
    isActive: isActive === undefined ? undefined : isActive === 'true',
    isFeatured: isFeatured === undefined ? undefined : isFeatured === 'true',
  });
  jsonResponse(res, 200, { success: true, data: collections });
};

export const getCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const collection = await manageCollectionsUseCase.getById(req.params.collectionId);
    const members = await manageCollectionsUseCase.listMembers(collection.assortmentCollectionId);
    jsonResponse(res, 200, { success: true, data: { ...collection.toJSON(), members } });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

export const getCollectionProducts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { limit, offset } = pagination(req);
    const result = await resolveCollectionProductsUseCase.execute(
      new ResolveCollectionProductsCommand(req.params.collectionId, limit, offset),
    );
    jsonResponse(res, 200, {
      success: true,
      data: {
        collection: result.collection,
        products: result.products,
        total: result.total,
        limit,
        offset,
      },
    });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

export const createCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const input = body as CollectionInput & { products?: { productId: string; position?: number }[] };
    const collection = await manageCollectionsUseCase.create(input);
    jsonResponse(res, 201, { success: true, data: collection });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

export const updateCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const collection = await manageCollectionsUseCase.update(req.params.collectionId, body as never);
    jsonResponse(res, 200, { success: true, data: collection });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

export const deleteCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    await manageCollectionsUseCase.delete(req.params.collectionId);
    jsonResponse(res, 200, { success: true, message: 'Collection deleted' });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

export const listCollectionPublications = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const publications = await manageCollectionsUseCase.listPublications(req.params.collectionId);
    jsonResponse(res, 200, { success: true, data: publications });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

export const setCollectionPublication = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as { storeId?: string; channelId?: string; sortOrder?: number };
    const publication = await manageCollectionsUseCase.setPublication(req.params.collectionId, body);
    jsonResponse(res, 200, { success: true, data: publication });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

export const deleteCollectionPublication = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    await manageCollectionsUseCase.deletePublication(req.params.collectionId, req.params.publicationId);
    jsonResponse(res, 200, { success: true, message: 'Collection publication removed' });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

// ============================================================================
// Store Assortment (ranging)
// ============================================================================

export const getStoreAssortment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const config = await manageStoreAssortmentUseCase.getConfig(req.params.storeId);
  jsonResponse(res, 200, {
    success: true,
    data: {
      storeId: config.assortment.storeId,
      mode: config.assortment.mode,
      entries: config.entries,
    },
  });
};

export const setStoreAssortmentMode = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { mode } = req.body as { mode: 'all' | 'include' | 'exclude' };
    const assortment = await manageStoreAssortmentUseCase.setMode(req.params.storeId, mode);
    jsonResponse(res, 200, { success: true, data: assortment });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

export const addStoreAssortmentEntry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as {
      targetType: 'product' | 'collection' | 'category';
      targetId: string;
      effect: 'include' | 'exclude';
      /** Sales channel the entry applies to — omit for store-wide entries. */
      channelId?: string;
      position?: number;
      isHidden?: boolean;
    };
    const entry = await manageStoreAssortmentUseCase.addEntry(req.params.storeId, body);
    jsonResponse(res, 201, { success: true, data: entry });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

export const removeStoreAssortmentEntry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    await manageStoreAssortmentUseCase.removeEntry(req.params.entryId);
    jsonResponse(res, 200, { success: true, message: 'Assortment entry removed' });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

export const getStoreCatalog = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { limit, offset } = pagination(req);
    const channelId = (req.query.channelId as string) || undefined;
    const result = await resolveStoreCatalogUseCase.execute(new ResolveStoreCatalogCommand(req.params.storeId, limit, offset, channelId));
    jsonResponse(res, 200, { success: true, data: result });
  } catch (error) {
    handleCollectionError(res, error);
  }
};

// ============================================================================
// Helpers
// ============================================================================

function pagination(req: HttpRequest): { limit: number; offset: number } {
  const query = req.query as Record<string, string | undefined>;
  return {
    limit: Math.min(Math.max(parseInt(query.limit ?? '50', 10) || 50, 1), 500),
    offset: Math.max(parseInt(query.offset ?? '0', 10) || 0, 0),
  };
}

function handleCollectionError(res: HttpResponse, error: unknown): void {
  if (error instanceof CollectionNotFoundError) {
    jsonResponse(res, 404, { success: false, error: error.message });
    return;
  }
  if (error instanceof CollectionSlugAlreadyExistsError) {
    jsonResponse(res, 409, { success: false, error: error.message });
    return;
  }
  if (error instanceof StoreAssortmentNotFoundError || error instanceof AssortmentEntryNotFoundError) {
    jsonResponse(res, 404, { success: false, error: error.message });
    return;
  }
  if (error instanceof Error) {
    jsonResponse(res, 400, { success: false, error: error.message });
    return;
  }
  jsonResponse(res, 500, { success: false, error: 'Internal server error' });
}
