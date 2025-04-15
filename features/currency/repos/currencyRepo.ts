import { query, queryOne } from '../../../libs/db';
import { Currency, CurrencyRegion, CurrencyPriceRule } from '../domain/currency';

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

const currencyPriceRuleFields: Record<string, string> = {
  id: 'id',
  name: 'name',
  description: 'description',
  type: 'type',
  value: 'value',
  currencyCode: 'currency_code',
  regionCode: 'region_code',
  priority: 'priority',
  minOrderValue: 'min_order_value',
  maxOrderValue: 'max_order_value',
  startDate: 'start_date',
  endDate: 'end_date',
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
  // Get all currencies
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
  
  // Get currency by code
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
  
  // Create or update currency
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
      
      // If setting this currency as default, update others
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
      
      // If setting this currency as default, update others
      if (currency.isDefault) {
        await this.clearOtherDefaultCurrencies(currency.code);
      }
      
      return currency;
    }
  }
  
  // Delete currency
  async deleteCurrency(code: string): Promise<boolean> {
    // Check if this is the default currency
    const currency = await this.getCurrencyByCode(code);
    
    if (!currency) {
      return false;
    }
    
    if (currency.isDefault) {
      throw new Error('Cannot delete the default currency');
    }
    
    const sql = 'DELETE FROM "currency" WHERE "code" = $1';
    const result = await query(sql, [code]);
    
    return true;
  }
  
  // Helper method to clear default status from other currencies
  private async clearOtherDefaultCurrencies(currentCode: string): Promise<void> {
    const sql = `
      UPDATE "currency"
      SET "is_default" = false
      WHERE "code" != $1
    `;
    
    await query(sql, [currentCode]);
  }
  
  // Get default currency
  async getDefaultCurrency(): Promise<Currency | null> {
    const sql = `
      SELECT * FROM "currency"
      WHERE "is_default" = true
      LIMIT 1
    `;
    
    const result = await queryOne<any>(sql);
    
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
  
  // Get currency regions
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
  
  // Get currency region by code
  async getCurrencyRegionByCode(regionCode: string): Promise<CurrencyRegion | null> {
    const sql = `
      SELECT * FROM "currency_region"
      WHERE "region_code" = $1
    `;
    
    const result = await queryOne<any>(sql, [regionCode]);
    
    return transformDbToTs<CurrencyRegion>(result, currencyRegionFields);
  }
  
  // Save currency region
  async saveCurrencyRegion(region: CurrencyRegion): Promise<CurrencyRegion> {
    const existingRegion = await this.getCurrencyRegionByCode(region.regionCode);
    
    if (existingRegion) {
      // Update existing region
      const sql = `
        UPDATE "currency_region"
        SET
          "region_name" = $1,
          "currency_code" = $2,
          "is_active" = $3,
          "updated_at" = now()
        WHERE "region_code" = $4
      `;
      
      await query(sql, [
        region.regionName,
        region.currencyCode,
        region.isActive,
        region.regionCode
      ]);
      
      return {
        ...region,
        id: existingRegion.id,
        updatedAt: Date.now()
      };
    } else {
      // Create new region
      const sql = `
        INSERT INTO "currency_region" (
          "region_code",
          "region_name",
          "currency_code",
          "is_active",
          "created_at",
          "updated_at"
        ) VALUES ($1, $2, $3, $4, now(), now())
        RETURNING "id"
      `;
      
      const result = await queryOne<{id: string}>(sql, [
        region.regionCode,
        region.regionName,
        region.currencyCode,
        region.isActive
      ]);
      
      if (!result || !result.id) {
        throw new Error('Failed to create currency region');
      }
      
      return {
        ...region,
        id: result.id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
  }
  
  // Get price rules
  async getPriceRules(activeOnly: boolean = false): Promise<CurrencyPriceRule[]> {
    let sql = `
      SELECT * FROM "currency_price_rule"
    `;
    
    if (activeOnly) {
      sql += ' WHERE "is_active" = true';
    }
    
    sql += ' ORDER BY "priority" DESC';
    
    const result = await query<any[]>(sql);
    
    return transformArrayDbToTs<CurrencyPriceRule>(result || [], currencyPriceRuleFields);
  }
  
  // Get price rules for currency
  async getPriceRulesForCurrency(currencyCode: string, activeOnly: boolean = true): Promise<CurrencyPriceRule[]> {
    let sql = `
      SELECT * FROM "currency_price_rule"
      WHERE "currency_code" = $1
    `;
    
    if (activeOnly) {
      sql += ' AND "is_active" = true';
    }
    
    sql += ' ORDER BY "priority" DESC';
    
    const result = await query<any[]>(sql, [currencyCode]);
    
    return transformArrayDbToTs<CurrencyPriceRule>(result || [], currencyPriceRuleFields);
  }
  
  // Get price rule by ID
  async getPriceRuleById(id: string): Promise<CurrencyPriceRule | null> {
    const sql = `
      SELECT * FROM "currency_price_rule"
      WHERE "id" = $1
    `;
    
    const result = await queryOne<any>(sql, [id]);
    
    return transformDbToTs<CurrencyPriceRule>(result, currencyPriceRuleFields);
  }
  
  // Save price rule
  async savePriceRule(rule: CurrencyPriceRule): Promise<CurrencyPriceRule> {
    const now = Date.now();
    
    if (rule.id) {
      // Update existing rule
      const sql = `
        UPDATE "currency_price_rule"
        SET
          "name" = $1,
          "description" = $2,
          "type" = $3,
          "value" = $4,
          "currency_code" = $5,
          "region_code" = $6,
          "priority" = $7,
          "min_order_value" = $8,
          "max_order_value" = $9,
          "start_date" = $10,
          "end_date" = $11,
          "is_active" = $12,
          "updated_at" = now()
        WHERE "id" = $13
      `;
      
      await query(sql, [
        rule.name,
        rule.description,
        rule.type,
        rule.value,
        rule.currencyCode,
        rule.regionCode,
        rule.priority,
        rule.minOrderValue,
        rule.maxOrderValue,
        rule.startDate,
        rule.endDate,
        rule.isActive,
        rule.id
      ]);
      
      return {
        ...rule,
        updatedAt: now
      };
    } else {
      // Create new rule
      const sql = `
        INSERT INTO "currency_price_rule" (
          "name",
          "description",
          "type",
          "value",
          "currency_code",
          "region_code",
          "priority",
          "min_order_value",
          "max_order_value",
          "start_date",
          "end_date",
          "is_active",
          "created_at",
          "updated_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
        RETURNING "id"
      `;
      
      const result = await queryOne<{id: string}>(sql, [
        rule.name,
        rule.description,
        rule.type,
        rule.value,
        rule.currencyCode,
        rule.regionCode,
        rule.priority,
        rule.minOrderValue,
        rule.maxOrderValue,
        rule.startDate,
        rule.endDate,
        rule.isActive
      ]);
      
      if (!result || !result.id) {
        throw new Error('Failed to create price rule');
      }
      
      return {
        ...rule,
        id: result.id,
        createdAt: now,
        updatedAt: now
      };
    }
  }
  
  // Delete price rule
  async deletePriceRule(id: string): Promise<boolean> {
    const sql = 'DELETE FROM "currency_price_rule" WHERE "id" = $1';
    await query(sql, [id]);
    return true;
  }
}

export default new CurrencyRepo();
