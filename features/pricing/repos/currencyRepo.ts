import { query, queryOne } from "../../../libs/db";
import { Currency, CurrencyRegion } from "../domain/currency";
import { Table } from "../../../libs/db/types";
import { generateUUID } from "../../../libs/uuid";

/**
 * Currency Repository
 * 
 * Uses camelCase for table and column names as per platform convention.
 * Tables: currency, currencyRegion (from db/types.ts)
 */
export class CurrencyRepo {
  private readonly currencyTable = Table.Currency;
  private readonly currencyRegionTable = 'currencyRegion';

  /**
   * Get all currencies
   */
  async getAllCurrencies(activeOnly: boolean = false): Promise<Currency[]> {
    let sql = `SELECT * FROM "${this.currencyTable}"`;
    
    if (activeOnly) {
      sql += ' WHERE "isActive" = true';
    }
    
    sql += ' ORDER BY "isDefault" DESC, "name" ASC';
    
    const result = await query<Currency[]>(sql);
    return result || [];
  }
  
  /**
   * Get currency by code
   */
  async getCurrencyByCode(code: string): Promise<Currency | null> {
    const sql = `SELECT * FROM "${this.currencyTable}" WHERE "code" = $1`;
    return await queryOne<Currency>(sql, [code]);
  }
  
  /**
   * Create or update currency
   */
  async saveCurrency(currency: Currency): Promise<Currency> {
    const existingCurrency = await this.getCurrencyByCode(currency.code);
    
    if (existingCurrency) {
      // Update existing currency
      const sql = `
        UPDATE "${this.currencyTable}"
        SET
          "name" = $1,
          "symbol" = $2,
          "decimalPlaces" = $3,
          "isDefault" = $4,
          "isActive" = $5,
          "symbolPosition" = $6,
          "thousandsSeparator" = $7,
          "decimalSeparator" = $8,
          "updatedAt" = now()
        WHERE "code" = $9
        RETURNING *
      `;
      
      const result = await queryOne<Currency>(sql, [
        currency.name,
        currency.symbol,
        currency.decimalPlaces || currency.decimals || 2,
        currency.isDefault,
        currency.isActive,
        currency.symbolPosition || currency.position || 'before',
        currency.thousandsSeparator || ',',
        currency.decimalSeparator || '.',
        currency.code
      ]);
      
      // If this is now the default currency, clear other defaults
      if (currency.isDefault) {
        await this.clearOtherDefaultCurrencies(currency.code);
      }
      
      return result || currency;
    } else {
      // Create new currency
      const sql = `
        INSERT INTO "${this.currencyTable}" (
          "code", "name", "symbol", "decimalPlaces", "isDefault", "isActive",
          "symbolPosition", "thousandsSeparator", "decimalSeparator"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const result = await queryOne<Currency>(sql, [
        currency.code,
        currency.name,
        currency.symbol,
        currency.decimalPlaces || currency.decimals || 2,
        currency.isDefault || false,
        currency.isActive !== false,
        currency.symbolPosition || currency.position || 'before',
        currency.thousandsSeparator || ',',
        currency.decimalSeparator || '.'
      ]);
      
      // If this is now the default currency, clear other defaults
      if (currency.isDefault) {
        await this.clearOtherDefaultCurrencies(currency.code);
      }
      
      return result || currency;
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
    
    const sql = `DELETE FROM "${this.currencyTable}" WHERE "code" = $1`;
    await query(sql, [code]);
    
    return true;
  }
  
  /**
   * Helper method to clear default status from other currencies
   */
  private async clearOtherDefaultCurrencies(currentCode: string): Promise<void> {
    const sql = `
      UPDATE "${this.currencyTable}"
      SET "isDefault" = false
      WHERE "code" != $1 AND "isDefault" = true
    `;
    await query(sql, [currentCode]);
  }
  
  /**
   * Get default currency
   */
  async getDefaultCurrency(): Promise<Currency | null> {
    const sql = `SELECT * FROM "${this.currencyTable}" WHERE "isDefault" = true`;
    const result = await queryOne<Currency>(sql);
    
    if (!result) {
      // No default currency found, get the first active one
      const fallbackSql = `SELECT * FROM "${this.currencyTable}" WHERE "isActive" = true LIMIT 1`;
      return await queryOne<Currency>(fallbackSql);
    }
    
    return result;
  }
  
  /**
   * Update exchange rates for currencies
   */
  async updateExchangeRates(source: string): Promise<Currency[]> {
    const defaultCurrency = await this.getDefaultCurrency();
    if (!defaultCurrency) {
      throw new Error('No default currency found to use as base for exchange rate updates');
    }
    
    let currencies: Currency[] = [];
    
    if (source === 'api') {
      // Placeholder for API implementation
      const rates: Record<string, number> = {};
      currencies = await this.getAllCurrencies(false);
      
      for (const currency of currencies) {
        if (currency.code === defaultCurrency.code) {
          currency.exchangeRate = 1;
        } else {
          currency.exchangeRate = rates[currency.code] || currency.exchangeRate;
        }
        currency.lastUpdated = Date.now();
        await this.saveCurrency(currency);
      }
    } else if (source === 'manual') {
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
    let sql = `SELECT * FROM "${this.currencyRegionTable}"`;
    
    if (activeOnly) {
      sql += ' WHERE "isActive" = true';
    }
    
    sql += ' ORDER BY "name" ASC';
    
    const result = await query<CurrencyRegion[]>(sql);
    return result || [];
  }
  
  /**
   * Get currency region by code
   */
  async getCurrencyRegionByCode(regionCode: string): Promise<CurrencyRegion | null> {
    const sql = `SELECT * FROM "${this.currencyRegionTable}" WHERE "code" = $1`;
    return await queryOne<CurrencyRegion>(sql, [regionCode]);
  }

  /**
   * Get currency region by ID
   */
  async getCurrencyRegionById(id: string): Promise<CurrencyRegion | null> {
    const sql = `SELECT * FROM "${this.currencyRegionTable}" WHERE "currencyRegionId" = $1`;
    return await queryOne<CurrencyRegion>(sql, [id]);
  }
  
  /**
   * Create a new currency region
   */
  async createCurrencyRegion(region: CurrencyRegion): Promise<CurrencyRegion> {
    const code = region.regionCode || (region as any).code;
    const name = region.regionName || (region as any).name;
    const existingRegion = await this.getCurrencyRegionByCode(code);
    if (existingRegion) {
      throw new Error(`Currency region with code ${code} already exists`);
    }
    
    const sql = `
      INSERT INTO "${this.currencyRegionTable}" (
        "code", "name", "currencyCode", "countries", "isActive"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await queryOne<CurrencyRegion>(sql, [
      code,
      name,
      region.currencyCode,
      (region as any).countries || null,
      region.isActive !== undefined ? region.isActive : true
    ]);
    
    if (!result) {
      throw new Error('Failed to create currency region');
    }
    
    return result;
  }
  
  /**
   * Update an existing currency region
   */
  async updateCurrencyRegion(id: string, region: Partial<CurrencyRegion>): Promise<CurrencyRegion> {
    const existingRegion = await this.getCurrencyRegionById(id);
    if (!existingRegion) {
      throw new Error(`Currency region with ID ${id} not found`);
    }
    
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: any[] = [id];
    let paramIndex = 2;
    
    for (const [key, value] of Object.entries(region)) {
      if (value === undefined || key === 'currencyRegionId' || key === 'createdAt' || key === 'updatedAt') continue;
      setStatements.push(`"${key}" = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    const sql = `
      UPDATE "${this.currencyRegionTable}"
      SET ${setStatements.join(', ')}
      WHERE "currencyRegionId" = $1
      RETURNING *
    `;
    
    const result = await queryOne<CurrencyRegion>(sql, values);
    
    if (!result) {
      throw new Error('Failed to update currency region');
    }
    
    return result;
  }
  
  /**
   * Delete a currency region
   */
  async deleteCurrencyRegion(id: string): Promise<boolean> {
    const existingRegion = await this.getCurrencyRegionById(id);
    if (!existingRegion) {
      throw new Error(`Currency region with ID ${id} not found`);
    }
    
    const sql = `DELETE FROM "${this.currencyRegionTable}" WHERE "currencyRegionId" = $1`;
    await query(sql, [id]);
    
    return true;
  }

  /**
   * Save currency region (legacy method for compatibility)
   */
  async saveCurrencyRegion(region: CurrencyRegion): Promise<CurrencyRegion> {
    if (region.id) {
      return this.updateCurrencyRegion(region.id, region);
    } else {
      return this.createCurrencyRegion(region);
    }
  }
}

export default new CurrencyRepo();
