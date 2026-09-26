/**
 * Store Locator Controller
 * Displays a list of physical store locations with map and search
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { storefrontRespond } from '../../../../libs/storefrontRespond';
import { manageStoresAdminUseCase } from '../../application/useCases/wired';

const manageStoresUseCase = manageStoresAdminUseCase;

export const getStoreLocator = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const stores = await manageStoresUseCase.findActive();

  storefrontRespond(req, res, 'page/store-locator', {
    pageName: 'Store Locator',
    stores,
    user: req.user,
  });
};
