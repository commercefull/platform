import { Request, Response } from 'express';
import currencyRepo from '../repos/currencyRepo';
import { convertCurrency, applyPriceRules, formatCurrency } from '../domain/currency';
import { detectCountry } from '../../../libs/geoip';

class CurrencyPublicController {
  // Get available currencies
  async getAvailableCurrencies(req: Request, res: Response): Promise<void | Response> {
    try {
      // Only return active currencies
      const currencies = await currencyRepo.getAllCurrencies(true);
      
      res.json({
        success: true,
        data: currencies
      });
    } catch (error) {
      console.error('Error fetching available currencies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available currencies',
        error: (error as Error).message
      });
    }
  }
  
  // Get store's default currency
  async getDefaultCurrency(req: Request, res: Response): Promise<void | Response> {
    try {
      const defaultCurrency = await currencyRepo.getDefaultCurrency();
      
      if (!defaultCurrency) {
        return res.status(404).json({
          success: false,
          message: 'Default currency not found'
        });
      }
      
      res.json({
        success: true,
        data: defaultCurrency
      });
    } catch (error) {
      console.error('Error fetching default currency:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch default currency',
        error: (error as Error).message
      });
    }
  }
  
  // Get region currency settings
  async getRegionCurrency(req: Request, res: Response): Promise<void | Response> {
    try {
      const { regionCode } = req.params;
      
      const region = await currencyRepo.getCurrencyRegionByCode(regionCode);
      
      if (!region) {
        return res.status(404).json({
          success: false,
          message: `Region with code ${regionCode} not found`
        });
      }
      
      const currency = await currencyRepo.getCurrencyByCode(region.currencyCode);
      
      if (!currency) {
        return res.status(404).json({
          success: false,
          message: `Currency for region ${regionCode} not found`
        });
      }
      
      res.json({
        success: true,
        data: {
          region,
          currency
        }
      });
    } catch (error) {
      console.error(`Error fetching region currency for ${req.params.regionCode}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch region currency',
        error: (error as Error).message
      });
    }
  }
  
  // Get suggested currency based on IP geolocation
  async getSuggestedCurrency(req: Request, res: Response): Promise<void | Response> {
    try {
      // Get client IP address
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      
      if (!ip) {
        return res.status(400).json({
          success: false,
          message: 'Cannot determine client IP address'
        });
      }
      
      // Detect country from IP
      const countryCode = await detectCountry(ip.toString());
      
      if (!countryCode) {
        // If country detection fails, return store default
        const defaultCurrency = await currencyRepo.getDefaultCurrency();
        
        return res.json({
          success: true,
          data: {
            currency: defaultCurrency,
            countryCode: null,
            isDefault: true
          }
        });
      }
      
      // Find currency region for country
      const region = await currencyRepo.getCurrencyRegionByCode(countryCode);
      
      if (!region || !region.isActive) {
        // If no region found or inactive, return store default
        const defaultCurrency = await currencyRepo.getDefaultCurrency();
        
        return res.json({
          success: true,
          data: {
            currency: defaultCurrency,
            countryCode,
            isDefault: true
          }
        });
      }
      
      // Get region's currency
      const currency = await currencyRepo.getCurrencyByCode(region.currencyCode);
      
      if (!currency || !currency.isActive) {
        // If currency not found or inactive, return store default
        const defaultCurrency = await currencyRepo.getDefaultCurrency();
        
        return res.json({
          success: true,
          data: {
            currency: defaultCurrency,
            countryCode,
            isDefault: true
          }
        });
      }
      
      res.json({
        success: true,
        data: {
          currency,
          countryCode,
          isDefault: false
        }
      });
    } catch (error) {
      console.error('Error getting suggested currency:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get suggested currency',
        error: (error as Error).message
      });
    }
  }
  
  // Convert price between currencies
  async convertPrice(req: Request, res: Response): Promise<void | Response> {
    try {
      const { amount, fromCurrency, toCurrency, regionCode } = req.body;
      
      if (amount === undefined || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: amount, fromCurrency, and toCurrency are required'
        });
      }
      
      // Get currencies
      const sourceCurrency = await currencyRepo.getCurrencyByCode(fromCurrency);
      const targetCurrency = await currencyRepo.getCurrencyByCode(toCurrency);
      
      if (!sourceCurrency) {
        return res.status(404).json({
          success: false,
          message: `Source currency ${fromCurrency} not found`
        });
      }
      
      if (!targetCurrency) {
        return res.status(404).json({
          success: false,
          message: `Target currency ${toCurrency} not found`
        });
      }
      
      // Convert using exchange rate
      const convertedAmount = convertCurrency(
        Number(amount),
        sourceCurrency,
        targetCurrency
      );
      
      // Get and apply price rules if region specified
      let finalAmount = convertedAmount;
      
      if (regionCode) {
        const priceRules = await currencyRepo.getPriceRulesForCurrency(targetCurrency.code, regionCode);
        
        if (priceRules.length > 0) {
          finalAmount = applyPriceRules(
            Number(amount),
            convertedAmount,
            targetCurrency,
            regionCode,
            priceRules
          );
        }
      }
      
      // Format amount
      const formattedAmount = formatCurrency(finalAmount, targetCurrency);
      
      res.json({
        success: true,
        data: {
          originalAmount: Number(amount),
          convertedAmount: finalAmount,
          formattedAmount,
          exchangeRate: targetCurrency.exchangeRate / sourceCurrency.exchangeRate,
          fromCurrency: sourceCurrency.code,
          toCurrency: targetCurrency.code
        }
      });
    } catch (error) {
      console.error('Error converting price:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to convert price',
        error: (error as Error).message
      });
    }
  }
  
  // Batch convert prices
  async batchConvertPrices(req: Request, res: Response): Promise<void | Response> {
    try {
      const { items, fromCurrency, toCurrency, regionCode } = req.body;
      
      if (!Array.isArray(items) || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: items array, fromCurrency, and toCurrency are required'
        });
      }
      
      // Get currencies
      const sourceCurrency = await currencyRepo.getCurrencyByCode(fromCurrency);
      const targetCurrency = await currencyRepo.getCurrencyByCode(toCurrency);
      
      if (!sourceCurrency) {
        return res.status(404).json({
          success: false,
          message: `Source currency ${fromCurrency} not found`
        });
      }
      
      if (!targetCurrency) {
        return res.status(404).json({
          success: false,
          message: `Target currency ${toCurrency} not found`
        });
      }
      
      // Get price rules if region specified
      const priceRules = regionCode 
        ? await currencyRepo.getPriceRulesForCurrency(targetCurrency.code, regionCode)
        : [];
      
      // Process each item
      const convertedItems = items.map((item: any) => {
        const amount = Number(item.amount);
        
        // Convert using exchange rate
        const convertedAmount = convertCurrency(
          amount,
          sourceCurrency,
          targetCurrency
        );
        
        // Apply price rules if available
        let finalAmount = convertedAmount;
        
        if (priceRules.length > 0) {
          finalAmount = applyPriceRules(
            amount,
            convertedAmount,
            targetCurrency,
            regionCode,
            priceRules
          );
        }
        
        // Format amount
        const formattedAmount = formatCurrency(finalAmount, targetCurrency);
        
        return {
          id: item.id,
          originalAmount: amount,
          convertedAmount: finalAmount,
          formattedAmount
        };
      });
      
      res.json({
        success: true,
        data: {
          items: convertedItems,
          exchangeRate: targetCurrency.exchangeRate / sourceCurrency.exchangeRate,
          fromCurrency: sourceCurrency.code,
          toCurrency: targetCurrency.code
        }
      });
    } catch (error) {
      console.error('Error batch converting prices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to batch convert prices',
        error: (error as Error).message
      });
    }
  }
}

export default new CurrencyPublicController();
