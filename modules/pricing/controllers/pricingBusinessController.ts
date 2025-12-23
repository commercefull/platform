import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import currencyRepo from '../repos/currencyRepo';
import currencyPriceRuleRepo from '../repos/currencyPriceRuleRepo';
import { CurrencyPriceRule } from '../domain/pricingRule';
import pricingService from '../services/pricingService';

/**
 * Get all currencies
 */
export const getAllCurrencies = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get query params for filtering
    const { includeInactive } = req.query;
    
    // Only show active currencies by default
    const showInactive = includeInactive === 'true';
    
    const currencies = await currencyRepo.getAllCurrencies(showInactive);
    
    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currencies',
      error: (error as Error).message
    });
  }
};

/**
 * Get default currency
 */
export const getDefaultCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const currency = await currencyRepo.getDefaultCurrency();
    
    if (!currency) {
      res.status(404).json({
        success: false,
        message: 'No default currency found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: currency
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default currency',
      error: (error as Error).message
    });
  }
};

/**
 * Get currency by code
 */
export const getCurrencyByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    
    const currency = await pricingService.getCurrency(code);
    
    if (!currency) {
      res.status(404).json({
        success: false,
        message: `Currency with code ${code} not found`
      });
      return;
    }
    
    res.json({
      success: true,
      data: currency
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency',
      error: (error as Error).message
    });
  }
};

/**
 * Save currency
 */
export const saveCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const currencyData = req.body;
    
    // Check if this is an update or a create
    const existingCurrency = await currencyRepo.getCurrencyByCode(currencyData.code);
    
    let result;
    if (existingCurrency) {
      // Update
      result = await currencyRepo.saveCurrency(currencyData);
    } else {
      // Create new
      result = await currencyRepo.saveCurrency(currencyData);
    }
    
    res.status(existingCurrency ? 200 : 201).json({
      success: true,
      data: result,
      message: existingCurrency ? 'Currency updated successfully' : 'Currency created successfully'
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to save currency',
      error: (error as Error).message
    });
  }
};

/**
 * Delete currency
 */
export const deleteCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    
    const currency = await currencyRepo.getCurrencyByCode(code);
    
    if (!currency) {
      res.status(404).json({
        success: false,
        message: `Currency with code ${code} not found`
      });
      return;
    }
    
    // Prevent deleting the default currency
    if (currency.isDefault) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete the default currency'
      });
      return;
    }
    
    await currencyRepo.deleteCurrency(code);
    
    res.json({
      success: true,
      message: 'Currency deleted successfully'
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete currency',
      error: (error as Error).message
    });
  }
};

/**
 * Update exchange rates
 */
export const updateExchangeRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { source } = req.body;
    
    // Update exchange rates from specified source (e.g., API, manual)
    const result = await currencyRepo.updateExchangeRates(source);
    
    res.json({
      success: true,
      data: result,
      message: 'Exchange rates updated successfully'
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update exchange rates',
      error: (error as Error).message
    });
  }
};

/**
 * Get all currency regions
 */
export const getAllCurrencyRegions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeInactive } = req.query;
    
    // Only show active regions by default
    const showInactive = includeInactive === 'true';
    
    const regions = await currencyRepo.getCurrencyRegions(showInactive);
    
    res.json({
      success: true,
      data: regions
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency regions',
      error: (error as Error).message
    });
  }
};

/**
 * Get currency region by ID
 */
export const getCurrencyRegionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const region = await currencyRepo.getCurrencyRegionById(id);
    
    if (!region) {
      res.status(404).json({
        success: false,
        message: `Currency region with ID ${id} not found`
      });
      return;
    }
    
    res.json({
      success: true,
      data: region
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency region',
      error: (error as Error).message
    });
  }
};

/**
 * Create currency region
 */
export const createCurrencyRegion = async (req: Request, res: Response): Promise<void> => {
  try {
    const regionData = req.body;
    
    // Validate required fields
    if (!regionData.code || !regionData.name || !regionData.currencyCode) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: code, name, and currencyCode are required'
      });
      return;
    }
    
    // Check if currency exists
    const currency = await currencyRepo.getCurrencyByCode(regionData.currencyCode);
    
    if (!currency) {
      res.status(400).json({
        success: false,
        message: `Currency with code ${regionData.currencyCode} not found`
      });
      return;
    }
    
    const newRegion = await currencyRepo.createCurrencyRegion(regionData);
    
    res.status(201).json({
      success: true,
      data: newRegion,
      message: 'Currency region created successfully'
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create currency region',
      error: (error as Error).message
    });
  }
};

/**
 * Update currency region
 */
export const updateCurrencyRegion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const regionData = req.body;
    
    // Check if region exists
    const existingRegion = await currencyRepo.getCurrencyRegionById(id);
    
    if (!existingRegion) {
      res.status(404).json({
        success: false,
        message: `Currency region with ID ${id} not found`
      });
      return;
    }
    
    // If currency code is changing, validate new code
    if (regionData.currencyCode && regionData.currencyCode !== existingRegion.currencyCode) {
      const currency = await currencyRepo.getCurrencyByCode(regionData.currencyCode);
      
      if (!currency) {
        res.status(400).json({
          success: false,
          message: `Currency with code ${regionData.currencyCode} not found`
        });
        return;
      }
    }
    
    const updatedRegion = await currencyRepo.updateCurrencyRegion(id, regionData);
    
    res.json({
      success: true,
      data: updatedRegion,
      message: 'Currency region updated successfully'
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update currency region',
      error: (error as Error).message
    });
  }
};

/**
 * Delete currency region
 */
export const deleteCurrencyRegion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if region exists
    const existingRegion = await currencyRepo.getCurrencyRegionById(id);
    
    if (!existingRegion) {
      res.status(404).json({
        success: false,
        message: `Currency region with ID ${id} not found`
      });
      return;
    }
    
    await currencyRepo.deleteCurrencyRegion(id);
    
    res.json({
      success: true,
      message: 'Currency region deleted successfully'
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete currency region',
      error: (error as Error).message
    });
  }
};

/**
 * Get all price rules for currency
 */
export const getAllPriceRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currencyCode, regionCode, includeInactive } = req.query;
    
    // Only show active rules by default
    const showInactive = includeInactive === 'true';
    
    let rules: CurrencyPriceRule[] = [];
    if (currencyCode && regionCode) {
      // Find rules for both currency and region
      const currencyRules = await currencyPriceRuleRepo.findByCurrencyCode(
        currencyCode as string,
        showInactive
      );
      
      // Filter by region code
      rules = currencyRules.filter(rule => rule.regionCode === regionCode);
    } else if (currencyCode) {
      rules = await currencyPriceRuleRepo.findByCurrencyCode(
        currencyCode as string,
        showInactive
      );
    } else {
      // Get all currency rules by combining results from different currencies
      const currencies = await currencyRepo.getAllCurrencies(showInactive);
      rules = [] as CurrencyPriceRule[];
      
      for (const currency of currencies) {
        const currencyRules = await currencyPriceRuleRepo.findByCurrencyCode(
          currency.code,
          showInactive
        );
        rules = [...rules, ...currencyRules];
      }
    }
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price rules',
      error: (error as Error).message
    });
  }
};

/**
 * Get price rule by ID
 */
export const getPriceRuleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const rule = await currencyPriceRuleRepo.findById(id);
    
    if (!rule) {
      res.status(404).json({
        success: false,
        message: `Price rule with ID ${id} not found`
      });
      return;
    }
    
    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price rule',
      error: (error as Error).message
    });
  }
};

/**
 * Create price rule
 */
export const createPriceRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const ruleData: CurrencyPriceRule = req.body;
    
    // Validate required fields
    if (!ruleData.currencyCode || !ruleData.priority === undefined || !ruleData.adjustments || ruleData.adjustments.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: currencyCode, priority, and at least one adjustment are required'
      });
      return;
    }
    
    // Check if currency exists
    const currency = await currencyRepo.getCurrencyByCode(ruleData.currencyCode);
    
    if (!currency) {
      res.status(400).json({
        success: false,
        message: `Currency with code ${ruleData.currencyCode} not found`
      });
      return;
    }
    
    // Check if region exists if specified
    if (ruleData.regionCode) {
      const region = await currencyRepo.getCurrencyRegionByCode(ruleData.regionCode);
      
      if (!region) {
        res.status(400).json({
          success: false,
          message: `Region with code ${ruleData.regionCode} not found`
        });
        return;
      }
    }
    
    const newRule = await currencyPriceRuleRepo.create(ruleData);
    
    res.status(201).json({
      success: true,
      data: newRule,
      message: 'Price rule created successfully'
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create price rule',
      error: (error as Error).message
    });
  }
};

/**
 * Update price rule
 */
export const updatePriceRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ruleData = req.body;
    
    // Check if rule exists
    const existingRule = await currencyPriceRuleRepo.findById(id);
    
    if (!existingRule) {
      res.status(404).json({
        success: false,
        message: `Price rule with ID ${id} not found`
      });
      return;
    }
    
    // If currency code is changing, validate new code
    if (ruleData.currencyCode && ruleData.currencyCode !== existingRule.currencyCode) {
      const currency = await currencyRepo.getCurrencyByCode(ruleData.currencyCode);
      
      if (!currency) {
        res.status(400).json({
          success: false,
          message: `Currency with code ${ruleData.currencyCode} not found`
        });
        return;
      }
    }
    
    // If region code is changing, validate new code
    if (ruleData.regionCode && ruleData.regionCode !== existingRule.regionCode) {
      const region = await currencyRepo.getCurrencyRegionByCode(ruleData.regionCode);
      
      if (!region) {
        res.status(400).json({
          success: false,
          message: `Region with code ${ruleData.regionCode} not found`
        });
        return;
      }
    }
    
    const updatedRule = await currencyPriceRuleRepo.update(id, ruleData);
    
    res.json({
      success: true,
      data: updatedRule,
      message: 'Price rule updated successfully'
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update price rule',
      error: (error as Error).message
    });
  }
};

/**
 * Delete price rule
 */
export const deletePriceRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if rule exists
    const existingRule = await currencyPriceRuleRepo.findById(id);
    
    if (!existingRule) {
      res.status(404).json({
        success: false,
        message: `Price rule with ID ${id} not found`
      });
      return;
    }
    
    await currencyPriceRuleRepo.delete(id);
    
    res.json({
      success: true,
      message: 'Price rule deleted successfully'
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete price rule',
      error: (error as Error).message
    });
  }
};
