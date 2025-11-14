import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface CustomerCurrencyPreference {
  customerCurrencyPreferenceId: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  currencyId: string;
  automaticDetection: boolean;
}

export type CustomerCurrencyPreferenceCreateParams = Omit<CustomerCurrencyPreference, 'customerCurrencyPreferenceId' | 'createdAt' | 'updatedAt'>;
export type CustomerCurrencyPreferenceUpdateParams = Partial<Pick<CustomerCurrencyPreference, 'currencyId' | 'automaticDetection'>>;

export class CustomerCurrencyPreferenceRepo {
  async findById(id: string): Promise<CustomerCurrencyPreference | null> {
    return await queryOne<CustomerCurrencyPreference>(
      `SELECT * FROM "customerCurrencyPreference" WHERE "customerCurrencyPreferenceId" = $1`,
      [id]
    );
  }

  async findByCustomerId(customerId: string): Promise<CustomerCurrencyPreference | null> {
    return await queryOne<CustomerCurrencyPreference>(
      `SELECT * FROM "customerCurrencyPreference" WHERE "customerId" = $1`,
      [customerId]
    );
  }

  async findByCurrencyId(currencyId: string, limit = 100): Promise<CustomerCurrencyPreference[]> {
    return (await query<CustomerCurrencyPreference[]>(
      `SELECT * FROM "customerCurrencyPreference" WHERE "currencyId" = $1 LIMIT $2`,
      [currencyId, limit]
    )) || [];
  }

  async findWithAutoDetection(): Promise<CustomerCurrencyPreference[]> {
    return (await query<CustomerCurrencyPreference[]>(
      `SELECT * FROM "customerCurrencyPreference" WHERE "automaticDetection" = true`
    )) || [];
  }

  async create(params: CustomerCurrencyPreferenceCreateParams): Promise<CustomerCurrencyPreference> {
    const now = unixTimestamp();

    // Check if preference already exists
    const existing = await this.findByCustomerId(params.customerId);
    if (existing) {
      throw new Error('Currency preference already exists for this customer');
    }

    const result = await queryOne<CustomerCurrencyPreference>(
      `INSERT INTO "customerCurrencyPreference" (
        "customerId", "currencyId", "automaticDetection", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [params.customerId, params.currencyId, params.automaticDetection ?? true, now, now]
    );

    if (!result) throw new Error('Failed to create currency preference');
    return result;
  }

  async upsert(params: CustomerCurrencyPreferenceCreateParams): Promise<CustomerCurrencyPreference> {
    const existing = await this.findByCustomerId(params.customerId);

    if (existing) {
      const updated = await this.update(existing.customerCurrencyPreferenceId, {
        currencyId: params.currencyId,
        automaticDetection: params.automaticDetection
      });
      if (!updated) throw new Error('Failed to update preference');
      return updated;
    }

    return this.create(params);
  }

  async update(id: string, params: CustomerCurrencyPreferenceUpdateParams): Promise<CustomerCurrencyPreference | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<CustomerCurrencyPreference>(
      `UPDATE "customerCurrencyPreference" SET ${updateFields.join(', ')} WHERE "customerCurrencyPreferenceId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async updateCurrency(customerId: string, currencyId: string): Promise<CustomerCurrencyPreference | null> {
    const preference = await this.findByCustomerId(customerId);
    if (!preference) return null;
    return this.update(preference.customerCurrencyPreferenceId, { currencyId });
  }

  async enableAutoDetection(customerId: string): Promise<CustomerCurrencyPreference | null> {
    const preference = await this.findByCustomerId(customerId);
    if (!preference) return null;
    return this.update(preference.customerCurrencyPreferenceId, { automaticDetection: true });
  }

  async disableAutoDetection(customerId: string): Promise<CustomerCurrencyPreference | null> {
    const preference = await this.findByCustomerId(customerId);
    if (!preference) return null;
    return this.update(preference.customerCurrencyPreferenceId, { automaticDetection: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ customerCurrencyPreferenceId: string }>(
      `DELETE FROM "customerCurrencyPreference" WHERE "customerCurrencyPreferenceId" = $1 RETURNING "customerCurrencyPreferenceId"`,
      [id]
    );
    return !!result;
  }

  async deleteByCustomerId(customerId: string): Promise<boolean> {
    const result = await queryOne<{ customerCurrencyPreferenceId: string }>(
      `DELETE FROM "customerCurrencyPreference" WHERE "customerId" = $1 RETURNING "customerCurrencyPreferenceId"`,
      [customerId]
    );
    return !!result;
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "customerCurrencyPreference"`
    );
    return result ? parseInt(result.count, 10) : 0;
  }

  async getStatistics(): Promise<{ total: number; withAutoDetection: number; byCurrency: Record<string, number> }> {
    const total = await this.count();

    const autoResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "customerCurrencyPreference" WHERE "automaticDetection" = true`
    );
    const withAutoDetection = autoResult ? parseInt(autoResult.count, 10) : 0;

    const currencyResults = await query<{ currencyId: string; count: string }[]>(
      `SELECT "currencyId", COUNT(*) as count FROM "customerCurrencyPreference" GROUP BY "currencyId"`
    );
    const byCurrency: Record<string, number> = {};
    currencyResults?.forEach(row => { byCurrency[row.currencyId] = parseInt(row.count, 10); });

    return { total, withAutoDetection, byCurrency };
  }
}

export default new CustomerCurrencyPreferenceRepo();
