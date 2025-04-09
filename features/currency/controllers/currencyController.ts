import { Request, Response } from 'express';
import currencyRepo from '../repos/currencyRepo';
import { Currency } from '../domain/currency';
import axios from 'axios';

class CurrencyController {
  // Currency methods
  
  // Get all currencies
  async getAllCurrencies(req: Request, res: Response): Promise<void | Response> {
    try {
      const { activeOnly } = req.query;
      
      const currencies = await currencyRepo.getAllCurrencies(activeOnly === 'true');
      
      res.json({
        success: true,
        data: currencies
      });
    } catch (error) {
      console.error('Error fetching currencies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch currencies',
        error: (error as Error).message
      });
    }
  }
  
  // Get currency by code
  async getCurrencyByCode(req: Request, res: Response): Promise<void | Response> {
    try {
      const { code } = req.params;
      
      const currency = await currencyRepo.getCurrencyByCode(code);
      
      if (!currency) {
        return res.status(404).json({
          success: false,
          message: `Currency with code ${code} not found`
        });
      }
      
      res.json({
        success: true,
        data: currency
      });
    } catch (error) {
      console.error(`Error fetching currency ${req.params.code}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch currency',
        error: (error as Error).message
      });
    }
  }
  
  // Save (create or update) currency
  async saveCurrency(req: Request, res: Response): Promise<void | Response> {
    try {
      const currencyData: Currency = req.body;
      
      // Validate required fields
      if (!currencyData.code || !currencyData.name || !currencyData.symbol) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: code, name, and symbol are required'
        });
      }
      
      // Normalize code
      currencyData.code = currencyData.code.toUpperCase();
      
      // Set default values
      currencyData.decimals = currencyData.decimals ?? 2;
      currencyData.exchangeRate = currencyData.exchangeRate ?? 1;
      currencyData.lastUpdated = Math.floor(Date.now() / 1000);
      currencyData.format = currencyData.format ?? (currencyData.position === 'after' ? '#,##0.00 ¤' : '¤ #,##0.00');
      currencyData.position = currencyData.position ?? 'before';
      currencyData.thousandsSeparator = currencyData.thousandsSeparator ?? ',';
      currencyData.decimalSeparator = currencyData.decimalSeparator ?? '.';
      
      const savedCurrency = await currencyRepo.saveCurrency(currencyData);
      
      res.json({
        success: true,
        data: savedCurrency,
        message: 'Currency saved successfully'
      });
    } catch (error) {
      console.error('Error saving currency:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save currency',
        error: (error as Error).message
      });
    }
  }
  
  // Delete currency
  async deleteCurrency(req: Request, res: Response): Promise<void | Response> {
    try {
      const { code } = req.params;
      
      // Check if currency exists
      const currency = await currencyRepo.getCurrencyByCode(code);
      
      if (!currency) {
        return res.status(404).json({
          success: false,
          message: `Currency with code ${code} not found`
        });
      }
      
      if (currency.isDefault) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the default currency'
        });
      }
      
      const deleted = await currencyRepo.deleteCurrency(code);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete currency'
        });
      }
      
      res.json({
        success: true,
        message: 'Currency deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting currency ${req.params.code}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete currency',
        error: (error as Error).message
      });
    }
  }
  
  // Update exchange rates from API
  async updateExchangeRates(req: Request, res: Response): Promise<void | Response> {
    try {
      const { source, apiKey } = req.body;
      
      if (!source || !apiKey) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: source and apiKey are required'
        });
      }
      
      // Get default currency to use as base
      const defaultCurrency = await currencyRepo.getDefaultCurrency();
      
      if (!defaultCurrency) {
        return res.status(404).json({
          success: false,
          message: 'No default currency found'
        });
      }
      
      // Get all currencies
      const currencies = await currencyRepo.getAllCurrencies(true);
      
      // Fetch exchange rates from external API
      let exchangeRates: Record<string, number> = {};
      
      switch (source.toLowerCase()) {
        case 'openexchangerates': {
          const response = await axios.get(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=${defaultCurrency.code}`);
          
          if (response.data && response.data.rates) {
            exchangeRates = response.data.rates;
          } else {
            throw new Error('Invalid response from OpenExchangeRates API');
          }
          break;
        }
        case 'exchangerate-api': {
          const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${defaultCurrency.code}`);
          
          if (response.data && response.data.conversion_rates) {
            exchangeRates = response.data.conversion_rates;
          } else {
            throw new Error('Invalid response from ExchangeRate-API');
          }
          break;
        }
        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported exchange rate source'
          });
      }
      
      // Filter and format rates
      const updatedRates: Record<string, number> = {};
      
      for (const currency of currencies) {
        if (currency.code === defaultCurrency.code) {
          // Default currency always has rate of 1
          updatedRates[currency.code] = 1;
        } else if (exchangeRates[currency.code]) {
          updatedRates[currency.code] = exchangeRates[currency.code];
        }
      }
      
      // Update rates in database
      const updatedCount = await currencyRepo.updateExchangeRates(updatedRates);
      
      res.json({
        success: true,
        message: `Successfully updated ${updatedCount} exchange rates`,
        data: { updatedCount, rates: updatedRates }
      });
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exchange rates',
        error: (error as Error).message
      });
    }
  }
  
  // Currency Region methods
  
  // Get all currency regions
  async getAllCurrencyRegions(req: Request, res: Response): Promise<void | Response> {
    try {
      const { activeOnly } = req.query;
      
      const regions = await currencyRepo.getAllCurrencyRegions(activeOnly === 'true');
      
      res.json({
        success: true,
        data: regions
      });
    } catch (error) {
      console.error('Error fetching currency regions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch currency regions',
        error: (error as Error).message
      });
    }
  }
  
  // Get currency region by ID
  async getCurrencyRegionById(req: Request, res: Response): Promise<void | Response> {
    try {
      const { id } = req.params;
      
      const region = await currencyRepo.getCurrencyRegionById(id);
      
      if (!region) {
        return res.status(404).json({
          success: false,
          message: `Currency region with ID ${id} not found`
        });
      }
      
      res.json({
        success: true,
        data: region
      });
    } catch (error) {
      console.error(`Error fetching currency region ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch currency region',
        error: (error as Error).message
      });
    }
  }
  
  // Create currency region
  async createCurrencyRegion(req: Request, res: Response): Promise<void | Response> {
    try {
      const { regionCode, regionName, currencyCode, isActive } = req.body;
      
      // Validate required fields
      if (!regionCode || !regionName || !currencyCode) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: regionCode, regionName, and currencyCode are required'
        });
      }
      
      // Check if currency exists
      const currency = await currencyRepo.getCurrencyByCode(currencyCode);
      
      if (!currency) {
        return res.status(400).json({
          success: false,
          message: `Currency with code ${currencyCode} not found`
        });
      }
      
      // Create region
      const newRegion = await currencyRepo.createCurrencyRegion({
        regionCode,
        regionName,
        currencyCode,
        isActive: isActive !== false
      });
      
      res.status(201).json({
        success: true,
        data: newRegion,
        message: 'Currency region created successfully'
      });
    } catch (error) {
      console.error('Error creating currency region:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create currency region',
        error: (error as Error).message
      });
    }
  }
  
  // Update currency region
  async updateCurrencyRegion(req: Request, res: Response): Promise<void | Response> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Check if region exists
      const existingRegion = await currencyRepo.getCurrencyRegionById(id);
      
      if (!existingRegion) {
        return res.status(404).json({
          success: false,
          message: `Currency region with ID ${id} not found`
        });
      }
      
      // If updating currency, check if it exists
      if (updates.currencyCode) {
        const currency = await currencyRepo.getCurrencyByCode(updates.currencyCode);
        
        if (!currency) {
          return res.status(400).json({
            success: false,
            message: `Currency with code ${updates.currencyCode} not found`
          });
        }
      }
      
      const updatedRegion = await currencyRepo.updateCurrencyRegion(id, updates);
      
      res.json({
        success: true,
        data: updatedRegion,
        message: 'Currency region updated successfully'
      });
    } catch (error) {
      console.error(`Error updating currency region ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to update currency region',
        error: (error as Error).message
      });
    }
  }
  
  // Delete currency region
  async deleteCurrencyRegion(req: Request, res: Response): Promise<void | Response> {
    try {
      const { id } = req.params;
      
      // Check if region exists
      const region = await currencyRepo.getCurrencyRegionById(id);
      
      if (!region) {
        return res.status(404).json({
          success: false,
          message: `Currency region with ID ${id} not found`
        });
      }
      
      const deleted = await currencyRepo.deleteCurrencyRegion(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete currency region'
        });
      }
      
      res.json({
        success: true,
        message: 'Currency region deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting currency region ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete currency region',
        error: (error as Error).message
      });
    }
  }
  
  // Price Rule methods
  
  // Get all price rules
  async getAllPriceRules(req: Request, res: Response): Promise<void | Response> {
    try {
      const { activeOnly } = req.query;
      
      const rules = await currencyRepo.getAllPriceRules(activeOnly === 'true');
      
      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('Error fetching price rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch price rules',
        error: (error as Error).message
      });
    }
  }
  
  // Get price rule by ID
  async getPriceRuleById(req: Request, res: Response): Promise<void | Response> {
    try {
      const { id } = req.params;
      
      const rule = await currencyRepo.getPriceRuleById(id);
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: `Price rule with ID ${id} not found`
        });
      }
      
      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      console.error(`Error fetching price rule ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch price rule',
        error: (error as Error).message
      });
    }
  }
  
  // Create price rule
  async createPriceRule(req: Request, res: Response): Promise<void | Response> {
    try {
      const {
        name,
        description,
        type,
        value,
        currencyCode,
        regionCode,
        priority,
        minOrderValue,
        maxOrderValue,
        startDate,
        endDate,
        isActive
      } = req.body;
      
      // Validate required fields
      if (!name || !type || value === undefined || !currencyCode) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, type, value, and currencyCode are required'
        });
      }
      
      // Validate type
      if (!['fixed', 'percentage', 'exchange'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Type must be one of: fixed, percentage, exchange'
        });
      }
      
      // Check if currency exists
      const currency = await currencyRepo.getCurrencyByCode(currencyCode);
      
      if (!currency) {
        return res.status(400).json({
          success: false,
          message: `Currency with code ${currencyCode} not found`
        });
      }
      
      // Check if region exists (if specified)
      if (regionCode) {
        const region = await currencyRepo.getCurrencyRegionByCode(regionCode);
        
        if (!region) {
          return res.status(400).json({
            success: false,
            message: `Region with code ${regionCode} not found`
          });
        }
      }
      
      // Create rule
      const newRule = await currencyRepo.createPriceRule({
        name,
        description,
        type: type as 'fixed' | 'percentage' | 'exchange',
        value: Number(value),
        currencyCode,
        regionCode,
        priority: priority || 0,
        minOrderValue: minOrderValue !== undefined ? Number(minOrderValue) : undefined,
        maxOrderValue: maxOrderValue !== undefined ? Number(maxOrderValue) : undefined,
        startDate,
        endDate,
        isActive: isActive !== false
      });
      
      res.status(201).json({
        success: true,
        data: newRule,
        message: 'Price rule created successfully'
      });
    } catch (error) {
      console.error('Error creating price rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create price rule',
        error: (error as Error).message
      });
    }
  }
  
  // Update price rule
  async updatePriceRule(req: Request, res: Response): Promise<void | Response> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Check if rule exists
      const existingRule = await currencyRepo.getPriceRuleById(id);
      
      if (!existingRule) {
        return res.status(404).json({
          success: false,
          message: `Price rule with ID ${id} not found`
        });
      }
      
      // Validate type if updating
      if (updates.type && !['fixed', 'percentage', 'exchange'].includes(updates.type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Type must be one of: fixed, percentage, exchange'
        });
      }
      
      // Check if currency exists if updating
      if (updates.currencyCode) {
        const currency = await currencyRepo.getCurrencyByCode(updates.currencyCode);
        
        if (!currency) {
          return res.status(400).json({
            success: false,
            message: `Currency with code ${updates.currencyCode} not found`
          });
        }
      }
      
      // Check if region exists if updating
      if (updates.regionCode) {
        const region = await currencyRepo.getCurrencyRegionByCode(updates.regionCode);
        
        if (!region) {
          return res.status(400).json({
            success: false,
            message: `Region with code ${updates.regionCode} not found`
          });
        }
      }
      
      // Convert numeric strings to numbers if needed
      if (updates.value !== undefined) updates.value = Number(updates.value);
      if (updates.priority !== undefined) updates.priority = Number(updates.priority);
      if (updates.minOrderValue !== undefined) updates.minOrderValue = Number(updates.minOrderValue);
      if (updates.maxOrderValue !== undefined) updates.maxOrderValue = Number(updates.maxOrderValue);
      
      const updatedRule = await currencyRepo.updatePriceRule(id, updates);
      
      res.json({
        success: true,
        data: updatedRule,
        message: 'Price rule updated successfully'
      });
    } catch (error) {
      console.error(`Error updating price rule ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to update price rule',
        error: (error as Error).message
      });
    }
  }
  
  // Delete price rule
  async deletePriceRule(req: Request, res: Response): Promise<void | Response> {
    try {
      const { id } = req.params;
      
      // Check if rule exists
      const rule = await currencyRepo.getPriceRuleById(id);
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: `Price rule with ID ${id} not found`
        });
      }
      
      const deleted = await currencyRepo.deletePriceRule(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete price rule'
        });
      }
      
      res.json({
        success: true,
        message: 'Price rule deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting price rule ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete price rule',
        error: (error as Error).message
      });
    }
  }
}

export default new CurrencyController();
