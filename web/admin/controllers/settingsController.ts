/**
 * Settings Controller
 * Handles merchant settings and store configuration
 * for the Commercefull Admin Hub - Phase 8
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';
import * as merchantSettingsRepo from '../../../modules/merchant/infrastructure/repositories/merchantSettingsRepo';
import * as languageRepo from '../../../modules/localization/infrastructure/repositories/languageRepo';
import * as currencyRepo from '../../../modules/localization/infrastructure/repositories/currencyRepo';
import CountryRepo from '../../../modules/localization/infrastructure/repositories/countryRepo';

// ============================================================================
// Types
// ============================================================================

interface StoreSettings {
  merchantId: string;
  storeName: string;
  storeUrl?: string;
  storeEmail?: string;
  storePhone?: string;
  storeAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  timezone: string;
  currency: string;
  locale: string;
  logo?: string;
  favicon?: string;
  socialLinks?: Record<string, string>;
  businessInfo?: {
    legalName?: string;
    taxId?: string;
    registrationNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Store Settings
// ============================================================================

export const storeSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user?.merchantId || 'default';

    const settings = await merchantSettingsRepo.findByMerchantId(merchantId);

    // Get available timezones and currencies
    const timezones = getTimezones();
    const currencies = await currencyRepo.listActiveCurrencyCodes();
    const locales = getLocales();

    adminRespond(req, res, 'settings/store', {
      pageName: 'Store Settings',
      settings: settings || getDefaultSettings(merchantId),
      timezones,
      currencies: currencies.length > 0 ? currencies : getDefaultCurrencyList(),
      locales,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load settings',
    });
  }
};

export const updateStoreSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user?.merchantId || 'default';
    const body = req.body as RequestBody;
    const {
      storeName,
      storeUrl,
      storeEmail,
      storePhone,
      timezone,
      currency,
      locale,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = body;

    // const _now = new Date();
    const storeAddress = JSON.stringify({
      line1: addressLine1,
      line2: addressLine2,
      city,
      state,
      postalCode,
      country,
    });

    await merchantSettingsRepo.upsert(merchantId, {
      storeName,
      storeUrl,
      storeEmail,
      storePhone,
      timezone,
      currency,
      locale,
      storeAddress,
    });

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Business Information
// ============================================================================

export const businessInfo = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user?.merchantId || 'default';

    const settings = await merchantSettingsRepo.findByMerchantId(merchantId);

    adminRespond(req, res, 'settings/business', {
      pageName: 'Business Information',
      settings: settings || getDefaultSettings(merchantId),
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load business info',
    });
  }
};

export const updateBusinessInfo = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user?.merchantId || 'default';
    const body = req.body as RequestBody;
    const { legalName, taxId, registrationNumber } = body;
    // const _now = new Date();

    const businessInfo = JSON.stringify({ legalName, taxId, registrationNumber });

    await merchantSettingsRepo.updateBusinessInfo(merchantId, businessInfo);

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Localization Settings
// ============================================================================

export const localizationSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // Get languages
    const languages = await languageRepo.listLanguages();

    // Get currencies
    const currencies = await currencyRepo.listCurrencies();

    // Get countries
    const countries = await CountryRepo.findAll();

    adminRespond(req, res, 'settings/localization', {
      pageName: 'Localization',
      languages,
      currencies,
      countries,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load localization settings',
    });
  }
};

// ============================================================================
// Language Management
// ============================================================================

export const createLanguage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { code, name, nativeName, isDefault, isActive } = body;

    if (!code || !name) {
      res.status(400).json({ success: false, message: 'Code and name are required' });
      return;
    }

    const languageId = await languageRepo.createLanguage({ code, name, nativeName, isDefault, isActive });

    res.json({ success: true, languageId });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateLanguage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { languageId } = req.params;
    const body = req.body as RequestBody;
    const { name, nativeName, isDefault, isActive } = body;
    // const _now = new Date();

    await languageRepo.updateLanguage(languageId, { name, nativeName, isDefault, isActive });

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteLanguage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { languageId } = req.params;

    const language = await languageRepo.findLanguageById(languageId);

    if (language?.isDefault) {
      res.status(400).json({ success: false, message: 'Cannot delete the default language' });
      return;
    }

    await languageRepo.deleteLanguage(languageId);

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Currency Management
// ============================================================================

export const createCurrency = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { code, name, symbol, exchangeRate, isDefault, isActive } = body;

    if (!code || !name) {
      res.status(400).json({ success: false, message: 'Code and name are required' });
      return;
    }

    const currencyId = await currencyRepo.createCurrency({ code, name, symbol, exchangeRate, isDefault, isActive });

    res.json({ success: true, currencyId });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateCurrency = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { currencyId } = req.params;
    const body = req.body as RequestBody;
    const { name, symbol, exchangeRate, isDefault, isActive } = body;
    // const _now = new Date();

    await currencyRepo.updateCurrency(currencyId, { name, symbol, exchangeRate, isDefault, isActive });

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteCurrency = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { currencyId } = req.params;

    const currency = await currencyRepo.findCurrencyById(currencyId);

    if (currency?.isDefault) {
      res.status(400).json({ success: false, message: 'Cannot delete the default currency' });
      return;
    }

    await currencyRepo.deleteCurrency(currencyId);

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultSettings(merchantId: string): StoreSettings {
  return {
    merchantId,
    storeName: 'My Store',
    timezone: 'UTC',
    currency: 'USD',
    locale: 'en-US',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function getTimezones(): string[] {
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Australia/Sydney',
  ];
}

function getDefaultCurrencyList(): Array<{ code: string; name: string }> {
  return [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'JPY', name: 'Japanese Yen' },
  ];
}

function getLocales(): Array<{ code: string; name: string }> {
  return [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
  ];
}
