/**
 * Localization Customer Controller
 * Public endpoints for customers to get locale and country information
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import localizationDataRepository from '../../infrastructure/repositories/LocalizationDataRepository';

const localeRepo = localizationDataRepository.locales;
const countryRepo = localizationDataRepository.countries;
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { Locale, Country } from '../../../../libs/db/types';

/**
 * Get all active locales
 * GET /locales
 */
export const getActiveLocales = async (_req: TypedRequest, res: Response): Promise<void> => {
  const locales = await localeRepo.findAll(true); // Only active locales

  // Map to public-facing data (exclude internal fields)
  const publicLocales = locales.map((locale: Locale) => ({
    code: locale.code,
    name: locale.name,
    language: locale.language,
    countryCode: locale.countryCode,
    isDefault: locale.isDefault,
    textDirection: locale.textDirection,
    dateFormat: locale.dateFormat,
    timeFormat: locale.timeFormat,
    timeZone: locale.timeZone,
  }));

  successResponse(res, publicLocales);
};

/**
 * Get all active countries
 * GET /countries
 */
export const getActiveCountries = async (_req: TypedRequest, res: Response): Promise<void> => {
  const countries = await countryRepo.findAll(true); // Only active countries

  // Map to public-facing data
  const publicCountries = countries.map((country: Country) => ({
    code: country.code,
    name: country.name,
    alpha3Code: country.alpha3Code,
    flagIcon: country.flagIcon,
    region: country.region,
  }));

  successResponse(res, publicCountries);
};

/**
 * Detect locale based on request headers or IP
 * GET /detect
 */
export const detectLocale = async (req: TypedRequest, res: Response): Promise<void> => {
  // Get Accept-Language header
  const acceptLanguage = req.headers['accept-language'] || '';

  // Parse the Accept-Language header to get preferred language codes
  const preferredLanguages = parseAcceptLanguage(acceptLanguage);

  // Try to find a matching active locale
  let matchedLocale = null;

  for (const lang of preferredLanguages) {
    // Try exact match first (e.g., "en-US")
    const exactMatch = await localeRepo.findByCode(lang.code);
    if (exactMatch && exactMatch.isActive) {
      matchedLocale = exactMatch;
      break;
    }

    // Try language-only match (e.g., "en" from "en-US")
    if (lang.language) {
      const langMatch = await findLocaleByLanguage(lang.language);
      if (langMatch) {
        matchedLocale = langMatch;
        break;
      }
    }
  }

  // Fallback to default locale
  if (!matchedLocale) {
    matchedLocale = await localeRepo.findDefault();
  }

  if (!matchedLocale) {
    // Return a basic fallback if no locale is configured
    successResponse(res, {
      detected: false,
      locale: {
        code: 'en-US',
        name: 'English (US)',
        language: 'en',
        textDirection: 'ltr',
      },
      source: 'fallback',
    });
    return;
  }

  successResponse(res, {
    detected: true,
    locale: {
      code: matchedLocale.code,
      name: matchedLocale.name,
      language: matchedLocale.language,
      countryCode: matchedLocale.countryCode,
      textDirection: matchedLocale.textDirection,
      dateFormat: matchedLocale.dateFormat,
      timeFormat: matchedLocale.timeFormat,
      timeZone: matchedLocale.timeZone,
    },
    source: preferredLanguages.length > 0 ? 'accept-language' : 'default',
  });
};

/**
 * Get locale by code
 * GET /locales/:code
 */
export const getLocaleByCode = async (req: TypedRequest, res: Response): Promise<void> => {
  const { code } = req.params;

  if (!code) {
    errorResponse(res, 'Locale code is required', 400);
    return;
  }

  const locale = await localeRepo.findByCode(code);

  if (!locale || !locale.isActive) {
    errorResponse(res, 'Locale not found', 404);
    return;
  }

  successResponse(res, {
    code: locale.code,
    name: locale.name,
    language: locale.language,
    countryCode: locale.countryCode,
    isDefault: locale.isDefault,
    textDirection: locale.textDirection,
    dateFormat: locale.dateFormat,
    timeFormat: locale.timeFormat,
    timeZone: locale.timeZone,
  });
};

/**
 * Get country by code
 * GET /countries/:code
 */
export const getCountryByCode = async (req: TypedRequest, res: Response): Promise<void> => {
  const { code } = req.params;

  if (!code) {
    errorResponse(res, 'Country code is required', 400);
    return;
  }

  const country = await countryRepo.findByCode(code);

  if (!country || !country.isActive) {
    errorResponse(res, 'Country not found', 404);
    return;
  }

  successResponse(res, {
    code: country.code,
    name: country.name,
    alpha3Code: country.alpha3Code,
    numericCode: country.numericCode,
    flagIcon: country.flagIcon,
    region: country.region,
  });
};

// ============================================================================
// Helper Functions
// ============================================================================

interface ParsedLanguage {
  code: string;
  language: string;
  country?: string;
  quality: number;
}

/**
 * Parse Accept-Language header into sorted list of language preferences
 */
function parseAcceptLanguage(header: string): ParsedLanguage[] {
  if (!header) return [];

  const languages: ParsedLanguage[] = [];

  // Parse each language tag
  header.split(',').forEach(tag => {
    const parts = tag.trim().split(';');
    const locale = parts[0].trim();

    // Parse quality value (default 1.0)
    let quality = 1.0;
    if (parts[1]) {
      const qMatch = parts[1].match(/q=([0-9.]+)/);
      if (qMatch) {
        quality = parseFloat(qMatch[1]);
      }
    }

    if (locale) {
      const [language, country] = locale.split('-');
      languages.push({
        code: locale,
        language,
        country,
        quality,
      });
    }
  });

  // Sort by quality (highest first)
  return languages.sort((a, b) => b.quality - a.quality);
}

/**
 * Find first active locale matching a language code
 */
async function findLocaleByLanguage(language: string): Promise<Locale | null> {
  const locales = await localeRepo.findAll(true);
  return locales.find((l: Locale) => l.language.toLowerCase() === language.toLowerCase()) || null;
}
