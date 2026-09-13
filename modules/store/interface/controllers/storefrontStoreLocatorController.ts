/**
 * Store Locator Controller
 * Displays a list of physical store locations with map and search
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../../../libs/storefrontRespond';
import { ManageStoresAdminUseCase } from '../../application/useCases/ManageStoresAdmin';
import { storeDataRepository } from '../../application/wired';

const manageStoresUseCase = new ManageStoresAdminUseCase(storeDataRepository.stores);

export const getStoreLocator = async (req: TypedRequest, res: Response): Promise<void> => {
  const stores = await manageStoresUseCase.findActive();

  storefrontRespond(req, res, 'page/store-locator', {
    pageName: 'Store Locator',
    stores,
    user: req.user,
  });
};
