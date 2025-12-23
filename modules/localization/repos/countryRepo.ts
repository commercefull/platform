import { query, queryOne } from '../../../libs/db';
import { Table, Country } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

// Use Country type directly from libs/db/types.ts
export type { Country };

// Derived types for create/update operations
export type CountryCreateParams = Omit<Country, 'countryId' | 'createdAt' | 'updatedAt'>;
export type CountryUpdateParams = Partial<Omit<Country, 'countryId' | 'code' | 'createdAt' | 'updatedAt'>>;

export class CountryRepo {
  /**
   * Find country by ID
   */
  async findById(countryId: string): Promise<Country | null> {
    return await queryOne<Country>(`SELECT * FROM "${Table.Country}" WHERE "countryId" = $1`, [countryId]);
  }

  /**
   * Find country by code (ISO 2-letter)
   */
  async findByCode(code: string): Promise<Country | null> {
    return await queryOne<Country>(`SELECT * FROM "${Table.Country}" WHERE "code" = $1`, [code.toUpperCase()]);
  }

  /**
   * Find country by alpha3 code (ISO 3-letter)
   */
  async findByAlpha3Code(alpha3Code: string): Promise<Country | null> {
    return await queryOne<Country>(`SELECT * FROM "${Table.Country}" WHERE "alpha3Code" = $1`, [alpha3Code.toUpperCase()]);
  }

  /**
   * Find country by numeric code
   */
  async findByNumericCode(numericCode: number): Promise<Country | null> {
    return await queryOne<Country>(`SELECT * FROM "${Table.Country}" WHERE "numericCode" = $1`, [numericCode]);
  }

  /**
   * Find all countries
   */
  async findAll(activeOnly: boolean = false): Promise<Country[]> {
    let sql = `SELECT * FROM "${Table.Country}"`;

    if (activeOnly) {
      sql += ` WHERE "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<Country[]>(sql);
    return results || [];
  }

  /**
   * Find countries by region
   */
  async findByRegion(region: string, activeOnly: boolean = true): Promise<Country[]> {
    let sql = `SELECT * FROM "${Table.Country}" WHERE "region" = $1`;
    const params: any[] = [region];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<Country[]>(sql, params);
    return results || [];
  }

  /**
   * Find countries by currency
   */
  async findByCurrency(currencyId: string, activeOnly: boolean = true): Promise<Country[]> {
    let sql = `SELECT * FROM "${Table.Country}" WHERE "defaultCurrencyId" = $1`;
    const params: any[] = [currencyId];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<Country[]>(sql, params);
    return results || [];
  }

  /**
   * Search countries by name
   */
  async search(searchTerm: string, activeOnly: boolean = true): Promise<Country[]> {
    let sql = `SELECT * FROM "${Table.Country}" WHERE "name" ILIKE $1`;
    const params: any[] = [`%${searchTerm}%`];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<Country[]>(sql, params);
    return results || [];
  }

  /**
   * Create country
   */
  async create(params: CountryCreateParams): Promise<Country> {
    const now = unixTimestamp();

    // Check if code already exists
    const existing = await this.findByCode(params.code);
    if (existing) {
      throw new Error(`Country with code '${params.code}' already exists`);
    }

    const result = await queryOne<Country>(
      `INSERT INTO "${Table.Country}" (
        "code", "name", "numericCode", "alpha3Code", "defaultCurrencyId",
        "isActive", "flagIcon", "region",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        params.code.toUpperCase(),
        params.name,
        params.numericCode || null,
        params.alpha3Code ? params.alpha3Code.toUpperCase() : null,
        params.defaultCurrencyId || null,
        params.isActive !== undefined ? params.isActive : true,
        params.flagIcon || null,
        params.region || null,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create country');
    }

    return result;
  }

  /**
   * Update country
   */
  async update(countryId: string, params: CountryUpdateParams): Promise<Country | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        // Uppercase code fields
        if (key === 'alpha3Code' && typeof value === 'string') {
          values.push(value.toUpperCase());
        } else {
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      return this.findById(countryId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(countryId);

    const result = await queryOne<Country>(
      `UPDATE "${Table.Country}" 
       SET ${updateFields.join(', ')}
       WHERE "countryId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result;
  }

  /**
   * Activate country
   */
  async activate(countryId: string): Promise<Country | null> {
    return this.update(countryId, { isActive: true });
  }

  /**
   * Deactivate country
   */
  async deactivate(countryId: string): Promise<Country | null> {
    return this.update(countryId, { isActive: false });
  }

  /**
   * Delete country
   */
  async delete(countryId: string): Promise<boolean> {
    const result = await queryOne<{ countryId: string }>(`DELETE FROM "${Table.Country}" WHERE "countryId" = $1 RETURNING "countryId"`, [
      countryId,
    ]);

    return !!result;
  }

  /**
   * Count countries
   */
  async count(activeOnly: boolean = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "${Table.Country}"`;

    if (activeOnly) {
      sql += ` WHERE "isActive" = true`;
    }

    const result = await queryOne<{ count: string }>(sql);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get all regions
   */
  async getAllRegions(): Promise<string[]> {
    const results = await query<{ region: string }[]>(
      `SELECT DISTINCT "region" FROM "${Table.Country}" 
       WHERE "region" IS NOT NULL 
       ORDER BY "region" ASC`,
      [],
    );

    return results ? results.map(r => r.region) : [];
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byRegion: Record<string, number>;
  }> {
    const total = await this.count();
    const active = await this.count(true);

    const regionResults = await query<{ region: string; count: string }[]>(
      `SELECT "region", COUNT(*) as count 
       FROM "${Table.Country}" 
       WHERE "region" IS NOT NULL 
       GROUP BY "region"`,
      [],
    );

    const byRegion: Record<string, number> = {};
    if (regionResults) {
      regionResults.forEach(row => {
        byRegion[row.region] = parseInt(row.count, 10);
      });
    }

    return {
      total,
      active,
      byRegion,
    };
  }
}

export default new CountryRepo();
