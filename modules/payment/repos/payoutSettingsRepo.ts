import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type PayoutFrequency = 'daily' | 'weekly' | 'monthly';
export type PayoutProvider = 'stripe' | 'square' | 'other';
export type PayoutMethodType = 'bank_transfer' | 'paypal' | 'check' | 'other';

export interface PayoutSettings {
  payoutSettingsId: string;
  createdAt: string;
  updatedAt: string;
  merchantId: string;
  frequency: PayoutFrequency;
  minimumAmount: number;
  bankAccountId?: string;
  payoutDay?: number;
  holdPeriod: number;
  automaticPayouts: boolean;
  currencyCode: string;
  payoutProvider: PayoutProvider;
  payoutMethod: PayoutMethodType;
  providerSettings?: any;
}

export type PayoutSettingsCreateParams = Omit<PayoutSettings, 'payoutSettingsId' | 'createdAt' | 'updatedAt'>;
export type PayoutSettingsUpdateParams = Partial<Omit<PayoutSettings, 'payoutSettingsId' | 'merchantId' | 'createdAt' | 'updatedAt'>>;

export class PayoutSettingsRepo {
  async findById(id: string): Promise<PayoutSettings | null> {
    return await queryOne<PayoutSettings>(`SELECT * FROM "payoutSettings" WHERE "payoutSettingsId" = $1`, [id]);
  }

  async findByMerchant(merchantId: string): Promise<PayoutSettings | null> {
    return await queryOne<PayoutSettings>(`SELECT * FROM "payoutSettings" WHERE "merchantId" = $1`, [merchantId]);
  }

  async create(params: PayoutSettingsCreateParams): Promise<PayoutSettings> {
    const now = unixTimestamp();
    const result = await queryOne<PayoutSettings>(
      `INSERT INTO "payoutSettings" (
        "merchantId", "frequency", "minimumAmount", "bankAccountId", "payoutDay", "holdPeriod",
        "automaticPayouts", "currencyCode", "payoutProvider", "payoutMethod", "providerSettings",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        params.merchantId, params.frequency || 'weekly', params.minimumAmount || 1.00,
        params.bankAccountId || null, params.payoutDay || null, params.holdPeriod || 0,
        params.automaticPayouts ?? true, params.currencyCode || 'USD', params.payoutProvider || 'stripe',
        params.payoutMethod || 'bank_transfer', JSON.stringify(params.providerSettings || {}), now, now
      ]
    );
    if (!result) throw new Error('Failed to create payout settings');
    return result;
  }

  async update(id: string, params: PayoutSettingsUpdateParams): Promise<PayoutSettings | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'providerSettings' ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<PayoutSettings>(
      `UPDATE "payoutSettings" SET ${updateFields.join(', ')} WHERE "payoutSettingsId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async updateByMerchant(merchantId: string, params: PayoutSettingsUpdateParams): Promise<PayoutSettings | null> {
    const existing = await this.findByMerchant(merchantId);
    if (!existing) return null;
    return this.update(existing.payoutSettingsId, params);
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ payoutSettingsId: string }>(
      `DELETE FROM "payoutSettings" WHERE "payoutSettingsId" = $1 RETURNING "payoutSettingsId"`,
      [id]
    );
    return !!result;
  }
}

export default new PayoutSettingsRepo();
