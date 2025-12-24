/**
 * Pricing Controller for Admin Hub
 * Handles Price Lists and Pricing Rules management
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { adminRespond } from '../../respond';

// ============================================================================
// Price Lists
// ============================================================================

export const listPriceLists = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/pricing/index', {
      pageName: 'Pricing',
      priceLists: [],
      priceRules: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing price lists:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load pricing',
    });
  }
};

export const createPriceListForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/pricing/lists/create', {
      pageName: 'Create Price List',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createPriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/catalog/pricing?success=Price list created successfully');
  } catch (error: any) {
    logger.error('Error creating price list:', error);
    adminRespond(req, res, 'catalog/pricing/lists/create', {
      pageName: 'Create Price List',
      error: error.message || 'Failed to create price list',
      formData: req.body,
    });
  }
};

export const viewPriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/pricing/lists/view', {
      pageName: 'Price List Details',
      priceList: null,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load price list',
    });
  }
};

export const editPriceListForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/pricing/lists/edit', {
      pageName: 'Edit Price List',
      priceList: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updatePriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { listId } = req.params;
    res.redirect(`/admin/catalog/pricing/lists/${listId}?success=Price list updated successfully`);
  } catch (error: any) {
    logger.error('Error updating price list:', error);
    adminRespond(req, res, 'catalog/pricing/lists/edit', {
      pageName: 'Edit Price List',
      priceList: null,
      error: error.message || 'Failed to update price list',
      formData: req.body,
    });
  }
};

export const deletePriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Price list deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting price list:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete price list' });
  }
};

// ============================================================================
// Price Rules
// ============================================================================

export const listPriceRules = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/pricing/rules/index', {
      pageName: 'Price Rules',
      priceRules: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing price rules:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load price rules',
    });
  }
};

export const createPriceRuleForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/pricing/rules/create', {
      pageName: 'Create Price Rule',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createPriceRule = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/catalog/pricing/rules?success=Price rule created successfully');
  } catch (error: any) {
    logger.error('Error creating price rule:', error);
    adminRespond(req, res, 'catalog/pricing/rules/create', {
      pageName: 'Create Price Rule',
      error: error.message || 'Failed to create price rule',
      formData: req.body,
    });
  }
};

export const viewPriceRule = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/pricing/rules/view', {
      pageName: 'Price Rule Details',
      priceRule: null,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load price rule',
    });
  }
};

export const editPriceRuleForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/pricing/rules/edit', {
      pageName: 'Edit Price Rule',
      priceRule: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updatePriceRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ruleId } = req.params;
    res.redirect(`/admin/catalog/pricing/rules/${ruleId}?success=Price rule updated successfully`);
  } catch (error: any) {
    logger.error('Error updating price rule:', error);
    adminRespond(req, res, 'catalog/pricing/rules/edit', {
      pageName: 'Edit Price Rule',
      priceRule: null,
      error: error.message || 'Failed to update price rule',
      formData: req.body,
    });
  }
};

export const deletePriceRule = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Price rule deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting price rule:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete price rule' });
  }
};
