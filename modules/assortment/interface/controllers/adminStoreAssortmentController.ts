/**
 * Admin Store Assortment Controller
 *
 * Admin panel UI for a store's assortment mode and channel-scoped
 * include/exclude entries (ranging).
 */

import { redirectResponse } from 'libs/apiResponse';
import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { adminRespond } from '../../../../libs/adminRespond';
import { manageStoreAssortmentUseCase } from '../../application/useCases/wired';
import { GetStoreQuery } from '../../../store/application/useCases/GetStore';
import { getStoreUseCase, manageSalesChannelsUseCase } from '../../../store/application/useCases/wired';
import type { AssortmentEffect, AssortmentTargetType } from '../../domain/entities/StoreAssortmentEntry';

async function loadStore(storeId: string) {
  const result = await getStoreUseCase.execute(new GetStoreQuery(storeId));
  return result.store;
}

export const viewStoreAssortment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { storeId } = req.params;
    const store = await loadStore(storeId);
    if (!store) {
      adminRespond(req, res, 'stores/assortment', {
        pageName: 'Store Assortment',
        store: null,
        error: 'Store not found',
      });
      return;
    }

    const [config, channelAssignments] = await Promise.all([
      manageStoreAssortmentUseCase.getConfig(storeId),
      store.organizationId ? manageSalesChannelsUseCase.listForStore(store.organizationId, storeId).catch(() => []) : Promise.resolve([]),
    ]);

    adminRespond(req, res, 'stores/assortment', {
      pageName: `Assortment: ${store.name}`,
      store,
      mode: config.assortment.mode,
      entries: config.entries,
      channelAssignments,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (error) {
    logger.warn('Error loading store assortment:', error);
    adminRespond(req, res, 'stores/assortment', {
      pageName: 'Store Assortment',
      store: null,
      error: (error as Error).message || 'Failed to load assortment',
    });
  }
};

/**
 * Set the store's assortment mode (all | include | exclude).
 * POST /admin/stores/:storeId/assortment/mode
 */
export const setStoreAssortmentMode = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { storeId } = req.params;
  try {
    const { mode } = req.body as HttpRequestBody as { mode?: 'all' | 'include' | 'exclude' };
    await manageStoreAssortmentUseCase.setMode(storeId, mode as 'all' | 'include' | 'exclude');
    redirectResponse(res, `/admin/stores/${storeId}/assortment?success=` + encodeURIComponent('Assortment mode updated'));
  } catch (error: unknown) {
    logger.warn('Error updating assortment mode:', error);
    redirectResponse(res, `/admin/stores/${storeId}/assortment?error=` + encodeURIComponent((error as Error).message));
  }
};

interface AssortmentEntryFormBody {
  targetType?: string;
  targetId?: string;
  effect?: string;
  channelId?: string;
  position?: string;
  isHidden?: string | boolean;
}

/**
 * Add a channel-scoped assortment entry.
 * POST /admin/stores/:storeId/assortment/entries
 */
export const addStoreAssortmentEntry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { storeId } = req.params;
  try {
    const body = req.body as HttpRequestBody as AssortmentEntryFormBody;
    const position = body.position === undefined || body.position === '' ? undefined : parseInt(body.position, 10);
    await manageStoreAssortmentUseCase.addEntry(storeId, {
      targetType: body.targetType as AssortmentTargetType,
      targetId: body.targetId || '',
      effect: body.effect as AssortmentEffect,
      channelId: body.channelId || undefined,
      position: Number.isNaN(position) ? undefined : position,
      isHidden: body.isHidden === 'on' || body.isHidden === 'true' || body.isHidden === true,
    });
    redirectResponse(res, `/admin/stores/${storeId}/assortment?success=` + encodeURIComponent('Assortment entry added'));
  } catch (error: unknown) {
    logger.warn('Error adding assortment entry:', error);
    redirectResponse(res, `/admin/stores/${storeId}/assortment?error=` + encodeURIComponent((error as Error).message));
  }
};

/**
 * Remove an assortment entry.
 * POST /admin/stores/:storeId/assortment/entries/:entryId/remove
 */
export const removeStoreAssortmentEntry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { storeId, entryId } = req.params;
  try {
    await manageStoreAssortmentUseCase.removeEntry(entryId);
    redirectResponse(res, `/admin/stores/${storeId}/assortment?success=` + encodeURIComponent('Assortment entry removed'));
  } catch (error: unknown) {
    logger.warn('Error removing assortment entry:', error);
    redirectResponse(res, `/admin/stores/${storeId}/assortment?error=` + encodeURIComponent((error as Error).message));
  }
};
