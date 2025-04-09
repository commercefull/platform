import { query } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';
import { Currency, CurrencyRegion, CurrencyPriceRule } from '../domain/currency';

interface QueryResult {
  affectedRows?: number;
  insertId?: string | number;
  results?: any[];
  [key: string]: any;
}

export class CurrencyRepo {
  // Get all currencies
  async getAllCurrencies(activeOnly: boolean = false): Promise<Currency[]> {
    let sql = `
      SELECT 
        code, 
        name, 
        symbol, 
        decimals, 
        is_default as isDefault, 
        is_active as isActive, 
        exchange_rate as exchangeRate, 
        last_updated as lastUpdated,
        format,
        position,
        thousands_separator as thousandsSeparator,
        decimal_separator as decimalSeparator
      FROM currencies
    `;
    
    if (activeOnly) {
      sql += ' WHERE is_active = 1';
    }
    
    sql += ' ORDER BY is_default DESC, name ASC';
    
    const result = await query(sql) as QueryResult;
    
    return (result.results || []).map(row => ({
      code: row.code,
      name: row.name,
      symbol: row.symbol,
      decimals: Number(row.decimals),
      isDefault: Boolean(row.isDefault),
      isActive: Boolean(row.isActive),
      exchangeRate: Number(row.exchangeRate),
      lastUpdated: Number(row.lastUpdated),
      format: row.format,
      position: row.position as 'before' | 'after',
      thousandsSeparator: row.thousandsSeparator,
      decimalSeparator: row.decimalSeparator
    }));
  }
  
  // Get currency by code
  async getCurrencyByCode(code: string): Promise<Currency | null> {
    const sql = `
      SELECT 
        code, 
        name, 
        symbol, 
        decimals, 
        is_default as isDefault, 
        is_active as isActive, 
        exchange_rate as exchangeRate, 
        last_updated as lastUpdated,
        format,
        position,
        thousands_separator as thousandsSeparator,
        decimal_separator as decimalSeparator
      FROM currencies
      WHERE code = ?
    `;
    
    const result = await query(sql, [code]) as QueryResult;
    
    if (!result.results || result.results.length === 0) {
      return null;
    }
    
    const row = result.results[0];
    
    return {
      code: row.code,
      name: row.name,
      symbol: row.symbol,
      decimals: Number(row.decimals),
      isDefault: Boolean(row.isDefault),
      isActive: Boolean(row.isActive),
      exchangeRate: Number(row.exchangeRate),
      lastUpdated: Number(row.lastUpdated),
      format: row.format,
      position: row.position as 'before' | 'after',
      thousandsSeparator: row.thousandsSeparator,
      decimalSeparator: row.decimalSeparator
    };
  }
  
  // Create or update currency
  async saveCurrency(currency: Currency): Promise<Currency> {
    const existingCurrency = await this.getCurrencyByCode(currency.code);
    
    if (existingCurrency) {
      // Update existing currency
      const sql = `
        UPDATE currencies
        SET
          name = ?,
          symbol = ?,
          decimals = ?,
          is_default = ?,
          is_active = ?,
          exchange_rate = ?,
          last_updated = ?,
          format = ?,
          position = ?,
          thousands_separator = ?,
          decimal_separator = ?
        WHERE code = ?
      `;
      
      await query(sql, [
        currency.name,
        currency.symbol,
        currency.decimals,
        currency.isDefault ? 1 : 0,
        currency.isActive ? 1 : 0,
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
        INSERT INTO currencies (
          code,
          name,
          symbol,
          decimals,
          is_default,
          is_active,
          exchange_rate,
          last_updated,
          format,
          position,
          thousands_separator,
          decimal_separator
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await query(sql, [
        currency.code,
        currency.name,
        currency.symbol,
        currency.decimals,
        currency.isDefault ? 1 : 0,
        currency.isActive ? 1 : 0,
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
    
    const sql = 'DELETE FROM currencies WHERE code = ?';
    const result = await query(sql, [code]) as QueryResult;
    
    return result.affectedRows ? Number(result.affectedRows) > 0 : false;
  }
  
  // Get default currency
  async getDefaultCurrency(): Promise<Currency | null> {
    const sql = `
      SELECT 
        code, 
        name, 
        symbol, 
        decimals, 
        is_default as isDefault, 
        is_active as isActive, 
        exchange_rate as exchangeRate, 
        last_updated as lastUpdated,
        format,
        position,
        thousands_separator as thousandsSeparator,
        decimal_separator as decimalSeparator
      FROM currencies
      WHERE is_default = 1
      LIMIT 1
    `;
    
    const result = await query(sql) as QueryResult;
    
    if (!result.results || result.results.length === 0) {
      return null;
    }
    
    const row = result.results[0];
    
    return {
      code: row.code,
      name: row.name,
      symbol: row.symbol,
      decimals: Number(row.decimals),
      isDefault: Boolean(row.isDefault),
      isActive: Boolean(row.isActive),
      exchangeRate: Number(row.exchangeRate),
      lastUpdated: Number(row.lastUpdated),
      format: row.format,
      position: row.position as 'before' | 'after',
      thousandsSeparator: row.thousandsSeparator,
      decimalSeparator: row.decimalSeparator
    };
  }
  
  // Update exchange rates
  async updateExchangeRates(rates: Record<string, number>): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    let updatedCount = 0;
    
    for (const [code, rate] of Object.entries(rates)) {
      const sql = `
        UPDATE currencies
        SET 
          exchange_rate = ?,
          last_updated = ?
        WHERE code = ?
      `;
      
      const result = await query(sql, [rate, now, code]) as QueryResult;
      
      if (result.affectedRows && Number(result.affectedRows) > 0) {
        updatedCount++;
      }
    }
    
    return updatedCount;
  }
  
  // Helper method to clear default status from all other currencies
  private async clearOtherDefaultCurrencies(exceptCode: string): Promise<void> {
    const sql = 'UPDATE currencies SET is_default = 0 WHERE code != ?';
    await query(sql, [exceptCode]);
  }
  
  // Currency Region Methods
  
  // Get all currency regions
  async getAllCurrencyRegions(activeOnly: boolean = false): Promise<CurrencyRegion[]> {
    let sql = `
      SELECT 
        id,
        region_code as regionCode,
        region_name as regionName,
        currency_code as currencyCode,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM currency_regions
    `;
    
    if (activeOnly) {
      sql += ' WHERE is_active = 1';
    }
    
    sql += ' ORDER BY region_name ASC';
    
    const result = await query(sql) as QueryResult;
    
    return (result.results || []).map(row => ({
      id: row.id,
      regionCode: row.regionCode,
      regionName: row.regionName,
      currencyCode: row.currencyCode,
      isActive: Boolean(row.isActive),
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt)
    }));
  }
  
  // Get currency region by ID
  async getCurrencyRegionById(id: string): Promise<CurrencyRegion | null> {
    const sql = `
      SELECT 
        id,
        region_code as regionCode,
        region_name as regionName,
        currency_code as currencyCode,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM currency_regions
      WHERE id = ?
    `;
    
    const result = await query(sql, [id]) as QueryResult;
    
    if (!result.results || result.results.length === 0) {
      return null;
    }
    
    const row = result.results[0];
    
    return {
      id: row.id,
      regionCode: row.regionCode,
      regionName: row.regionName,
      currencyCode: row.currencyCode,
      isActive: Boolean(row.isActive),
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt)
    };
  }
  
  // Get currency region by region code
  async getCurrencyRegionByCode(regionCode: string): Promise<CurrencyRegion | null> {
    const sql = `
      SELECT 
        id,
        region_code as regionCode,
        region_name as regionName,
        currency_code as currencyCode,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM currency_regions
      WHERE region_code = ?
    `;
    
    const result = await query(sql, [regionCode]) as QueryResult;
    
    if (!result.results || result.results.length === 0) {
      return null;
    }
    
    const row = result.results[0];
    
    return {
      id: row.id,
      regionCode: row.regionCode,
      regionName: row.regionName,
      currencyCode: row.currencyCode,
      isActive: Boolean(row.isActive),
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt)
    };
  }
  
  // Create currency region
  async createCurrencyRegion(region: Omit<CurrencyRegion, 'id' | 'createdAt' | 'updatedAt'>): Promise<CurrencyRegion> {
    const now = Math.floor(Date.now() / 1000);
    const id = generateUUID();
    
    // Check if region code already exists
    const existingRegion = await this.getCurrencyRegionByCode(region.regionCode);
    
    if (existingRegion) {
      throw new Error(`Currency region with code '${region.regionCode}' already exists`);
    }
    
    const sql = `
      INSERT INTO currency_regions (
        id,
        region_code,
        region_name,
        currency_code,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(sql, [
      id,
      region.regionCode,
      region.regionName,
      region.currencyCode,
      region.isActive ? 1 : 0,
      now,
      now
    ]);
    
    return {
      id,
      ...region,
      createdAt: now,
      updatedAt: now
    };
  }
  
  // Update currency region
  async updateCurrencyRegion(id: string, updates: Partial<Omit<CurrencyRegion, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CurrencyRegion | null> {
    const now = Math.floor(Date.now() / 1000);
    
    // Get existing region
    const existingRegion = await this.getCurrencyRegionById(id);
    
    if (!existingRegion) {
      return null;
    }
    
    // If changing region code, check it doesn't conflict
    if (updates.regionCode && updates.regionCode !== existingRegion.regionCode) {
      const conflictingRegion = await this.getCurrencyRegionByCode(updates.regionCode);
      
      if (conflictingRegion) {
        throw new Error(`Currency region with code '${updates.regionCode}' already exists`);
      }
    }
    
    // Build update query
    const updateFields: string[] = ['updated_at = ?'];
    const params: any[] = [now];
    
    if (updates.regionCode !== undefined) {
      updateFields.push('region_code = ?');
      params.push(updates.regionCode);
    }
    
    if (updates.regionName !== undefined) {
      updateFields.push('region_name = ?');
      params.push(updates.regionName);
    }
    
    if (updates.currencyCode !== undefined) {
      updateFields.push('currency_code = ?');
      params.push(updates.currencyCode);
    }
    
    if (updates.isActive !== undefined) {
      updateFields.push('is_active = ?');
      params.push(updates.isActive ? 1 : 0);
    }
    
    // Add ID to params
    params.push(id);
    
    const sql = `
      UPDATE currency_regions
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await query(sql, params);
    
    return this.getCurrencyRegionById(id);
  }
  
  // Delete currency region
  async deleteCurrencyRegion(id: string): Promise<boolean> {
    const sql = 'DELETE FROM currency_regions WHERE id = ?';
    const result = await query(sql, [id]) as QueryResult;
    
    return result.affectedRows ? Number(result.affectedRows) > 0 : false;
  }
  
  // Currency Price Rule Methods
  
  // Get all price rules
  async getAllPriceRules(activeOnly: boolean = false): Promise<CurrencyPriceRule[]> {
    let sql = `
      SELECT 
        id,
        name,
        description,
        type,
        value,
        currency_code as currencyCode,
        region_code as regionCode,
        priority,
        min_order_value as minOrderValue,
        max_order_value as maxOrderValue,
        start_date as startDate,
        end_date as endDate,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM currency_price_rules
    `;
    
    if (activeOnly) {
      sql += ' WHERE is_active = 1';
    }
    
    sql += ' ORDER BY priority ASC, name ASC';
    
    const result = await query(sql) as QueryResult;
    
    return (result.results || []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type as 'fixed' | 'percentage' | 'exchange',
      value: Number(row.value),
      currencyCode: row.currencyCode,
      regionCode: row.regionCode,
      priority: Number(row.priority),
      minOrderValue: row.minOrderValue !== null ? Number(row.minOrderValue) : undefined,
      maxOrderValue: row.maxOrderValue !== null ? Number(row.maxOrderValue) : undefined,
      startDate: row.startDate !== null ? Number(row.startDate) : undefined,
      endDate: row.endDate !== null ? Number(row.endDate) : undefined,
      isActive: Boolean(row.isActive),
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt)
    }));
  }
  
  // Get price rules for a specific currency/region combination
  async getPriceRulesForCurrency(currencyCode: string, regionCode?: string): Promise<CurrencyPriceRule[]> {
    let sql = `
      SELECT 
        id,
        name,
        description,
        type,
        value,
        currency_code as currencyCode,
        region_code as regionCode,
        priority,
        min_order_value as minOrderValue,
        max_order_value as maxOrderValue,
        start_date as startDate,
        end_date as endDate,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM currency_price_rules
      WHERE currency_code = ? AND is_active = 1
    `;
    
    const params: any[] = [currencyCode];
    
    if (regionCode) {
      sql += ' AND (region_code IS NULL OR region_code = ?)';
      params.push(regionCode);
    } else {
      sql += ' AND region_code IS NULL';
    }
    
    sql += ' ORDER BY priority ASC';
    
    const result = await query(sql, params) as QueryResult;
    
    return (result.results || []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type as 'fixed' | 'percentage' | 'exchange',
      value: Number(row.value),
      currencyCode: row.currencyCode,
      regionCode: row.regionCode,
      priority: Number(row.priority),
      minOrderValue: row.minOrderValue !== null ? Number(row.minOrderValue) : undefined,
      maxOrderValue: row.maxOrderValue !== null ? Number(row.maxOrderValue) : undefined,
      startDate: row.startDate !== null ? Number(row.startDate) : undefined,
      endDate: row.endDate !== null ? Number(row.endDate) : undefined,
      isActive: Boolean(row.isActive),
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt)
    }));
  }
  
  // Get price rule by ID
  async getPriceRuleById(id: string): Promise<CurrencyPriceRule | null> {
    const sql = `
      SELECT 
        id,
        name,
        description,
        type,
        value,
        currency_code as currencyCode,
        region_code as regionCode,
        priority,
        min_order_value as minOrderValue,
        max_order_value as maxOrderValue,
        start_date as startDate,
        end_date as endDate,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM currency_price_rules
      WHERE id = ?
    `;
    
    const result = await query(sql, [id]) as QueryResult;
    
    if (!result.results || result.results.length === 0) {
      return null;
    }
    
    const row = result.results[0];
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type as 'fixed' | 'percentage' | 'exchange',
      value: Number(row.value),
      currencyCode: row.currencyCode,
      regionCode: row.regionCode,
      priority: Number(row.priority),
      minOrderValue: row.minOrderValue !== null ? Number(row.minOrderValue) : undefined,
      maxOrderValue: row.maxOrderValue !== null ? Number(row.maxOrderValue) : undefined,
      startDate: row.startDate !== null ? Number(row.startDate) : undefined,
      endDate: row.endDate !== null ? Number(row.endDate) : undefined,
      isActive: Boolean(row.isActive),
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt)
    };
  }
  
  // Create price rule
  async createPriceRule(rule: Omit<CurrencyPriceRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CurrencyPriceRule> {
    const now = Math.floor(Date.now() / 1000);
    const id = generateUUID();
    
    const sql = `
      INSERT INTO currency_price_rules (
        id,
        name,
        description,
        type,
        value,
        currency_code,
        region_code,
        priority,
        min_order_value,
        max_order_value,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(sql, [
      id,
      rule.name,
      rule.description || null,
      rule.type,
      rule.value,
      rule.currencyCode,
      rule.regionCode || null,
      rule.priority,
      rule.minOrderValue || null,
      rule.maxOrderValue || null,
      rule.startDate || null,
      rule.endDate || null,
      rule.isActive ? 1 : 0,
      now,
      now
    ]);
    
    return {
      id,
      ...rule,
      createdAt: now,
      updatedAt: now
    };
  }
  
  // Update price rule
  async updatePriceRule(id: string, updates: Partial<Omit<CurrencyPriceRule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CurrencyPriceRule | null> {
    const now = Math.floor(Date.now() / 1000);
    
    // Get existing rule
    const existingRule = await this.getPriceRuleById(id);
    
    if (!existingRule) {
      return null;
    }
    
    // Build update query
    const updateFields: string[] = ['updated_at = ?'];
    const params: any[] = [now];
    
    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      params.push(updates.name);
    }
    
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      params.push(updates.description || null);
    }
    
    if (updates.type !== undefined) {
      updateFields.push('type = ?');
      params.push(updates.type);
    }
    
    if (updates.value !== undefined) {
      updateFields.push('value = ?');
      params.push(updates.value);
    }
    
    if (updates.currencyCode !== undefined) {
      updateFields.push('currency_code = ?');
      params.push(updates.currencyCode);
    }
    
    if (updates.regionCode !== undefined) {
      updateFields.push('region_code = ?');
      params.push(updates.regionCode || null);
    }
    
    if (updates.priority !== undefined) {
      updateFields.push('priority = ?');
      params.push(updates.priority);
    }
    
    if (updates.minOrderValue !== undefined) {
      updateFields.push('min_order_value = ?');
      params.push(updates.minOrderValue || null);
    }
    
    if (updates.maxOrderValue !== undefined) {
      updateFields.push('max_order_value = ?');
      params.push(updates.maxOrderValue || null);
    }
    
    if (updates.startDate !== undefined) {
      updateFields.push('start_date = ?');
      params.push(updates.startDate || null);
    }
    
    if (updates.endDate !== undefined) {
      updateFields.push('end_date = ?');
      params.push(updates.endDate || null);
    }
    
    if (updates.isActive !== undefined) {
      updateFields.push('is_active = ?');
      params.push(updates.isActive ? 1 : 0);
    }
    
    // Add ID to params
    params.push(id);
    
    const sql = `
      UPDATE currency_price_rules
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await query(sql, params);
    
    return this.getPriceRuleById(id);
  }
  
  // Delete price rule
  async deletePriceRule(id: string): Promise<boolean> {
    const sql = 'DELETE FROM currency_price_rules WHERE id = ?';
    const result = await query(sql, [id]) as QueryResult;
    
    return result.affectedRows ? Number(result.affectedRows) > 0 : false;
  }
}

export default new CurrencyRepo();
