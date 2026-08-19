/**
 * Tax Provider Log Repository
 * CRUD operations for tax provider logs
 */

import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';


export type TaxProvider = 'internal' | 'avalara' | 'taxjar' | 'external';
export type TaxProviderRequestType = 'calculation' | 'verification' | 'filing' | 'refund' | 'adjustment' | 'validation';

export interface TaxProviderLog {
  taxProviderLogId: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  provider: TaxProvider;
  requestType: TaxProviderRequestType;
  entityType: string;
  entityId?: string;
  requestData?: unknown;
  responseData?: unknown;
  responseStatus?: number;
  isSuccess: boolean;
  errorCode?: string;
  errorMessage?: string;
  processingTimeMs?: number;
  providerReference?: string;
}

export type TaxProviderLogCreateParams = Omit<TaxProviderLog, 'taxProviderLogId' | 'createdAt' | 'updatedAt'>;

export class TaxProviderLogRepo {
  async findById(id: string): Promise<TaxProviderLog | null> {
    return await queryOne<TaxProviderLog>(`SELECT * FROM "taxProviderLog" WHERE "taxProviderLogId" = $1`, [id]);
  }

  async findByMerchant(organizationId: string, provider?: TaxProvider, limit = 100): Promise<TaxProviderLog[]> {
    let sql = `SELECT * FROM "taxProviderLog" WHERE "organizationId" = $1`;
    const params: unknown[] = [organizationId];
    if (provider) {
      sql += ` AND "provider" = $2`;
      params.push(provider);
    }
    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    return (await query<TaxProviderLog[]>(sql, params)) || [];
  }

  async create(params: TaxProviderLogCreateParams): Promise<TaxProviderLog> {
    const now = unixTimestamp();
    const result = await queryOne<TaxProviderLog>(
      `INSERT INTO "taxProviderLog" (
        "organizationId", "provider", "requestType", "entityType", "entityId", "requestData",
        "responseData", "responseStatus", "isSuccess", "errorCode", "errorMessage",
        "processingTimeMs", "providerReference", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        params.organizationId,
        params.provider,
        params.requestType,
        params.entityType,
        params.entityId || null,
        JSON.stringify(params.requestData || {}),
        JSON.stringify(params.responseData || {}),
        params.responseStatus || null,
        params.isSuccess,
        params.errorCode || null,
        params.errorMessage || null,
        params.processingTimeMs || null,
        params.providerReference || null,
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create tax provider log');
    return result;
  }

  async count(organizationId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "taxProviderLog"`;
    const params: unknown[] = [];
    if (organizationId) {
      sql += ` WHERE "organizationId" = $1`;
      params.push(organizationId);
    }
    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new TaxProviderLogRepo();
