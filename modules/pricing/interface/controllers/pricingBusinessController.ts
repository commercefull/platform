import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { CurrencyPriceRule, CurrencyPriceRuleCreateProps, CurrencyPriceRuleUpdateProps } from '../../domain/pricingRule';
import { Currency, CurrencyRegion } from '../../domain/currency';
import {
  managePricingAdminUseCase,
  getCurrencyUseCase,
  saveCurrencyUseCase,
  deleteCurrencyUseCase,
  createCurrencyRegionUseCase,
  updateCurrencyRegionUseCase,
  createCurrencyPriceRuleUseCase,
  updateCurrencyPriceRuleUseCase,
} from '../../application/wired';

interface ExchangeRateBody {
  source: string;
}

interface CurrencyPriceRuleBody {
  currencyCode: string;
  regionCode?: string;
  priority?: number;
  adjustments?: { type: string; value: number }[];
  [key: string]: unknown;
}

/**
 * Get all currencies
 */
export const getAllCurrencies = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  // Get query params for filtering
  const { includeInactive } = req.query;

  // Only show active currencies by default
  const showInactive = includeInactive === 'true';

  const currencies = await managePricingAdminUseCase.getAllCurrencies(showInactive);

  jsonResponse(res, 200, {
    success: true,
    data: currencies,
  });
};

/**
 * Get default currency
 */
export const getDefaultCurrency = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const currency = await managePricingAdminUseCase.getDefaultCurrency();

  if (!currency) {
    jsonResponse(res, 404, {
      success: false,
      message: 'No default currency found',
    });
    return;
  }

  jsonResponse(res, 200, {
    success: true,
    data: currency,
  });
};

/**
 * Get currency by code
 */
export const getCurrencyByCode = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { code } = req.params;

  const currency = await getCurrencyUseCase.execute(code);

  if (!currency) {
    jsonResponse(res, 404, {
      success: false,
      message: `Currency with code ${code} not found`,
    });
    return;
  }

  jsonResponse(res, 200, {
    success: true,
    data: currency,
  });
};

/**
 * Save currency
 */
export const saveCurrency = async (req: HttpRequest<Record<string, string>, unknown, Currency>, res: HttpResponse): Promise<void> => {
  try {
    const result = await saveCurrencyUseCase.execute(req.body);

    jsonResponse(res, result.created ? 201 : 200, {
      success: true,
      data: result.currency,
      message: result.created ? 'Currency created successfully' : 'Currency updated successfully',
    });
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
  }
};

/**
 * Delete currency
 */
export const deleteCurrency = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { code } = req.params;

  try {
    await deleteCurrencyUseCase.execute(code);

    jsonResponse(res, 200, {
      success: true,
      message: 'Currency deleted successfully',
    });
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
  }
};

/**
 * Update exchange rates
 */
export const updateExchangeRates = async (
  req: HttpRequest<Record<string, string>, unknown, ExchangeRateBody>,
  res: HttpResponse,
): Promise<void> => {
  const { source } = req.body;

  // Update exchange rates from specified source (e.g., API, manual)
  const result = await managePricingAdminUseCase.updateExchangeRates(source);

  jsonResponse(res, 200, {
    success: true,
    data: result,
    message: 'Exchange rates updated successfully',
  });
};

/**
 * Get all currency regions
 */
export const getAllCurrencyRegions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { includeInactive } = req.query;

  // Only show active regions by default
  const showInactive = includeInactive === 'true';

  const regions = await managePricingAdminUseCase.getCurrencyRegions(showInactive);

  jsonResponse(res, 200, {
    success: true,
    data: regions,
  });
};

/**
 * Get currency region by ID
 */
export const getCurrencyRegionById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  const region = await managePricingAdminUseCase.getCurrencyRegionById(id);

  if (!region) {
    jsonResponse(res, 404, {
      success: false,
      message: `Currency region with ID ${id} not found`,
    });
    return;
  }

  jsonResponse(res, 200, {
    success: true,
    data: region,
  });
};

/**
 * Create currency region
 */
export const createCurrencyRegion = async (
  req: HttpRequest<Record<string, string>, unknown, CurrencyRegion>,
  res: HttpResponse,
): Promise<void> => {
  try {
    const newRegion = await createCurrencyRegionUseCase.execute(req.body);

    jsonResponse(res, 201, {
      success: true,
      data: newRegion,
      message: 'Currency region created successfully',
    });
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
  }
};

/**
 * Update currency region
 */
export const updateCurrencyRegion = async (
  req: HttpRequest<Record<string, string>, unknown, Partial<CurrencyRegion>>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;

  try {
    const updatedRegion = await updateCurrencyRegionUseCase.execute(id, req.body);

    jsonResponse(res, 200, {
      success: true,
      data: updatedRegion,
      message: 'Currency region updated successfully',
    });
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
  }
};

/**
 * Delete currency region
 */
export const deleteCurrencyRegion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  // Check if region exists
  const existingRegion = await managePricingAdminUseCase.getCurrencyRegionById(id);

  if (!existingRegion) {
    jsonResponse(res, 404, {
      success: false,
      message: 'Currency region not found',
    });
    return;
  }

  await managePricingAdminUseCase.deleteCurrencyRegion(id);

  jsonResponse(res, 200, {
    success: true,
    message: 'Currency region deleted successfully',
  });
};

/**
 * Get all price rules
 */
export const getAllPriceRules = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { currencyCode, includeInactive } = req.query;
  const showInactive = includeInactive === 'true';

  const rules: CurrencyPriceRule[] = await managePricingAdminUseCase.getAllPriceRules(currencyCode as string | undefined, showInactive);

  jsonResponse(res, 200, { success: true, data: rules });
};

/**
 * Get price rule by ID
 */
export const getPriceRuleById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const rule = await managePricingAdminUseCase.findCurrencyPriceRuleById(id);

  if (!rule) {
    jsonResponse(res, 404, { success: false, message: `Price rule with ID ${id} not found` });
    return;
  }

  jsonResponse(res, 200, { success: true, data: rule });
};

/**
 * Create price rule
 */
export const createPriceRule = async (
  req: HttpRequest<Record<string, string>, unknown, CurrencyPriceRuleBody>,
  res: HttpResponse,
): Promise<void> => {
  try {
    const newRule = await createCurrencyPriceRuleUseCase.execute(req.body as CurrencyPriceRuleCreateProps);

    jsonResponse(res, 201, {
      success: true,
      data: newRule,
      message: 'Price rule created successfully',
    });
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
  }
};

/**
 * Update price rule
 */
export const updatePriceRule = async (
  req: HttpRequest<Record<string, string>, unknown, CurrencyPriceRuleBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;

  try {
    const updatedRule = await updateCurrencyPriceRuleUseCase.execute(id, req.body as CurrencyPriceRuleUpdateProps);

    jsonResponse(res, 200, {
      success: true,
      data: updatedRule,
      message: 'Price rule updated successfully',
    });
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
  }
};

/**
 * Delete price rule
 */
export const deletePriceRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  // Check if rule exists
  const existingRule = await managePricingAdminUseCase.findCurrencyPriceRuleById(id);

  if (!existingRule) {
    jsonResponse(res, 404, {
      success: false,
      message: `Price rule with ID ${id} not found`,
    });
    return;
  }

  await managePricingAdminUseCase.deleteCurrencyPriceRule(id);

  jsonResponse(res, 200, {
    success: true,
    message: 'Price rule deleted successfully',
  });
};
