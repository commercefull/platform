/**
 * Store Locator Controller
 * Displays a list of physical store locations with map and search
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import StoreRepo from '../../../modules/store/infrastructure/repositories/StoreRepo';

export const getStoreLocator = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const stores = await StoreRepo.findActive();

    storefrontRespond(req, res, 'page/store-locator', {
      pageName: 'Store Locator',
      stores,
      user: req.user,
    });
  } catch (error: unknown) {
    logger.error('Store locator error:', error);

    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load store locator',
      user: req.user,
    });
  }
};
