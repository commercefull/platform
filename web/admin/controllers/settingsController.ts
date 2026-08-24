/**
 * Settings Controller
 * Handles organization settings and store configuration
 * for the Commercefull Admin Hub - Phase 8
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';
import { ManageLanguagesUseCase, ManageCurrenciesUseCase, ManageCountriesUseCase } from '../../../modules/localization/application/useCases/ManageLocalization';

const manageLanguagesUseCase = new ManageLanguagesUseCase();
const manageCurrenciesUseCase = new ManageCurrenciesUseCase();
const manageCountriesUseCase = new ManageCountriesUseCase();

// ============================================================================
// Types
// ============================================================================

interface StoreSettings {
  organizationId: string;
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
  const organizationId = req.user?.organizationId || 'default';

  const timezones = getTimezones();
  const currencies = await manageCurrenciesUseCase.listActiveCurrencyCodes();
  const locales = getLocales();

  adminRespond(req, res, 'settings/store', {
    pageName: 'Store Settings',
    settings: getDefaultSettings(organizationId),
    timezones,
    currencies: currencies.length > 0 ? currencies : getDefaultCurrencyList(),
    locales,
  });
  
};

export const updateStoreSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const {
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
  } = body;

  void { addressLine1, addressLine2, city, state, postalCode, country };

  res.json({ success: true });
  
};

// ============================================================================
// Business Information
// ============================================================================

export const businessInfo = async (req: TypedRequest, res: Response): Promise<void> => {
  const organizationId = req.user?.organizationId || 'default';

  adminRespond(req, res, 'settings/business', {
    pageName: 'Business Information',
    settings: getDefaultSettings(organizationId),
  });
  
};

export const updateBusinessInfo = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const { legalName, taxId, registrationNumber } = body;
  void { legalName, taxId, registrationNumber };

  res.json({ success: true });
  
};

// ============================================================================
// Localization Settings
// ============================================================================

export const localizationSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  // Get languages
  const languages = await manageLanguagesUseCase.listLanguages();

  // Get currencies
  const currencies = await manageCurrenciesUseCase.listCurrencies();

  // Get countries
  const countries = await manageCountriesUseCase.findAll();

  adminRespond(req, res, 'settings/localization', {
    pageName: 'Localization',
    languages,
    currencies,
    countries,
  });
  
};

// ============================================================================
// Language Management
// ============================================================================

export const createLanguage = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const { code, name, nativeName, isDefault, isActive } = body;

  if (!code || !name) {
    res.status(400).json({ success: false, message: 'Code and name are required' });
    return;
  }

  const languageId = await manageLanguagesUseCase.createLanguage({ code, name, nativeName, isDefault, isActive });

  res.json({ success: true, languageId });
  
};

export const updateLanguage = async (req: TypedRequest, res: Response): Promise<void> => {
  const { languageId } = req.params;
  const body = req.body as RequestBody;
  const { name, nativeName, isDefault, isActive } = body;
  // const _now = new Date();

  await manageLanguagesUseCase.updateLanguage(languageId, { name, nativeName, isDefault, isActive });

  res.json({ success: true });
  
};

export const deleteLanguage = async (req: TypedRequest, res: Response): Promise<void> => {
  const { languageId } = req.params;

  const language = await manageLanguagesUseCase.findLanguageById(languageId);

  if (language?.isDefault) {
    res.status(400).json({ success: false, message: 'Cannot delete the default language' });
    return;
  }

  await manageLanguagesUseCase.deleteLanguage(languageId);

  res.json({ success: true });
  
};

// ============================================================================
// Currency Management
// ============================================================================

export const createCurrency = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const { code, name, symbol, exchangeRate, isDefault, isActive } = body;

  if (!code || !name) {
    res.status(400).json({ success: false, message: 'Code and name are required' });
    return;
  }

  const currencyId = await manageCurrenciesUseCase.createCurrency({ code, name, symbol, exchangeRate, isDefault, isActive });

  res.json({ success: true, currencyId });
  
};

export const updateCurrency = async (req: TypedRequest, res: Response): Promise<void> => {
  const { currencyId } = req.params;
  const body = req.body as RequestBody;
  const { name, symbol, exchangeRate, isDefault, isActive } = body;
  // const _now = new Date();

  await manageCurrenciesUseCase.updateCurrency(currencyId, { name, symbol, exchangeRate, isDefault, isActive });

  res.json({ success: true });
  
};

export const deleteCurrency = async (req: TypedRequest, res: Response): Promise<void> => {
  const { currencyId } = req.params;

  const currency = await manageCurrenciesUseCase.findCurrencyById(currencyId);

  if (currency?.isDefault) {
    res.status(400).json({ success: false, message: 'Cannot delete the default currency' });
    return;
  }

  await manageCurrenciesUseCase.deleteCurrency(currencyId);

  res.json({ success: true });
  
};

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultSettings(organizationId: string): StoreSettings {
  return {
    organizationId,
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
