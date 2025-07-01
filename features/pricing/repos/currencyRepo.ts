import { query, queryOne } from "../../../libs/db";
import { Currency, CurrencyRegion } from "../domain/currency";
import { generateUUID } from "../../../libs/uuid";
import axios from "axios";

// Field mapping dictionaries for database to TypeScript conversion
const currencyFields: Record<string, string> = {
  code: 'code',
  name: 'name',
  symbol: 'symbol',
  decimals: 'decimal_places',
  isDefault: 'is_default',
  isActive: 'is_active',
  exchangeRate: 'exchange_rate',
  lastUpdated: 'last_updated',
  format: 'format',
  position: 'symbol_position',
  thousandsSeparator: 'thousands_separator',
  decimalSeparator: 'decimal_separator'
};

const currencyRegionFields: Record<string, string> = {
  id: 'id',
  regionCode: 'region_code',
  regionName: 'region_name',
  currencyCode: 'currency_code',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

/**
 * Transform a database record to a TypeScript object using field mapping
 */
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}

/**
 * Transform an array of database records to TypeScript objects
 */
function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords || !Array.isArray(dbRecords)) return [];
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}

export class CurrencyRepo {
  /**
   * Get all currencies
   */
  async getAllCurrencies(activeOnly: boolean = false): Promise<Currency[]> {
    let sql = `
      SELECT * FROM "currency"
    `;
    
    if (activeOnly) {
      sql += ' WHERE "is_active" = true';
    }
    
    sql += ' ORDER BY "is_default" DESC, "name" ASC';
    
    const result = await query<any[]>(sql);
    
    return transformArrayDbToTs<Currency>(result || [], currencyFields).map(currency => ({
      ...currency,
      decimals: Number(currency.decimals),
      isDefault: Boolean(currency.isDefault),
      isActive: Boolean(currency.isActive),
      exchangeRate: Number(currency.exchangeRate),
      lastUpdated: Number(currency.lastUpdated)
    }));
  }
  
  /**
   * Get currency by code
   */
  async getCurrencyByCode(code: string): Promise<Currency | null> {
    const sql = `
      SELECT * FROM "currency"
      WHERE "code" = $1
    `;
    
    const result = await queryOne<any>(sql, [code]);
    
    if (!result) {
      return null;
    }
    
    const currency = transformDbToTs<Currency>(result, currencyFields);
    
    return {
      ...currency,
      decimals: Number(currency.decimals),
      isDefault: Boolean(currency.isDefault),
      isActive: Boolean(currency.isActive),
      exchangeRate: Number(currency.exchangeRate),
      lastUpdated: Number(currency.lastUpdated)
    };
  }
  
  /**
   * Create or update currency
   */
  async saveCurrency(currency: Currency): Promise<Currency> {
    const existingCurrency = await this.getCurrencyByCode(currency.code);
    
    if (existingCurrency) {
      // Update existing currency
      const sql = `
        UPDATE "currency"
        SET
          "name" = $1,
          "symbol" = $2,
          "decimal_places" = $3,
          "is_default" = $4,
          "is_active" = $5,
          "exchange_rate" = $6,
          "last_updated" = $7,
          "format" = $8,
          "symbol_position" = $9,
          "thousands_separator" = $10,
          "decimal_separator" = $11,
          "updated_at" = now()
        WHERE "code" = $12
      `;
      
      await query(sql, [
        currency.name,
        currency.symbol,
        currency.decimals,
        currency.isDefault,
        currency.isActive,
        currency.exchangeRate,
        currency.lastUpdated,
        currency.format,
        currency.position,
        currency.thousandsSeparator,
        currency.decimalSeparator,
        currency.code
      ]);
      
      // If this is now the default currency, clear other defaults
      if (currency.isDefault) {
        await this.clearOtherDefaultCurrencies(currency.code);
      }
      
      return currency;
    } else {
      // Create new currency
      const sql = `
        INSERT INTO "currency" (
          "code",
          "name",
          "symbol",
          "decimal_places",
          "is_default",
          "is_active",
          "exchange_rate",
          "last_updated",
          "format",
          "symbol_position",
          "thousands_separator",
          "decimal_separator",
          "created_at",
          "updated_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
      `;
      
      await query(sql, [
        currency.code,
        currency.name,
        currency.symbol,
        currency.decimals,
        currency.isDefault,
        currency.isActive,
        currency.exchangeRate,
        currency.lastUpdated,
        currency.format,
        currency.position,
        currency.thousandsSeparator,
        currency.decimalSeparator
      ]);
      
      // If this is now the default currency, clear other defaults
      if (currency.isDefault) {
        await this.clearOtherDefaultCurrencies(currency.code);
      }
      
      return currency;
    }
  }
  
  /**
   * Delete currency
   */
  async deleteCurrency(code: string): Promise<boolean> {
    const currency = await this.getCurrencyByCode(code);
    
    if (!currency) {
      return false;
    }
    
    // Don't allow deleting the default currency
    if (currency.isDefault) {
      throw new Error('Cannot delete the default currency');
    }
    
    const sql = 'DELETE FROM "currency" WHERE "code" = $1';
    await query(sql, [code]);
    
    return true;
  }
  
  /**
   * Helper method to clear default status from other currencies
   */
  private async clearOtherDefaultCurrencies(currentCode: string): Promise<void> {
    const sql = `
      UPDATE "currency"
      SET "is_default" = false
      WHERE "code" != $1 AND "is_default" = true
    `;
    
    await query(sql, [currentCode]);
  }
  
  /**
   * Get default currency
   */
  async getDefaultCurrency(): Promise<Currency | null> {
    const sql = `
      SELECT * FROM "currency"
      WHERE "is_default" = true
    `;
    
    const result = await queryOne<any>(sql);
    
    if (!result) {
      // No default currency found, get the first active one
      const fallbackSql = `
        SELECT * FROM "currency"
        WHERE "is_active" = true
        LIMIT 1
      `;
      
      const fallbackResult = await queryOne<any>(fallbackSql);
      
      if (!fallbackResult) {
        return null;
      }
      
      return transformDbToTs<Currency>(fallbackResult, currencyFields);
    }
    
    return transformDbToTs<Currency>(result, currencyFields);
  }
  
  /**
   * Update exchange rates for currencies
   * @param source Source of exchange rates (e.g., 'api', 'manual')
   */
  async updateExchangeRates(source: string): Promise<Currency[]> {
    // Get default currency as base
    const defaultCurrency = await this.getDefaultCurrency();
    if (!defaultCurrency) {
      throw new Error('No default currency found to use as base for exchange rate updates');
    }
    
    let currencies: Currency[] = [];
    
    if (source === 'api') {
      // Call external exchange rate API (implementation will vary based on chosen provider)
      try {
        // This is a placeholder for an actual API call
        // In a real implementation, you would call your exchange rate provider's API
        // Example: const response = await axios.get(`https://api.exchangerate.com/latest?base=${defaultCurrency.code}`);
        
        // Placeholder for API response processing
        // const rates = response.data.rates;
        const rates: Record<string, number> = {}; // Replace with actual API response
        
        // Get all currencies
        currencies = await this.getAllCurrencies(false);
        
        // Update exchange rates for each currency
        for (const currency of currencies) {
          if (currency.code === defaultCurrency.code) {
            // Base currency always has exchange rate of 1
            currency.exchangeRate = 1;
          } else {
            // Get rate from API response or keep existing if not available
            currency.exchangeRate = rates[currency.code] || currency.exchangeRate;
          }
          currency.lastUpdated = Date.now();
          
          // Save updated currency
          await this.saveCurrency(currency);
        }
      } catch (error) {
        console.error('Error updating exchange rates from API:', error);
        throw new Error(`Failed to update exchange rates from API: ${(error as Error).message}`);
      }
    } else if (source === 'manual') {
      // Manual updates are handled directly through the saveCurrency method
      // This just returns all currencies
      currencies = await this.getAllCurrencies(false);
    } else {
      throw new Error(`Unsupported exchange rate source: ${source}`);
    }
    
    return currencies;
  }
  
  /**
   * Get currency regions
   */
  async getCurrencyRegions(activeOnly: boolean = false): Promise<CurrencyRegion[]> {
    let sql = `
      SELECT * FROM "currency_region"
    `;
    
    if (activeOnly) {
      sql += ' WHERE "is_active" = true';
    }
    
    sql += ' ORDER BY "region_name" ASC';
    
    const result = await query<any[]>(sql);
    
    return transformArrayDbToTs<CurrencyRegion>(result || [], currencyRegionFields);
  }
  
  /**
   * Get currency region by code
   */
  async getCurrencyRegionByCode(regionCode: string): Promise<CurrencyRegion | null> {
    const sql = `
      SELECT * FROM "currency_region"
      WHERE "region_code" = $1
    `;
    
    const result = await queryOne<any>(sql, [regionCode]);
    
    return transformDbToTs<CurrencyRegion>(result, currencyRegionFields);
  }

  /**
   * Get currency region by ID
   */
  async getCurrencyRegionById(id: string): Promise<CurrencyRegion | null> {
    const sql = `
      SELECT * FROM "currency_region"
      WHERE "id" = $1
    `;
    
    const result = await queryOne<any>(sql, [id]);
    
    return transformDbToTs<CurrencyRegion>(result, currencyRegionFields);
  }
  
  /**
   * Create a new currency region
   */
  async createCurrencyRegion(region: CurrencyRegion): Promise<CurrencyRegion> {
    // Ensure region doesn't already exist by code
    const existingRegion = await this.getCurrencyRegionByCode(region.regionCode);
    if (existingRegion) {
      throw new Error(`Currency region with code ${region.regionCode} already exists`);
    }
    
    // Set defaults for new region
    const newRegion: CurrencyRegion = {
      ...region,
      id: generateUUID(),
      isActive: region.isActive !== undefined ? region.isActive : true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Save using existing saveCurrencyRegion method
    return this.saveCurrencyRegion(newRegion);
  }
  
  /**
   * Update an existing currency region
   */
  async updateCurrencyRegion(id: string, region: Partial<CurrencyRegion>): Promise<CurrencyRegion> {
    // Check if region exists
    const existingRegion = await this.getCurrencyRegionById(id);
    if (!existingRegion) {
      throw new Error(`Currency region with ID ${id} not found`);
    }
    
    // Merge existing data with updates
    const updatedRegion: CurrencyRegion = {
      ...existingRegion,
      ...region,
      updatedAt: Date.now()
    };
    
    // Save using existing saveCurrencyRegion method
    return this.saveCurrencyRegion(updatedRegion);
  }
  
  /**
   * Delete a currency region
   */
  async deleteCurrencyRegion(id: string): Promise<boolean> {
    // Check if region exists
    const existingRegion = await this.getCurrencyRegionById(id);
    if (!existingRegion) {
      throw new Error(`Currency region with ID ${id} not found`);
    }
    
    const sql = 'DELETE FROM "currency_region" WHERE "id" = $1';
    await query(sql, [id]);
    
    return true;
  }

  /**
   * Save currency region
   */
  async saveCurrencyRegion(region: CurrencyRegion): Promise<CurrencyRegion> {
    if (region.id) {
      // Update existing region
      const sql = `
        UPDATE "currency_region"
        SET
          "region_code" = $1,
          "region_name" = $2,
          "currency_code" = $3,
          "is_active" = $4,
          "updated_at" = now()
        WHERE "id" = $5
      `;
      
      await query(sql, [
        region.regionCode,
        region.regionName,
        region.currencyCode,
        region.isActive,
        region.id
      ]);
      
      return {
        ...region,
        updatedAt: Date.now()
      };
    } else {
      // Create new region
      const id = generateUUID();
      const now = Date.now();
      
      const sql = `
        INSERT INTO "currency_region" (
          "id",
          "region_code",
          "region_name",
          "currency_code",
          "is_active",
          "created_at",
          "updated_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING "id"
      `;
      
      const result = await queryOne<{id: string}>(sql, [
        id,
        region.regionCode,
        region.regionName,
        region.currencyCode,
        region.isActive,
        now,
        now
      ]);
      
      if (!result || !result.id) {
        throw new Error('Failed to create currency region');
      }
      
      return {
        ...region,
        id: result.id,
        createdAt: now,
        updatedAt: now
      };
    }
  }
}

export default new CurrencyRepo();
