import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { manageTaxRecordsUseCase, calculateLineItemTaxUseCase, calculateBasketTaxUseCase } from '../../application/wired';
import type { CalculateLineItemTaxCommand } from '../../application/useCases/CalculateLineItemTax';
import type { CalculateBasketTaxCommand } from '../../application/useCases/CalculateBasketTax';

export const calculateTaxForLineItem = async (req: HttpRequest, res: HttpResponse) => {
  try {
    const taxResult = await calculateLineItemTaxUseCase.execute(req.body as CalculateLineItemTaxCommand);
    jsonResponse(res, 200, taxResult);
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { error: getErrorMessage(error) });
  }
};

/**
 * Calculate tax for an entire basket
 */
export const calculateTaxForBasket = async (req: HttpRequest, res: HttpResponse) => {
  const { basketId } = req.params;

  try {
    const taxResult = await calculateBasketTaxUseCase.execute({
      ...(req.body as CalculateBasketTaxCommand),
      basketId,
    });
    jsonResponse(res, 200, taxResult);
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { error: getErrorMessage(error) });
  }
};

/**
 * Get a tax category by its code
 */
export const getTaxCategoryByCode = async (req: HttpRequest, res: HttpResponse) => {
  const { code } = req.params;

  if (!code) {
    jsonResponse(res, 400, { error: 'Tax category code is required' });
    return;
  }

  // Call repository - returns data with id field already added
  const taxCategory = await manageTaxRecordsUseCase.findTaxCategoryByCode(code);

  if (!taxCategory) {
    jsonResponse(res, 404, { error: 'Tax category not found' });
    return;
  }

  jsonResponse(res, 200, taxCategory);
};

/**
 * Get active tax rates
 */
export const getTaxRates = async (req: HttpRequest, res: HttpResponse) => {
  const { country, region } = req.query;

  // Call repository - returns data with id field already added
  const taxRates = await manageTaxRecordsUseCase.findAllTaxRates(true, country as string, region as string);

  jsonResponse(res, 200, taxRates);
};

/**
 * Check if a customer has tax exemptions
 */
export const checkCustomerTaxExemption = async (req: HttpRequest, res: HttpResponse) => {
  const { customerId } = req.params;

  if (!customerId) {
    jsonResponse(res, 400, { error: 'Customer ID is required' });
    return;
  }

  // Repository returns data with id field already added
  const exemptions = await manageTaxRecordsUseCase.findTaxExemptionsByCustomerId(customerId);

  // Format response in camelCase as per platform convention
  jsonResponse(res, 200, {
    hasExemption: exemptions.length > 0,
    exemptions,
  });
};

/**
 * Find the tax zone for a given address
 */
export const findTaxZoneForAddress = async (req: HttpRequest, res: HttpResponse) => {
  const body = req.body as { country?: string; region?: string; postalCode?: string; city?: string };
  const { country, region, postalCode, city } = body;

  if (!country) {
    jsonResponse(res, 400, { error: 'Country is required' });
    return;
  }

  // Find the actual tax zone for this address
  const taxZone = await manageTaxRecordsUseCase.findTaxZoneForAddress(country, region, postalCode, city);

  if (!taxZone) {
    jsonResponse(res, 404, { error: 'No matching tax zone found' });
    return;
  }

  jsonResponse(res, 200, taxZone);
};

/**
 * Get customer tax settings (for display on storefront)
 */
export const getCustomerTaxSettings = async (req: HttpRequest, res: HttpResponse) => {
  const { organizationId } = req.params;

  if (!organizationId) {
    jsonResponse(res, 400, { error: 'Merchant ID is required' });
    return;
  }

  //  default settings for now
  // The enhanced method will be implemented in taxRepo
  // Note: This is using camelCase for the API response as per our convention
  jsonResponse(res, 200, {
    displayPricesWithTax: false,
    priceDisplaySettings: {
      includesTax: false,
      showTaxSeparately: true,
    },
  });
};
