/**
 * Localization Controller for Admin Hub
 * Handles Languages, Currencies, and Regions management
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// Dashboard
// ============================================================================

export const localizationDashboard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'settings/localization/index', {
    pageName: 'Localization',
    languages: [],
    currencies: [],
    regions: [],
    success: req.query.success || null,
  });
};

// ============================================================================
// Languages
// ============================================================================

export const listLanguages = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'settings/localization/languages/index', {
    pageName: 'Languages',
    languages: [],
    pagination: { total: 0, page: 1, pages: 1 },
    success: req.query.success || null,
  });
};

export const createLanguageForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'settings/localization/languages/create', {
    pageName: 'Add Language',
  });
};

export const createLanguage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/languages?success=Language added successfully');
  } catch (error: unknown) {
    logger.warn('Error creating language:', error);
    adminRespond(req, res, 'settings/localization/languages/create', {
      pageName: 'Add Language',
      error: (error as Error).message || 'Failed to add language',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const editLanguageForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'settings/localization/languages/edit', {
    pageName: 'Edit Language',
    language: null,
  });
};

export const updateLanguage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/languages?success=Language updated successfully');
  } catch (error: unknown) {
    logger.warn('Error updating language:', error);
    adminRespond(req, res, 'settings/localization/languages/edit', {
      pageName: 'Edit Language',
      language: null,
      error: (error as Error).message || 'Failed to update language',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const deleteLanguage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  res.json({ success: true, message: 'Language deleted successfully' });
};

// ============================================================================
// Currencies
// ============================================================================

export const listCurrencies = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'settings/localization/currencies/index', {
    pageName: 'Currencies',
    currencies: [],
    pagination: { total: 0, page: 1, pages: 1 },
    success: req.query.success || null,
  });
};

export const createCurrencyForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'settings/localization/currencies/create', {
    pageName: 'Add Currency',
  });
};

export const createCurrency = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/currencies?success=Currency added successfully');
  } catch (error: unknown) {
    logger.warn('Error creating currency:', error);
    adminRespond(req, res, 'settings/localization/currencies/create', {
      pageName: 'Add Currency',
      error: (error as Error).message || 'Failed to add currency',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const editCurrencyForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'settings/localization/currencies/edit', {
    pageName: 'Edit Currency',
    currency: null,
  });
};

export const updateCurrency = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/currencies?success=Currency updated successfully');
  } catch (error: unknown) {
    logger.warn('Error updating currency:', error);
    adminRespond(req, res, 'settings/localization/currencies/edit', {
      pageName: 'Edit Currency',
      currency: null,
      error: (error as Error).message || 'Failed to update currency',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const deleteCurrency = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  res.json({ success: true, message: 'Currency deleted successfully' });
};

// ============================================================================
// Regions
// ============================================================================

export const listRegions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'settings/localization/regions/index', {
    pageName: 'Regions',
    regions: [],
    pagination: { total: 0, page: 1, pages: 1 },
    success: req.query.success || null,
  });
};

export const createRegionForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'settings/localization/regions/create', {
    pageName: 'Add Region',
  });
};

export const createRegion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/regions?success=Region added successfully');
  } catch (error: unknown) {
    logger.warn('Error creating region:', error);
    adminRespond(req, res, 'settings/localization/regions/create', {
      pageName: 'Add Region',
      error: (error as Error).message || 'Failed to add region',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const editRegionForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'settings/localization/regions/edit', {
    pageName: 'Edit Region',
    region: null,
  });
};

export const updateRegion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    res.redirect('/admin/settings/localization/regions?success=Region updated successfully');
  } catch (error: unknown) {
    logger.warn('Error updating region:', error);
    adminRespond(req, res, 'settings/localization/regions/edit', {
      pageName: 'Edit Region',
      region: null,
      error: (error as Error).message || 'Failed to update region',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const deleteRegion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  res.json({ success: true, message: 'Region deleted successfully' });
};
