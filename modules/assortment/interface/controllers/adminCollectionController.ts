/**
 * Admin Collection Controller
 *
 * Admin panel CRUD for collections. Replaces the placeholder handlers that
 * lived in product's adminAssortmentController.
 */

import { jsonResponse, redirectResponse } from 'libs/apiResponse';
import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { adminRespond } from '../../../../libs/adminRespond';
import { manageCollectionsUseCase, resolveCollectionProductsUseCase } from '../../application/useCases/wired';
import { ResolveCollectionProductsCommand } from '../../application/useCases/ResolveCollectionProducts';
import { findActiveStoresUseCase, manageSalesChannelsUseCase } from '../../../store/application/useCases/wired';
import type { CollectionCondition } from '../../domain/entities/Collection';

interface CollectionFormBody {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: string | boolean;
  isFeatured?: string | boolean;
  isAutomated?: string | boolean;
  conditionsJson?: string;
  sortOrder?: string;
  publishAt?: string;
  unpublishAt?: string;
}

function parseForm(body: CollectionFormBody) {
  let conditions: CollectionCondition[] | undefined;
  if (body.isAutomated === 'on' || body.isAutomated === 'true') {
    try {
      conditions = body.conditionsJson ? (JSON.parse(body.conditionsJson) as CollectionCondition[]) : undefined;
    } catch {
      throw new Error('Conditions must be valid JSON');
    }
  }
  return {
    name: body.name,
    slug: body.slug || body.name?.toLowerCase().replace(/\s+/g, '-'),
    description: body.description || null,
    imageUrl: body.imageUrl || null,
    bannerUrl: body.bannerUrl || null,
    metaTitle: body.metaTitle || null,
    metaDescription: body.metaDescription || null,
    isActive: body.isActive === 'on' || body.isActive === 'true' || body.isActive === true,
    isFeatured: body.isFeatured === 'on' || body.isFeatured === 'true',
    isAutomated: body.isAutomated === 'on' || body.isAutomated === 'true',
    conditions,
    sortOrder: body.sortOrder as 'manual' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | undefined,
    publishAt: body.publishAt ? new Date(body.publishAt) : null,
    unpublishAt: body.unpublishAt ? new Date(body.unpublishAt) : null,
  };
}

export const listCollections = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const collections = await manageCollectionsUseCase.list();
  adminRespond(req, res, 'catalog/collections/index', {
    pageName: 'Collections',
    collections,
    pagination: { total: collections.length, page: 1, pages: 1 },
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

export const createCollectionForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'catalog/collections/create', {
    pageName: 'Create Collection',
    formData: {},
  });
};

export const createCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const input = parseForm(req.body as CollectionFormBody);
    await manageCollectionsUseCase.create(input);
    redirectResponse(res, '/admin/catalog/collections?success=Collection created successfully');
  } catch (error: unknown) {
    logger.warn('Error creating collection:', error);
    adminRespond(req, res, 'catalog/collections/create', {
      pageName: 'Create Collection',
      formData: req.body,
      error: (error as Error).message || 'Failed to create collection',
    });
  }
};

export const viewCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { collectionId } = req.params;
    const collection = await manageCollectionsUseCase.getById(collectionId);
    const [resolved, publications, stores, salesChannels] = await Promise.all([
      resolveCollectionProductsUseCase.execute(new ResolveCollectionProductsCommand(collectionId, 100, 0)),
      manageCollectionsUseCase.listPublications(collectionId).catch(() => []),
      findActiveStoresUseCase.execute().catch(() => []),
      manageSalesChannelsUseCase.listAll().catch(() => []),
    ]);
    adminRespond(req, res, 'catalog/collections/view', {
      pageName: `Collection: ${collection.name}`,
      collection,
      products: resolved.products,
      productTotal: resolved.total,
      publications,
      stores,
      salesChannels,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (error) {
    logger.warn('Error viewing collection:', error);
    adminRespond(req, res, 'catalog/collections/index', {
      pageName: 'Collections',
      collections: [],
      error: (error as Error).message || 'Collection not found',
    });
  }
};

export const editCollectionForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const collection = await manageCollectionsUseCase.getById(req.params.collectionId);
    adminRespond(req, res, 'catalog/collections/edit', {
      pageName: `Edit Collection: ${collection.name}`,
      collection,
      formData: collection,
    });
  } catch (error) {
    logger.warn('Error loading collection:', error);
    redirectResponse(res, '/admin/catalog/collections?error=' + encodeURIComponent('Collection not found'));
  }
};

export const updateCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { collectionId } = req.params;
  try {
    const input = parseForm(req.body as HttpRequestBody as CollectionFormBody);
    await manageCollectionsUseCase.update(collectionId, input);
    redirectResponse(res, '/admin/catalog/collections?success=Collection updated successfully');
  } catch (error: unknown) {
    logger.warn('Error updating collection:', error);
    try {
      const collection = await manageCollectionsUseCase.getById(collectionId);
      adminRespond(req, res, 'catalog/collections/edit', {
        pageName: `Edit Collection: ${collection.name}`,
        collection,
        formData: req.body,
        error: (error as Error).message || 'Failed to update collection',
      });
    } catch {
      redirectResponse(res, '/admin/catalog/collections?error=' + encodeURIComponent((error as Error).message));
    }
  }
};

export const deleteCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    await manageCollectionsUseCase.delete(req.params.collectionId);
    jsonResponse(res, 200, { success: true, message: 'Collection deleted successfully' });
  } catch (error: unknown) {
    logger.warn('Error deleting collection:', error);
    jsonResponse(res, 404, { success: false, error: (error as Error).message || 'Failed to delete collection' });
  }
};

interface PublicationFormBody {
  storeId?: string;
  channelId?: string;
  sortOrder?: string;
}

/**
 * Create or update a store/channel publication for a collection.
 * POST /admin/catalog/collections/:collectionId/publications
 */
export const upsertCollectionPublication = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { collectionId } = req.params;
  try {
    const body = req.body as HttpRequestBody as PublicationFormBody;
    if (!body.storeId) {
      redirectResponse(res, `/admin/catalog/collections/${collectionId}?error=` + encodeURIComponent('Store is required'));
      return;
    }
    const sortOrder = body.sortOrder === undefined || body.sortOrder === '' ? undefined : parseInt(body.sortOrder, 10);
    await manageCollectionsUseCase.setPublication(collectionId, {
      storeId: body.storeId,
      channelId: body.channelId || undefined,
      sortOrder,
    });
    redirectResponse(res, `/admin/catalog/collections/${collectionId}?success=Publication saved`);
  } catch (error: unknown) {
    logger.warn('Error saving collection publication:', error);
    redirectResponse(res, `/admin/catalog/collections/${collectionId}?error=` + encodeURIComponent((error as Error).message));
  }
};

/**
 * Remove a store/channel publication from a collection.
 * POST /admin/catalog/collections/:collectionId/publications/:publicationId/remove
 */
export const deleteCollectionPublication = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { collectionId, publicationId } = req.params;
  try {
    await manageCollectionsUseCase.deletePublication(collectionId, publicationId);
    redirectResponse(res, `/admin/catalog/collections/${collectionId}?success=Publication removed`);
  } catch (error: unknown) {
    logger.warn('Error removing collection publication:', error);
    redirectResponse(res, `/admin/catalog/collections/${collectionId}?error=` + encodeURIComponent((error as Error).message));
  }
};
