import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import LocaleRepo from '../../infrastructure/repositories/localeRepo';
import CountryRepo from '../../infrastructure/repositories/countryRepo';
import { successResponse, errorResponse, validationErrorResponse } from '../../../../libs/apiResponse';
import { Locale } from '../../../../libs/db/types';
import { CountryCreateParams, CountryUpdateParams } from '../../infrastructure/repositories/countryRepo';

interface CreateLocaleBody {
  code: string;
  name: string;
  nativeName?: string;
  language: string;
  countryCode?: string;
  isActive?: boolean;
  isDefault?: boolean;
  textDirection?: string;
  dateFormat?: string;
  timeFormat?: string;
  timeZone?: string;
  defaultCurrencyId?: string;
  numberFormat?: Record<string, unknown> | null;
  fallbackLocaleId?: string | null;
  flagIcon?: string | null;
}

const localeRepo = LocaleRepo;

export const getLocales = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { activeOnly = 'true', language, countryCode, currency } = req.query;

    let locales;

    if (language) {
      locales = await localeRepo.findByLanguage(language as string);
    } else if (countryCode) {
      locales = await localeRepo.findByCountryCode(countryCode as string);
    } else if (currency) {
      locales = await localeRepo.findByCurrency(currency as string);
    } else {
      locales = await localeRepo.findAll(activeOnly === 'true');
    }

    successResponse(res, locales);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locales');
  }
};

export const getLocaleById = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const locale = await localeRepo.findById(id);

    if (!locale) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locale');
  }
};

export const getLocaleByCode = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const locale = await localeRepo.findByCode(code);

    if (!locale) {
      errorResponse(res, `Locale with code ${code} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locale');
  }
};

export const getDefaultLocale = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const locale = await localeRepo.findDefault();

    if (!locale) {
      errorResponse(res, 'No default locale found', 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch default locale');
  }
};

export const getLocalesByLanguage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { language } = req.params;
    const locales = await localeRepo.findByLanguage(language);
    successResponse(res, locales);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locales');
  }
};

export const getLocalesByCountry = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { countryCode } = req.params;
    const locales = await localeRepo.findByCountryCode(countryCode);
    successResponse(res, locales);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locales');
  }
};

export const getLocaleStatistics = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const statistics = await localeRepo.getStatistics();
    successResponse(res, statistics);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locale statistics');
  }
};

export const createLocale = async (req: TypedRequest<Record<string, string>, unknown, CreateLocaleBody>, res: Response): Promise<void> => {
  try {
    const { code, name, language, countryCode, isActive, isDefault, textDirection, dateFormat, timeFormat, timeZone, defaultCurrencyId } =
      req.body;

    // Validate required fields
    const errors: string[] = [];
    if (!code) errors.push('code is required');
    if (!name) errors.push('name is required');
    if (!language) errors.push('language is required');

    if (errors.length > 0) {
      validationErrorResponse(res, errors);
      return;
    }

    const localeParams = {
      code,
      name,
      nativeName: req.body.nativeName || null,
      language,
      countryCode: countryCode || null,
      isActive: isActive ?? true,
      isDefault: isDefault ?? false,
      textDirection: textDirection || 'ltr',
      dateFormat: dateFormat || 'YYYY-MM-DD',
      timeFormat: timeFormat || 'HH:mm:ss',
      timeZone: timeZone || 'UTC',
      defaultCurrencyId: defaultCurrencyId || null,
      numberFormat: req.body.numberFormat || null,
      fallbackLocaleId: req.body.fallbackLocaleId || null,
      flagIcon: req.body.flagIcon || null,
    };

    const locale = await localeRepo.create(localeParams);
    successResponse(res, locale, 201);
  } catch (error: unknown) {
    logger.error('Error:', error);

    if ((error as Error).message.includes('already exists')) {
      errorResponse(res, (error as Error).message, 409);
    } else {
      errorResponse(res, 'Failed to create locale');
    }
  }
};

export const updateLocale = async (req: TypedRequest<Record<string, string>, unknown, Partial<Omit<Locale, 'code' | 'createdAt' | 'localeId' | 'updatedAt'>>>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateParams = req.body;

    const locale = await localeRepo.update(id, updateParams);

    if (!locale) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update locale');
  }
};

export const deleteLocale = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await localeRepo.delete(id);

    if (!deleted) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, { message: 'Locale deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to delete locale');
  }
};

export const setDefaultLocale = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const locale = await localeRepo.setAsDefault(id);

    if (!locale) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to set default locale');
  }
};

export const activateLocale = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const locale = await localeRepo.activate(id);

    if (!locale) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to activate locale');
  }
};

export const deactivateLocale = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const locale = await localeRepo.deactivate(id);

    if (!locale) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to deactivate locale');
  }
};

// ---------- COUNTRY METHODS ----------

export const getCountries = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { activeOnly = 'true', region } = req.query;

    let countries;
    if (region) {
      countries = await CountryRepo.findByRegion(region as string);
    } else {
      countries = await CountryRepo.findAll(activeOnly === 'true');
    }

    successResponse(res, countries);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch countries');
  }
};

export const getCountryById = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const country = await CountryRepo.findById(id);

    if (!country) {
      errorResponse(res, `Country with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, country);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch country');
  }
};

export const getCountryByCode = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const country = await CountryRepo.findByCode(code);

    if (!country) {
      errorResponse(res, `Country with code ${code} not found`, 404);
      return;
    }

    successResponse(res, country);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch country');
  }
};

export const getCountriesByRegion = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { region } = req.params;
    const countries = await CountryRepo.findByRegion(region);
    successResponse(res, countries);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch countries');
  }
};

export const createCountry = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { code, name, numericCode, alpha3Code, defaultCurrencyId, isActive, flagIcon, region } = req.body as CountryCreateParams;

    const errors: string[] = [];
    if (!code) errors.push('code is required');
    if (!name) errors.push('name is required');

    if (errors.length > 0) {
      validationErrorResponse(res, errors);
      return;
    }

    const country = await CountryRepo.create({
      code,
      name,
      numericCode,
      alpha3Code,
      defaultCurrencyId,
      isActive: isActive ?? true,
      flagIcon,
      region,
    });

    successResponse(res, country, 201);
  } catch (error: unknown) {
    logger.error('Error:', error);

    if ((error as Error).message.includes('already exists')) {
      errorResponse(res, (error as Error).message, 409);
    } else {
      errorResponse(res, 'Failed to create country');
    }
  }
};

export const updateCountry = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const country = await CountryRepo.update(id, req.body as CountryUpdateParams);

    if (!country) {
      errorResponse(res, `Country with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, country);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update country');
  }
};

export const deleteCountry = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await CountryRepo.delete(id);

    if (!deleted) {
      errorResponse(res, `Country with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, { message: 'Country deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to delete country');
  }
};

export const activateCountry = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const country = await CountryRepo.activate(id);

    if (!country) {
      errorResponse(res, `Country with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, country);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to activate country');
  }
};

export const deactivateCountry = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const country = await CountryRepo.deactivate(id);

    if (!country) {
      errorResponse(res, `Country with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, country);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to deactivate country');
  }
};
