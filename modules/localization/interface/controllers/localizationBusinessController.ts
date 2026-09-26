import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse, validationErrorResponse } from '../../../../libs/apiResponse';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';
import { Locale } from '../../../../libs/db/types';
import { manageLocalesUseCase } from '../../application/wired';
import { LocalizationValidationError } from '../../domain/errors/LocalizationErrors';
import type { CountryCreateParams, CountryUpdateParams } from '../../domain/repositories/LocalizationRepository';

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

function useCaseErrorResponse(res: HttpResponse, error: unknown): void {
  if (error instanceof LocalizationValidationError) {
    validationErrorResponse(res, [getErrorMessage(error)]);
    return;
  }
  errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
}

export const getLocales = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { activeOnly = 'true', language, countryCode, currency } = req.query;

  const locales = await manageLocalesUseCase.listLocales({
    activeOnly: activeOnly === 'true',
    language: language as string | undefined,
    countryCode: countryCode as string | undefined,
    currency: currency as string | undefined,
  });

  successResponse(res, locales);
};

export const getLocaleById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.getLocaleById(id));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const getLocaleByCode = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { code } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.getLocaleByCode(code));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const getDefaultLocale = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    successResponse(res, await manageLocalesUseCase.getDefaultLocale());
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const getLocalesByLanguage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { language } = req.params;
  const locales = await manageLocalesUseCase.getLocalesByLanguage(language);
  successResponse(res, locales);
};

export const getLocalesByCountry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { countryCode } = req.params;
  const locales = await manageLocalesUseCase.getLocalesByCountry(countryCode);
  successResponse(res, locales);
};

export const getLocaleStatistics = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const statistics = await manageLocalesUseCase.getStatistics();
  successResponse(res, statistics);
};

export const createLocale = async (
  req: HttpRequest<Record<string, string>, unknown, CreateLocaleBody>,
  res: HttpResponse,
): Promise<void> => {
  const { code, name, language, countryCode, isActive, isDefault, textDirection, dateFormat, timeFormat, timeZone, defaultCurrencyId } =
    req.body;

  try {
    const locale = await manageLocalesUseCase.createLocale({
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
    });
    successResponse(res, locale, 201);
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const updateLocale = async (
  req: HttpRequest<Record<string, string>, unknown, Partial<Omit<Locale, 'code' | 'createdAt' | 'localeId' | 'updatedAt'>>>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.updateLocale(id, req.body));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const deleteLocale = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    await manageLocalesUseCase.deleteLocale(id);
    successResponse(res, { message: 'Locale deleted successfully' });
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const setDefaultLocale = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.setLocaleAsDefault(id));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const activateLocale = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.activateLocale(id));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const deactivateLocale = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.deactivateLocale(id));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

// ---------- COUNTRY METHODS ----------

export const getCountries = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { activeOnly = 'true', region } = req.query;

  const countries = await manageLocalesUseCase.listCountries({
    activeOnly: activeOnly === 'true',
    region: region as string | undefined,
  });

  successResponse(res, countries);
};

export const getCountryById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.getCountryById(id));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const getCountryByCode = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { code } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.getCountryByCode(code));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const getCountriesByRegion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { region } = req.params;
  const countries = await manageLocalesUseCase.getCountriesByRegion(region);
  successResponse(res, countries);
};

export const createCountry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { code, name, numericCode, alpha3Code, defaultCurrencyId, isActive, flagIcon, region } = req.body as CountryCreateParams;

  try {
    const country = await manageLocalesUseCase.createCountry({
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
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const updateCountry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.updateCountry(id, req.body as CountryUpdateParams));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const deleteCountry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    await manageLocalesUseCase.deleteCountry(id);
    successResponse(res, { message: 'Country deleted successfully' });
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const activateCountry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.activateCountry(id));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};

export const deactivateCountry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    successResponse(res, await manageLocalesUseCase.deactivateCountry(id));
  } catch (error) {
    useCaseErrorResponse(res, error);
  }
};
