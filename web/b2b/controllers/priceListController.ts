/**
 * B2B Price List Controller
 * Handles price list browsing for B2B portal users
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../libs/logger';
import { b2bRespond } from '../../respond';
import * as b2bPriceListRepo from '../../../modules/b2b/infrastructure/repositories/b2bPriceListRepo';
import * as b2bPriceListItemRepo from '../../../modules/b2b/infrastructure/repositories/b2bPriceListItemRepo';

interface B2BUser {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * GET /b2b/price-lists
 * List all price lists assigned to the company
 */
export const listPriceLists = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const priceLists = await b2bPriceListRepo.findByCompany(user.companyId);

    b2bRespond(req, res, 'price-lists/index', {
      pageName: 'Price Lists',
      user,
      priceLists,
    });
  } catch (error) {
    logger.error('Error loading price lists:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load price lists', user: req.user });
  }
};

/**
 * GET /b2b/price-lists/:priceListId
 * View a single price list with its items
 */
export const viewPriceList = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { priceListId } = req.params;
    const priceList = await b2bPriceListRepo.findById(priceListId);

    if (!priceList || (priceList.b2bCompanyId && priceList.b2bCompanyId !== user.companyId)) {
      return b2bRespond(req, res, 'error', { pageName: 'Not Found', error: 'Price list not found', user });
    }

    const items = await b2bPriceListItemRepo.findByPriceList(priceListId);

    b2bRespond(req, res, 'price-lists/detail', {
      pageName: priceList.name,
      user,
      priceList,
      items,
    });
  } catch (error) {
    logger.error('Error loading price list:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load price list', user: req.user });
  }
};
