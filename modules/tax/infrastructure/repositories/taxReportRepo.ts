/**
 * Tax Report Repository
 * CRUD operations for tax reports
 */

import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import { FailedToCreateTaxError } from '../../domain/errors/TaxErrors';


export type TaxReportType = 'sales' | 'filing' | 'jurisdiction' | 'summary' | 'exemption' | 'audit';
export type TaxReportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TaxReportFileFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

export interface TaxReport {
  taxReportId: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  name: string;
  reportType: TaxReportType;
  dateFrom: string;
  dateTo: string;
  taxJurisdictions?: unknown; // JSON
  fileUrl?: string;
  fileFormat?: TaxReportFileFormat;
  status: TaxReportStatus;
  generatedBy?: string;
  parameters?: unknown; // JSON
  results?: unknown; // JSON
  errorMessage?: string;
}

export type TaxReportCreateParams = Omit<TaxReport, 'taxReportId' | 'createdAt' | 'updatedAt'>;
export type TaxReportUpdateParams = Partial<Omit<TaxReport, 'taxReportId' | 'organizationId' | 'createdAt' | 'updatedAt'>>;

export class TaxReportRepo {
  async findById(id: string): Promise<TaxReport | null> {
    return await queryOne<TaxReport>(`SELECT * FROM "taxReport" WHERE "taxReportId" = $1`, [id]);
  }

  async findByMerchant(organizationId: string, reportType?: TaxReportType, limit = 100): Promise<TaxReport[]> {
    let sql = `SELECT * FROM "taxReport" WHERE "organizationId" = $1`;
    const params: unknown[] = [organizationId];
    if (reportType) {
      sql += ` AND "reportType" = $2`;
      params.push(reportType);
    }
    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    return (await query<TaxReport[]>(sql, params)) || [];
  }

  async findByStatus(organizationId: string, status: TaxReportStatus): Promise<TaxReport[]> {
    return (
      (await query<TaxReport[]>(`SELECT * FROM "taxReport" WHERE "organizationId" = $1 AND "status" = $2 ORDER BY "createdAt" DESC`, [
        organizationId,
        status,
      ])) || []
    );
  }

  async findByDateRange(organizationId: string, dateFrom: string, dateTo: string): Promise<TaxReport[]> {
    return (
      (await query<TaxReport[]>(
        `SELECT * FROM "taxReport" WHERE "organizationId" = $1 AND "dateFrom" >= $2 AND "dateTo" <= $3 ORDER BY "createdAt" DESC`,
        [organizationId, dateFrom, dateTo],
      )) || []
    );
  }

  async create(params: TaxReportCreateParams): Promise<TaxReport> {
    const now = unixTimestamp();
    const result = await queryOne<TaxReport>(
      `INSERT INTO "taxReport" (
        "organizationId", "name", "reportType", "dateFrom", "dateTo", "taxJurisdictions",
        "fileUrl", "fileFormat", "status", "generatedBy", "parameters", "results",
        "errorMessage", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        params.organizationId,
        params.name,
        params.reportType,
        params.dateFrom,
        params.dateTo,
        JSON.stringify(params.taxJurisdictions || []),
        params.fileUrl || null,
        params.fileFormat || null,
        params.status || 'pending',
        params.generatedBy || null,
        JSON.stringify(params.parameters || {}),
        JSON.stringify(params.results || {}),
        params.errorMessage || null,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateTaxError('Failed to create tax report');
    return result;
  }

  async update(id: string, params: TaxReportUpdateParams): Promise<TaxReport | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        if (['taxJurisdictions', 'parameters', 'results'].includes(key)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<TaxReport>(
      `UPDATE "taxReport" SET ${updateFields.join(', ')} WHERE "taxReportId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async markCompleted(id: string, fileUrl: string, results: unknown): Promise<TaxReport | null> {
    return this.update(id, { status: 'completed', fileUrl, results });
  }

  async markFailed(id: string, errorMessage: string): Promise<TaxReport | null> {
    return this.update(id, { status: 'failed', errorMessage });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ taxReportId: string }>(`DELETE FROM "taxReport" WHERE "taxReportId" = $1 RETURNING "taxReportId"`, [
      id,
    ]);
    return !!result;
  }

  async count(organizationId?: string, reportType?: TaxReportType): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "taxReport" WHERE 1=1`;
    const params: unknown[] = [];

    if (organizationId) {
      sql += ` AND "organizationId" = $${params.length + 1}`;
      params.push(organizationId);
    }
    if (reportType) {
      sql += ` AND "reportType" = $${params.length + 1}`;
      params.push(reportType);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new TaxReportRepo();
