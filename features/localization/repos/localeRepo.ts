import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type TextDirection = 'ltr' | 'rtl';

export interface Locale {
  localeId: string;
  createdAt: string;
  updatedAt: string;
  code: string;
  name: string;
  language: string;
  countryCode?: string;
  isActive: boolean;
  isDefault: boolean;
  textDirection: TextDirection;
  dateFormat: string;
  timeFormat: string;
  timeZone: string;
  defaultCurrencyId?: string;
}

export type LocaleCreateParams = Omit<Locale, 'localeId' | 'createdAt' | 'updatedAt'>;
export type LocaleUpdateParams = Partial<Omit<Locale, 'localeId' | 'code' | 'createdAt' | 'updatedAt'>>;

export class LocaleRepo {
  /**
   * Find locale by ID
   */
  async findById(localeId: string): Promise<Locale | null> {
    return await queryOne<Locale>(
      `SELECT * FROM "public"."locale" WHERE "localeId" = $1`,
      [localeId]
    );
  }

  /**
   * Find locale by code
   */
  async findByCode(code: string): Promise<Locale | null> {
    return await queryOne<Locale>(
      `SELECT * FROM "public"."locale" WHERE "code" = $1`,
      [code]
    );
  }

  /**
   * Find default locale
   */
  async findDefault(): Promise<Locale | null> {
    return await queryOne<Locale>(
      `SELECT * FROM "public"."locale" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
    );
  }

  /**
   * Find all locales
   */
  async findAll(activeOnly: boolean = false): Promise<Locale[]> {
    let sql = `SELECT * FROM "public"."locale"`;
    
    if (activeOnly) {
      sql += ` WHERE "isActive" = true`;
    }
    
    sql += ` ORDER BY "name" ASC`;
    
    const results = await query<Locale[]>(sql);
    return results || [];
  }

  /**
   * Find locales by language
   */
  async findByLanguage(language: string, activeOnly: boolean = true): Promise<Locale[]> {
    let sql = `SELECT * FROM "public"."locale" WHERE "language" = $1`;
    const params: any[] = [language.toLowerCase()];
    
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }
    
    sql += ` ORDER BY "name" ASC`;
    
    const results = await query<Locale[]>(sql, params);
    return results || [];
  }

  /**
   * Find locales by country code
   */
  async findByCountryCode(countryCode: string, activeOnly: boolean = true): Promise<Locale[]> {
    let sql = `SELECT * FROM "public"."locale" WHERE "countryCode" = $1`;
    const params: any[] = [countryCode.toUpperCase()];
    
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }
    
    sql += ` ORDER BY "name" ASC`;
    
    const results = await query<Locale[]>(sql, params);
    return results || [];
  }

  /**
   * Find locales by currency
   */
  async findByCurrency(currencyId: string, activeOnly: boolean = true): Promise<Locale[]> {
    let sql = `SELECT * FROM "public"."locale" WHERE "defaultCurrencyId" = $1`;
    const params: any[] = [currencyId];
    
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }
    
    sql += ` ORDER BY "name" ASC`;
    
    const results = await query<Locale[]>(sql, params);
    return results || [];
  }

  /**
   * Find locales by text direction
   */
  async findByTextDirection(textDirection: TextDirection, activeOnly: boolean = true): Promise<Locale[]> {
    let sql = `SELECT * FROM "public"."locale" WHERE "textDirection" = $1`;
    const params: any[] = [textDirection];
    
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }
    
    sql += ` ORDER BY "name" ASC`;
    
    const results = await query<Locale[]>(sql, params);
    return results || [];
  }

  /**
   * Search locales by name
   */
  async search(searchTerm: string, activeOnly: boolean = true): Promise<Locale[]> {
    let sql = `SELECT * FROM "public"."locale" WHERE ("name" ILIKE $1 OR "code" ILIKE $1)`;
    const params: any[] = [`%${searchTerm}%`];
    
    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }
    
    sql += ` ORDER BY "name" ASC`;
    
    const results = await query<Locale[]>(sql, params);
    return results || [];
  }

  /**
   * Create locale
   */
  async create(params: LocaleCreateParams): Promise<Locale> {
    const now = unixTimestamp();

    // Check if code already exists
    const existing = await this.findByCode(params.code);
    if (existing) {
      throw new Error(`Locale with code '${params.code}' already exists`);
    }

    // If setting as default, unset other defaults
    if (params.isDefault) {
      await this.unsetAllDefaults();
    }

    const result = await queryOne<Locale>(
      `INSERT INTO "public"."locale" (
        "code", "name", "language", "countryCode", "isActive", "isDefault",
        "textDirection", "dateFormat", "timeFormat", "timeZone", "defaultCurrencyId",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        params.code,
        params.name,
        params.language.toLowerCase(),
        params.countryCode ? params.countryCode.toUpperCase() : null,
        params.isActive !== undefined ? params.isActive : true,
        params.isDefault || false,
        params.textDirection || 'ltr',
        params.dateFormat || 'yyyy-MM-dd',
        params.timeFormat || 'HH:mm:ss',
        params.timeZone || 'UTC',
        params.defaultCurrencyId || null,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create locale');
    }

    return result;
  }

  /**
   * Update locale
   */
  async update(localeId: string, params: LocaleUpdateParams): Promise<Locale | null> {
    // If setting as default, unset other defaults
    if (params.isDefault === true) {
      await this.unsetAllDefaults(localeId);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        // Normalize language and countryCode
        if (key === 'language' && typeof value === 'string') {
          values.push(value.toLowerCase());
        } else if (key === 'countryCode' && typeof value === 'string') {
          values.push(value.toUpperCase());
        } else {
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      return this.findById(localeId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(localeId);

    const result = await queryOne<Locale>(
      `UPDATE "public"."locale" 
       SET ${updateFields.join(', ')}
       WHERE "localeId" = $${paramIndex}
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Set locale as default
   */
  async setAsDefault(localeId: string): Promise<Locale | null> {
    return this.update(localeId, { isDefault: true });
  }

  /**
   * Unset all defaults (except specified locale)
   */
  private async unsetAllDefaults(exceptId?: string): Promise<void> {
    let sql = `UPDATE "public"."locale" SET "isDefault" = false, "updatedAt" = $1 WHERE "isDefault" = true`;
    const params: any[] = [unixTimestamp()];
    
    if (exceptId) {
      sql += ` AND "localeId" != $2`;
      params.push(exceptId);
    }
    
    await query(sql, params);
  }

  /**
   * Activate locale
   */
  async activate(localeId: string): Promise<Locale | null> {
    return this.update(localeId, { isActive: true });
  }

  /**
   * Deactivate locale
   */
  async deactivate(localeId: string): Promise<Locale | null> {
    return this.update(localeId, { isActive: false });
  }

  /**
   * Delete locale
   */
  async delete(localeId: string): Promise<boolean> {
    const result = await queryOne<{ localeId: string }>(
      `DELETE FROM "public"."locale" WHERE "localeId" = $1 RETURNING "localeId"`,
      [localeId]
    );

    return !!result;
  }

  /**
   * Count locales
   */
  async count(activeOnly: boolean = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "public"."locale"`;
    
    if (activeOnly) {
      sql += ` WHERE "isActive" = true`;
    }
    
    const result = await queryOne<{ count: string }>(sql);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get all languages
   */
  async getAllLanguages(): Promise<string[]> {
    const results = await query<{ language: string }[]>(
      `SELECT DISTINCT "language" FROM "public"."locale" 
       WHERE "isActive" = true 
       ORDER BY "language" ASC`,
      []
    );

    return results ? results.map(l => l.language) : [];
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byLanguage: Record<string, number>;
    byTextDirection: Record<TextDirection, number>;
  }> {
    const total = await this.count();
    const active = await this.count(true);

    const langResults = await query<{ language: string; count: string }[]>(
      `SELECT "language", COUNT(*) as count 
       FROM "public"."locale" 
       GROUP BY "language"`,
      []
    );

    const byLanguage: Record<string, number> = {};
    if (langResults) {
      langResults.forEach(row => {
        byLanguage[row.language] = parseInt(row.count, 10);
      });
    }

    const dirResults = await query<{ textDirection: TextDirection; count: string }[]>(
      `SELECT "textDirection", COUNT(*) as count 
       FROM "public"."locale" 
       GROUP BY "textDirection"`,
      []
    );

    const byTextDirection: Record<string, number> = { ltr: 0, rtl: 0 };
    if (dirResults) {
      dirResults.forEach(row => {
        byTextDirection[row.textDirection] = parseInt(row.count, 10);
      });
    }

    return {
      total,
      active,
      byLanguage,
      byTextDirection: byTextDirection as Record<TextDirection, number>
    };
  }
}

export default new LocaleRepo();
