import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import currencyRepository from '../../infrastructure/repositories/CurrencyRepository';
import pricingRuleRepository from '../../infrastructure/repositories/PricingRuleRepository';
import { CurrencyPriceRule, CurrencyPriceRuleCreateProps, CurrencyPriceRuleUpdateProps } from '../../domain/pricingRule';
import { Currency, CurrencyRegion } from '../../domain/currency';
import pricingService from '../../application/pricingService';

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
export const getAllCurrencies = async (req: TypedRequest, res: Response): Promise<void> => {
  // Get query params for filtering
  const { includeInactive } = req.query;

  // Only show active currencies by default
  const showInactive = includeInactive === 'true';

  const currencies = await currencyRepository.currencies.getAllCurrencies(showInactive);

  res.json({
    success: true,
    data: currencies,
  });
  
};

/**
 * Get default currency
 */
export const getDefaultCurrency = async (req: TypedRequest, res: Response): Promise<void> => {
  const currency = await currencyRepository.currencies.getDefaultCurrency();

  if (!currency) {
    res.status(404).json({
      success: false,
      message: 'No default currency found',
    });
    return;
  }

  res.json({
    success: true,
    data: currency,
  });
  
};

/**
 * Get currency by code
 */
export const getCurrencyByCode = async (req: TypedRequest, res: Response): Promise<void> => {
  const { code } = req.params;

  const currency = await pricingService.getCurrency(code);

  if (!currency) {
    res.status(404).json({
      success: false,
      message: `Currency with code ${code} not found`,
    });
    return;
  }

  res.json({
    success: true,
    data: currency,
  });
  
};

/**
 * Save currency
 */
export const saveCurrency = async (req: TypedRequest<Record<string, string>, unknown, Currency>, res: Response): Promise<void> => {
  const currencyData = req.body;

  // Check if this is an update or a create
  const existingCurrency = await currencyRepository.currencies.getCurrencyByCode(currencyData.code);

  let result;
  if (existingCurrency) {
    // Update
    result = await currencyRepository.currencies.saveCurrency(currencyData);
  } else {
    // Create new
    result = await currencyRepository.currencies.saveCurrency(currencyData);
  }

  res.status(existingCurrency ? 200 : 201).json({
    success: true,
    data: result,
    message: existingCurrency ? 'Currency updated successfully' : 'Currency created successfully',
  });
  
};

/**
 * Delete currency
 */
export const deleteCurrency = async (req: TypedRequest, res: Response): Promise<void> => {
  const { code } = req.params;

  const currency = await currencyRepository.currencies.getCurrencyByCode(code);

  if (!currency) {
    res.status(404).json({
      success: false,
      message: `Currency with code ${code} not found`,
    });
    return;
  }

  // Prevent deleting the default currency
  if (currency.isDefault) {
    res.status(400).json({
      success: false,
      message: 'Cannot delete the default currency',
    });
    return;
  }

  await currencyRepository.currencies.deleteCurrency(code);

  res.json({
    success: true,
    message: 'Currency deleted successfully',
  });
  
};

/**
 * Update exchange rates
 */
export const updateExchangeRates = async (req: TypedRequest<Record<string, string>, unknown, ExchangeRateBody>, res: Response): Promise<void> => {
  const { source } = req.body;

  // Update exchange rates from specified source (e.g., API, manual)
  const result = await currencyRepository.currencies.updateExchangeRates(source);

  res.json({
    success: true,
    data: result,
    message: 'Exchange rates updated successfully',
  });
  
};

/**
 * Get all currency regions
 */
export const getAllCurrencyRegions = async (req: TypedRequest, res: Response): Promise<void> => {
  const { includeInactive } = req.query;

  // Only show active regions by default
  const showInactive = includeInactive === 'true';

  const regions = await currencyRepository.currencies.getCurrencyRegions(showInactive);

  res.json({
    success: true,
    data: regions,
  });
  
};

/**
 * Get currency region by ID
 */
export const getCurrencyRegionById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const region = await currencyRepository.currencies.getCurrencyRegionById(id);

  if (!region) {
    res.status(404).json({
      success: false,
      message: `Currency region with ID ${id} not found`,
    });
    return;
  }

  res.json({
    success: true,
    data: region,
  });
  
};

/**
 * Create currency region
 */
export const createCurrencyRegion = async (req: TypedRequest<Record<string, string>, unknown, CurrencyRegion>, res: Response): Promise<void> => {
  const regionData = req.body;

  // Validate required fields
  if (!regionData.code || !regionData.name || !regionData.currencyCode) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields: code, name, and currencyCode are required',
    });
    return;
  }

  // Check if currency exists
  const currency = await currencyRepository.currencies.getCurrencyByCode(regionData.currencyCode);

  if (!currency) {
    res.status(400).json({
      success: false,
      message: `Currency with code ${regionData.currencyCode} not found`,
    });
    return;
  }

  const newRegion = await currencyRepository.currencies.createCurrencyRegion(regionData);

  res.status(201).json({
    success: true,
    data: newRegion,
    message: 'Currency region created successfully',
  });
  
};

/**
 * Update currency region
 */
export const updateCurrencyRegion = async (req: TypedRequest<Record<string, string>, unknown, Partial<CurrencyRegion>>, res: Response): Promise<void> => {
  const { id } = req.params;
  const regionData = req.body;

  // Check if region exists
  const existingRegion = await currencyRepository.currencies.getCurrencyRegionById(id);

  if (!existingRegion) {
    res.status(404).json({
      success: false,
      message: `Currency region with ID ${id} not found`,
    });
    return;
  }

  // If currency code is changing, validate new code
  if (regionData.currencyCode && regionData.currencyCode !== existingRegion.currencyCode) {
    const currency = await currencyRepository.currencies.getCurrencyByCode(regionData.currencyCode);

    if (!currency) {
      res.status(400).json({
        success: false,
        message: `Currency with code ${regionData.currencyCode} not found`,
      });
      return;
    }
  }

  const updatedRegion = await currencyRepository.currencies.updateCurrencyRegion(id, regionData);

  res.json({
    success: true,
    data: updatedRegion,
    message: 'Currency region updated successfully',
  });
  
};

/**
 * Delete currency region
 */
export const deleteCurrencyRegion = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if region exists
  const existingRegion = await currencyRepository.currencies.getCurrencyRegionById(id);

  if (!existingRegion) {
    res.status(404).json({
      success: false,
      message: 'Currency region not found',
    });
    return;
  }

  await currencyRepository.currencies.deleteCurrencyRegion(id);

  res.json({
    success: true,
    message: 'Currency region deleted successfully',
  });
};

/**
 * Get all price rules
 */
export const getAllPriceRules = async (req: TypedRequest, res: Response): Promise<void> => {
  const { currencyCode, includeInactive } = req.query;
  const showInactive = includeInactive === 'true';

  let rules: CurrencyPriceRule[];
  if (currencyCode) {
    rules = await pricingRuleRepository.currencyPriceRules.findByCurrencyCode(currencyCode as string, showInactive);
  } else {
    const currencies = await currencyRepository.currencies.getAllCurrencies(showInactive);
    rules = [] as CurrencyPriceRule[];
    for (const currency of currencies) {
      const currencyRules = await pricingRuleRepository.currencyPriceRules.findByCurrencyCode(currency.code, showInactive);
      rules.push(...currencyRules);
    }
  }

  res.json({ success: true, data: rules });
};

/**
 * Get price rule by ID
 */
export const getPriceRuleById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const rule = await pricingRuleRepository.currencyPriceRules.findById(id);

  if (!rule) {
    res.status(404).json({ success: false, message: `Price rule with ID ${id} not found` });
    return;
  }

  res.json({ success: true, data: rule });
};

/**
 * Create price rule
 */
export const createPriceRule = async (req: TypedRequest<Record<string, string>, unknown, CurrencyPriceRuleBody>, res: Response): Promise<void> => {
  const ruleData = req.body;

  // Validate required fields
  if (!ruleData.currencyCode || ruleData.priority === undefined || !ruleData.adjustments || ruleData.adjustments.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields: currencyCode, priority, and at least one adjustment are required',
    });
    return;
  }

  // Check if currency exists
  const currency = await currencyRepository.currencies.getCurrencyByCode(ruleData.currencyCode);

  if (!currency) {
    res.status(400).json({
      success: false,
      message: 'Currency not found',
    });
    return;
  }

  // Check if region exists if specified
  if (ruleData.regionCode) {
    const region = await currencyRepository.currencies.getCurrencyRegionByCode(ruleData.regionCode);

    if (!region) {
      res.status(400).json({
        success: false,
        message: `Region with code ${ruleData.regionCode} not found`,
      });
      return;
    }
  }

  const newRule = await pricingRuleRepository.currencyPriceRules.create(ruleData as CurrencyPriceRuleCreateProps);

  res.status(201).json({
    success: true,
    data: newRule,
    message: 'Price rule created successfully',
  });
  
};

/**
 * Update price rule
 */
export const updatePriceRule = async (req: TypedRequest<Record<string, string>, unknown, CurrencyPriceRuleBody>, res: Response): Promise<void> => {
  const { id } = req.params;
  const ruleData = req.body;

  // Check if rule exists
  const existingRule = await pricingRuleRepository.currencyPriceRules.findById(id);

  if (!existingRule) {
    res.status(404).json({
      success: false,
      message: `Price rule with ID ${id} not found`,
    });
    return;
  }

  // If currency code is changing, validate new code
  if (ruleData.currencyCode && ruleData.currencyCode !== existingRule.currencyCode) {
    const currency = await currencyRepository.currencies.getCurrencyByCode(ruleData.currencyCode);

    if (!currency) {
      res.status(400).json({
        success: false,
        message: `Currency with code ${ruleData.currencyCode} not found`,
      });
      return;
    }
  }

  // If region code is changing, validate new code
  if (ruleData.regionCode && ruleData.regionCode !== existingRule.regionCode) {
    const region = await currencyRepository.currencies.getCurrencyRegionByCode(ruleData.regionCode);

    if (!region) {
      res.status(400).json({
        success: false,
        message: `Region with code ${ruleData.regionCode} not found`,
      });
      return;
    }
  }

  const updatedRule = await pricingRuleRepository.currencyPriceRules.update(id, ruleData as CurrencyPriceRuleUpdateProps);

  res.json({
    success: true,
    data: updatedRule,
    message: 'Price rule updated successfully',
  });
  
};

/**
 * Delete price rule
 */
export const deletePriceRule = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if rule exists
  const existingRule = await pricingRuleRepository.currencyPriceRules.findById(id);

  if (!existingRule) {
    res.status(404).json({
      success: false,
      message: `Price rule with ID ${id} not found`,
    });
    return;
  }

  await pricingRuleRepository.currencyPriceRules.delete(id);

  res.json({
    success: true,
    message: 'Price rule deleted successfully',
  });
  
};
