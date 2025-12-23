import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import LocaleRepo from '../repos/localeRepo';
import { successResponse, errorResponse, validationErrorResponse } from '../../../libs/apiResponse';

const localeRepo = LocaleRepo;

export const getLocales = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locales');
  }
};

export const getLocaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const locale = await localeRepo.findById(id);

    if (!locale) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locale');
  }
};

export const getLocaleByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const locale = await localeRepo.findByCode(code);

    if (!locale) {
      errorResponse(res, `Locale with code ${code} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locale');
  }
};

export const getDefaultLocale = async (req: Request, res: Response): Promise<void> => {
  try {
    const locale = await localeRepo.findDefault();

    if (!locale) {
      errorResponse(res, 'No default locale found', 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch default locale');
  }
};

export const getLocalesByLanguage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { language } = req.params;
    const locales = await localeRepo.findByLanguage(language);
    successResponse(res, locales);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locales');
  }
};

export const getLocalesByCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { countryCode } = req.params;
    const locales = await localeRepo.findByCountryCode(countryCode);
    successResponse(res, locales);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locales');
  }
};

export const getLocaleStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const statistics = await localeRepo.getStatistics();
    successResponse(res, statistics);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch locale statistics');
  }
};

export const createLocale = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error('Error:', error);

    if (error.message.includes('already exists')) {
      errorResponse(res, error.message, 409);
    } else {
      errorResponse(res, 'Failed to create locale');
    }
  }
};

export const updateLocale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateParams = req.body;

    const locale = await localeRepo.update(id, updateParams);

    if (!locale) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update locale');
  }
};

export const deleteLocale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await localeRepo.delete(id);

    if (!deleted) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, { message: 'Locale deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to delete locale');
  }
};

export const setDefaultLocale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const locale = await localeRepo.setAsDefault(id);

    if (!locale) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to set default locale');
  }
};

export const activateLocale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const locale = await localeRepo.activate(id);

    if (!locale) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to activate locale');
  }
};

export const deactivateLocale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const locale = await localeRepo.deactivate(id);

    if (!locale) {
      errorResponse(res, `Locale with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, locale);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to deactivate locale');
  }
};

// ---------- COUNTRY METHODS ----------

export const getCountries = async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Implement when country repo is available
    successResponse(res, []);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch countries');
  }
};

export const getCountryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when country repo is available
    successResponse(res, {});
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch country');
  }
};

export const getCountryByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    // TODO: Implement when country repo is available
    successResponse(res, {});
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch country');
  }
};

export const getCountriesByRegion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { region } = req.params;
    // TODO: Implement when country repo is available
    successResponse(res, []);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch countries');
  }
};

export const createCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Implement when country repo is available
    successResponse(res, {}, 201);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to create country');
  }
};

export const updateCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when country repo is available
    successResponse(res, {});
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update country');
  }
};

export const deleteCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when country repo is available
    successResponse(res, { message: 'Country deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to delete country');
  }
};

export const activateCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when country repo is available
    successResponse(res, {});
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to activate country');
  }
};

export const deactivateCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when country repo is available
    successResponse(res, {});
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to deactivate country');
  }
};
