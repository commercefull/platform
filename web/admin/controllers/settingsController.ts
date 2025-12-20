/**
 * Settings Controller
 * Handles merchant settings and store configuration
 * for the Commercefull Admin Hub - Phase 8
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';
import { v4 as uuidv4 } from 'uuid';

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

export const storeSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req as any).merchantId || 'default';

    const settings = await queryOne<any>(
      `SELECT * FROM "merchantSettings" WHERE "merchantId" = $1`,
      [merchantId]
    );

    // Get available timezones and currencies
    const timezones = getTimezones();
    const currencies = await getCurrencies();
    const locales = getLocales();

    res.render('hub/views/settings/store', {
      pageName: 'Store Settings',
      settings: settings || getDefaultSettings(merchantId),
      timezones,
      currencies,
      locales,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading store settings:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load settings',
      user: req.user
    });
  }
};

export const updateStoreSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req as any).merchantId || 'default';
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
      country
    } = req.body;

    const now = new Date();
    const storeAddress = JSON.stringify({
      line1: addressLine1,
      line2: addressLine2,
      city,
      state,
      postalCode,
      country
    });

    // Check if settings exist
    const existing = await queryOne<{ merchantId: string }>(
      `SELECT "merchantId" FROM "merchantSettings" WHERE "merchantId" = $1`,
      [merchantId]
    );

    if (existing) {
      await query(
        `UPDATE "merchantSettings" SET
          "storeName" = COALESCE($1, "storeName"),
          "storeUrl" = $2,
          "storeEmail" = $3,
          "storePhone" = $4,
          "timezone" = COALESCE($5, "timezone"),
          "currency" = COALESCE($6, "currency"),
          "locale" = COALESCE($7, "locale"),
          "storeAddress" = $8,
          "updatedAt" = $9
         WHERE "merchantId" = $10`,
        [storeName, storeUrl, storeEmail, storePhone, timezone, currency, locale, storeAddress, now, merchantId]
      );
    } else {
      await query(
        `INSERT INTO "merchantSettings" (
          "merchantId", "storeName", "storeUrl", "storeEmail", "storePhone",
          "timezone", "currency", "locale", "storeAddress", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [merchantId, storeName, storeUrl, storeEmail, storePhone, timezone, currency, locale, storeAddress, now, now]
      );
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating store settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Business Information
// ============================================================================

export const businessInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req as any).merchantId || 'default';

    const settings = await queryOne<any>(
      `SELECT * FROM "merchantSettings" WHERE "merchantId" = $1`,
      [merchantId]
    );

    res.render('hub/views/settings/business', {
      pageName: 'Business Information',
      settings: settings || getDefaultSettings(merchantId),
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading business info:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load business info',
      user: req.user
    });
  }
};

export const updateBusinessInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req as any).merchantId || 'default';
    const { legalName, taxId, registrationNumber } = req.body;
    const now = new Date();

    const businessInfo = JSON.stringify({ legalName, taxId, registrationNumber });

    await query(
      `UPDATE "merchantSettings" SET
        "businessInfo" = $1,
        "updatedAt" = $2
       WHERE "merchantId" = $3`,
      [businessInfo, now, merchantId]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating business info:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Localization Settings
// ============================================================================

export const localizationSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get languages
    const languages = await query<Array<any>>(
      `SELECT * FROM "language" ORDER BY "name"`
    );

    // Get currencies
    const currencies = await query<Array<any>>(
      `SELECT * FROM "currency" ORDER BY "name"`
    );

    // Get countries
    const countries = await query<Array<any>>(
      `SELECT * FROM "country" ORDER BY "name"`
    );

    res.render('hub/views/settings/localization', {
      pageName: 'Localization',
      languages: languages || [],
      currencies: currencies || [],
      countries: countries || [],
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading localization settings:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load localization settings',
      user: req.user
    });
  }
};

// ============================================================================
// Language Management
// ============================================================================

export const createLanguage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, nativeName, isDefault, isActive } = req.body;

    if (!code || !name) {
      res.status(400).json({ success: false, message: 'Code and name are required' });
      return;
    }

    const languageId = uuidv4();
    const now = new Date();

    // If setting as default, unset other defaults
    if (isDefault) {
      await query(`UPDATE "language" SET "isDefault" = false`);
    }

    await query(
      `INSERT INTO "language" ("languageId", "code", "name", "nativeName", "isDefault", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [languageId, code, name, nativeName || name, isDefault || false, isActive !== false, now, now]
    );

    res.json({ success: true, languageId });
  } catch (error: any) {
    console.error('Error creating language:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLanguage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { languageId } = req.params;
    const { name, nativeName, isDefault, isActive } = req.body;
    const now = new Date();

    // If setting as default, unset other defaults
    if (isDefault) {
      await query(`UPDATE "language" SET "isDefault" = false`);
    }

    await query(
      `UPDATE "language" SET
        "name" = COALESCE($1, "name"),
        "nativeName" = COALESCE($2, "nativeName"),
        "isDefault" = COALESCE($3, "isDefault"),
        "isActive" = COALESCE($4, "isActive"),
        "updatedAt" = $5
       WHERE "languageId" = $6`,
      [name, nativeName, isDefault, isActive, now, languageId]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating language:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLanguage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { languageId } = req.params;

    // Check if it's the default language
    const language = await queryOne<{ isDefault: boolean }>(
      `SELECT "isDefault" FROM "language" WHERE "languageId" = $1`,
      [languageId]
    );

    if (language?.isDefault) {
      res.status(400).json({ success: false, message: 'Cannot delete the default language' });
      return;
    }

    await query(`DELETE FROM "language" WHERE "languageId" = $1`, [languageId]);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting language:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Currency Management
// ============================================================================

export const createCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, symbol, exchangeRate, isDefault, isActive } = req.body;

    if (!code || !name) {
      res.status(400).json({ success: false, message: 'Code and name are required' });
      return;
    }

    const currencyId = uuidv4();
    const now = new Date();

    // If setting as default, unset other defaults
    if (isDefault) {
      await query(`UPDATE "currency" SET "isDefault" = false`);
    }

    await query(
      `INSERT INTO "currency" ("currencyId", "code", "name", "symbol", "exchangeRate", "isDefault", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [currencyId, code.toUpperCase(), name, symbol || code, exchangeRate || 1, isDefault || false, isActive !== false, now, now]
    );

    res.json({ success: true, currencyId });
  } catch (error: any) {
    console.error('Error creating currency:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currencyId } = req.params;
    const { name, symbol, exchangeRate, isDefault, isActive } = req.body;
    const now = new Date();

    // If setting as default, unset other defaults
    if (isDefault) {
      await query(`UPDATE "currency" SET "isDefault" = false`);
    }

    await query(
      `UPDATE "currency" SET
        "name" = COALESCE($1, "name"),
        "symbol" = COALESCE($2, "symbol"),
        "exchangeRate" = COALESCE($3, "exchangeRate"),
        "isDefault" = COALESCE($4, "isDefault"),
        "isActive" = COALESCE($5, "isActive"),
        "updatedAt" = $6
       WHERE "currencyId" = $7`,
      [name, symbol, exchangeRate, isDefault, isActive, now, currencyId]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating currency:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currencyId } = req.params;

    // Check if it's the default currency
    const currency = await queryOne<{ isDefault: boolean }>(
      `SELECT "isDefault" FROM "currency" WHERE "currencyId" = $1`,
      [currencyId]
    );

    if (currency?.isDefault) {
      res.status(400).json({ success: false, message: 'Cannot delete the default currency' });
      return;
    }

    await query(`DELETE FROM "currency" WHERE "currencyId" = $1`, [currencyId]);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting currency:', error);
    res.status(500).json({ success: false, message: error.message });
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
    updatedAt: new Date()
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
    'Australia/Sydney'
  ];
}

async function getCurrencies(): Promise<Array<{ code: string; name: string }>> {
  const currencies = await query<Array<{ code: string; name: string }>>(
    `SELECT "code", "name" FROM "currency" WHERE "isActive" = true ORDER BY "name"`
  );

  if (currencies && currencies.length > 0) {
    return currencies;
  }

  // Default currencies if none in database
  return [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'JPY', name: 'Japanese Yen' }
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
    { code: 'zh-CN', name: 'Chinese (Simplified)' }
  ];
}
