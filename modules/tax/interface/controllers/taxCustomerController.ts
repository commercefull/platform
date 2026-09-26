import type { HttpRequest, HttpResponse } from 'libs/http';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { manageTaxRecordsUseCase, calculateLineItemTaxUseCase, calculateBasketTaxUseCase } from '../../application/wired';
import type { CalculateLineItemTaxCommand } from '../../application/useCases/CalculateLineItemTax';
import type { CalculateBasketTaxCommand } from '../../application/useCases/CalculateBasketTax';

export const calculateTaxForLineItem = async (req: HttpRequest, res: HttpResponse) => {
  try {
    const taxResult = await calculateLineItemTaxUseCase.execute(req.body as CalculateLineItemTaxCommand);
    res.json(taxResult);
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
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
    res.json(taxResult);
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
  }
};

/**
 * Get a tax category by its code
 */
export const getTaxCategoryByCode = async (req: HttpRequest, res: HttpResponse) => {
  const { code } = req.params;

  if (!code) {
    res.status(400).json({ error: 'Tax category code is required' });
    return;
  }

  // Call repository - returns data with id field already added
  const taxCategory = await manageTaxRecordsUseCase.findTaxCategoryByCode(code);

  if (!taxCategory) {
    res.status(404).json({ error: 'Tax category not found' });
    return;
  }

  res.json(taxCategory);
};

/**
 * Get active tax rates
 */
export const getTaxRates = async (req: HttpRequest, res: HttpResponse) => {
  const { country, region } = req.query;

  // Call repository - returns data with id field already added
  const taxRates = await manageTaxRecordsUseCase.findAllTaxRates(true, country as string, region as string);

  res.json(taxRates);
};

/**
 * Check if a customer has tax exemptions
 */
export const checkCustomerTaxExemption = async (req: HttpRequest, res: HttpResponse) => {
  const { customerId } = req.params;

  if (!customerId) {
    res.status(400).json({ error: 'Customer ID is required' });
    return;
  }

  // Repository returns data with id field already added
  const exemptions = await manageTaxRecordsUseCase.findTaxExemptionsByCustomerId(customerId);

  // Format response in camelCase as per platform convention
  res.json({
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
    res.status(400).json({ error: 'Country is required' });
    return;
  }

  // Find the actual tax zone for this address
  const taxZone = await manageTaxRecordsUseCase.findTaxZoneForAddress(country, region, postalCode, city);

  if (!taxZone) {
    res.status(404).json({ error: 'No matching tax zone found' });
    return;
  }

  res.json(taxZone);
};

/**
 * Get customer tax settings (for display on storefront)
 */
export const getCustomerTaxSettings = async (req: HttpRequest, res: HttpResponse) => {
  const { organizationId } = req.params;

  if (!organizationId) {
    res.status(400).json({ error: 'Merchant ID is required' });
    return;
  }

  //  default settings for now
  // The enhanced method will be implemented in taxRepo
  // Note: This is using camelCase for the API response as per our convention
  res.json({
    displayPricesWithTax: false,
    priceDisplaySettings: {
      includesTax: false,
      showTaxSeparately: true,
    },
  });
};
