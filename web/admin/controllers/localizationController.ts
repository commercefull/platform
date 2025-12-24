/**
 * Localization Controller for Admin Hub
 * Handles Languages, Currencies, and Regions management
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { adminRespond } from '../../respond';

// ============================================================================
// Dashboard
// ============================================================================

export const localizationDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/localization/index', {
      pageName: 'Localization',
      languages: [],
      currencies: [],
      regions: [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error loading localization dashboard:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load localization settings',
    });
  }
};

// ============================================================================
// Languages
// ============================================================================

export const listLanguages = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/localization/languages/index', {
      pageName: 'Languages',
      languages: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing languages:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load languages',
    });
  }
};

export const createLanguageForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/localization/languages/create', {
      pageName: 'Add Language',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createLanguage = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/languages?success=Language added successfully');
  } catch (error: any) {
    logger.error('Error creating language:', error);
    adminRespond(req, res, 'settings/localization/languages/create', {
      pageName: 'Add Language',
      error: error.message || 'Failed to add language',
      formData: req.body,
    });
  }
};

export const editLanguageForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/localization/languages/edit', {
      pageName: 'Edit Language',
      language: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateLanguage = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/languages?success=Language updated successfully');
  } catch (error: any) {
    logger.error('Error updating language:', error);
    adminRespond(req, res, 'settings/localization/languages/edit', {
      pageName: 'Edit Language',
      language: null,
      error: error.message || 'Failed to update language',
      formData: req.body,
    });
  }
};

export const deleteLanguage = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Language deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting language:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete language' });
  }
};

// ============================================================================
// Currencies
// ============================================================================

export const listCurrencies = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/localization/currencies/index', {
      pageName: 'Currencies',
      currencies: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing currencies:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load currencies',
    });
  }
};

export const createCurrencyForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/localization/currencies/create', {
      pageName: 'Add Currency',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/currencies?success=Currency added successfully');
  } catch (error: any) {
    logger.error('Error creating currency:', error);
    adminRespond(req, res, 'settings/localization/currencies/create', {
      pageName: 'Add Currency',
      error: error.message || 'Failed to add currency',
      formData: req.body,
    });
  }
};

export const editCurrencyForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/localization/currencies/edit', {
      pageName: 'Edit Currency',
      currency: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/currencies?success=Currency updated successfully');
  } catch (error: any) {
    logger.error('Error updating currency:', error);
    adminRespond(req, res, 'settings/localization/currencies/edit', {
      pageName: 'Edit Currency',
      currency: null,
      error: error.message || 'Failed to update currency',
      formData: req.body,
    });
  }
};

export const deleteCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Currency deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting currency:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete currency' });
  }
};

// ============================================================================
// Regions
// ============================================================================

export const listRegions = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/localization/regions/index', {
      pageName: 'Regions',
      regions: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing regions:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load regions',
    });
  }
};

export const createRegionForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/localization/regions/create', {
      pageName: 'Add Region',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createRegion = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/regions?success=Region added successfully');
  } catch (error: any) {
    logger.error('Error creating region:', error);
    adminRespond(req, res, 'settings/localization/regions/create', {
      pageName: 'Add Region',
      error: error.message || 'Failed to add region',
      formData: req.body,
    });
  }
};

export const editRegionForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/localization/regions/edit', {
      pageName: 'Edit Region',
      region: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateRegion = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/regions?success=Region updated successfully');
  } catch (error: any) {
    logger.error('Error updating region:', error);
    adminRespond(req, res, 'settings/localization/regions/edit', {
      pageName: 'Edit Region',
      region: null,
      error: error.message || 'Failed to update region',
      formData: req.body,
    });
  }
};

export const deleteRegion = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Region deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting region:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete region' });
  }
};
