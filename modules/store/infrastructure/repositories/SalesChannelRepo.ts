import { query, queryOne, withTransaction } from '../../../../libs/db';
import { SalesChannel, type SalesChannelProps, type StoreSalesChannel } from '../../domain/entities/SalesChannel';
import type { AssignSalesChannelInput, SalesChannelRepository } from '../../domain/repositories/SalesChannelRepository';
import { StoreValidationError } from '../../domain/errors/StoreErrors';

interface SalesChannelRow {
  salesChannelId: string;
  organizationId: string;
  code: string;
  name: string;
  type: SalesChannelProps['type'];
  status: SalesChannelProps['status'];
  config: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StoreSalesChannelRow {
  storeSalesChannelId: string;
  storeId: string;
  salesChannelId: string;
  isDefault: boolean;
  isActive: boolean;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  channelId?: string;
  organizationId?: string;
  code?: string;
  name?: string;
  type?: SalesChannelProps['type'];
  status?: SalesChannelProps['status'];
  config?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  channelCreatedAt?: Date;
  channelUpdatedAt?: Date;
}

export class SalesChannelRepo implements SalesChannelRepository {
  async findById(salesChannelId: string): Promise<SalesChannel | null> {
    const row = await queryOne<SalesChannelRow>(`SELECT * FROM "salesChannel" WHERE "salesChannelId" = $1`, [salesChannelId]);
    return row ? this.mapChannel(row) : null;
  }

  async findByCode(organizationId: string, code: string): Promise<SalesChannel | null> {
    const row = await queryOne<SalesChannelRow>(`SELECT * FROM "salesChannel" WHERE "organizationId" = $1 AND code = $2`, [
      organizationId,
      code,
    ]);
    return row ? this.mapChannel(row) : null;
  }

  async findByOrganization(organizationId: string): Promise<SalesChannel[]> {
    const rows = await query<SalesChannelRow[]>(`SELECT * FROM "salesChannel" WHERE "organizationId" = $1 ORDER BY name`, [organizationId]);
    return (rows || []).map(row => this.mapChannel(row));
  }

  async findAll(): Promise<SalesChannel[]> {
    const rows = await query<SalesChannelRow[]>(`SELECT * FROM "salesChannel" ORDER BY name`, []);
    return (rows || []).map(row => this.mapChannel(row));
  }

  async findByStore(storeId: string): Promise<StoreSalesChannel[]> {
    const rows = await query<StoreSalesChannelRow[]>(
      `SELECT ssc.*, sc."salesChannelId" AS "channelId", sc."organizationId", sc.code, sc.name, sc.type, sc.status,
              sc.config, sc.metadata, sc."createdAt" AS "channelCreatedAt", sc."updatedAt" AS "channelUpdatedAt"
       FROM "storeSalesChannel" ssc
       JOIN "salesChannel" sc ON sc."salesChannelId" = ssc."salesChannelId"
       WHERE ssc."storeId" = $1
       ORDER BY ssc."isDefault" DESC, sc.name`,
      [storeId],
    );
    return (rows || []).map(row => this.mapAssignment(row));
  }

  async findAssignment(storeId: string, salesChannelId: string): Promise<StoreSalesChannel | null> {
    const row = await queryOne<StoreSalesChannelRow>(`SELECT * FROM "storeSalesChannel" WHERE "storeId" = $1 AND "salesChannelId" = $2`, [
      storeId,
      salesChannelId,
    ]);
    return row ? this.mapAssignment(row) : null;
  }

  async save(channel: SalesChannel): Promise<SalesChannel> {
    const row = await queryOne<SalesChannelRow>(
      `INSERT INTO "salesChannel" ("salesChannelId", "organizationId", code, name, type, status, config, metadata, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT ("salesChannelId") DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type,
         status = EXCLUDED.status, config = EXCLUDED.config, metadata = EXCLUDED.metadata, "updatedAt" = EXCLUDED."updatedAt"
       RETURNING *`,
      [
        channel.salesChannelId,
        channel.organizationId,
        channel.code,
        channel.name,
        channel.type,
        channel.status,
        channel.config,
        channel.metadata,
        channel.createdAt,
        channel.updatedAt,
      ],
    );
    if (!row) throw new StoreValidationError('Failed to save sales channel');
    return this.mapChannel(row);
  }

  async delete(salesChannelId: string): Promise<void> {
    await query(`DELETE FROM "salesChannel" WHERE "salesChannelId" = $1`, [salesChannelId]);
  }

  async assign(input: AssignSalesChannelInput): Promise<StoreSalesChannel> {
    return withTransaction(async tx => {
      if (input.isDefault) {
        await tx.query(`UPDATE "storeSalesChannel" SET "isDefault" = false, "updatedAt" = now() WHERE "storeId" = $1`, [input.storeId]);
      }
      const row = await tx.queryOne<StoreSalesChannelRow>(
        `INSERT INTO "storeSalesChannel" ("storeId", "salesChannelId", "isDefault", "isActive", settings)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [input.storeId, input.salesChannelId, input.isDefault ?? false, input.isActive ?? true, input.settings ?? {}],
      );
      if (!row) throw new StoreValidationError('Failed to assign sales channel to store');
      return this.mapAssignment(row);
    });
  }

  async unassign(storeId: string, salesChannelId: string): Promise<void> {
    await query(`DELETE FROM "storeSalesChannel" WHERE "storeId" = $1 AND "salesChannelId" = $2`, [storeId, salesChannelId]);
  }

  private mapChannel(row: SalesChannelRow): SalesChannel {
    return SalesChannel.reconstitute({
      ...row,
      config: row.config ?? {},
      metadata: row.metadata ?? {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  private mapAssignment(row: StoreSalesChannelRow): StoreSalesChannel {
    const channel = row.channelId
      ? SalesChannel.reconstitute({
          salesChannelId: row.channelId,
          organizationId: row.organizationId!,
          code: row.code!,
          name: row.name!,
          type: row.type!,
          status: row.status!,
          config: row.config ?? {},
          metadata: row.metadata ?? {},
          createdAt: new Date(row.channelCreatedAt!),
          updatedAt: new Date(row.channelUpdatedAt!),
        })
      : undefined;
    return {
      storeSalesChannelId: row.storeSalesChannelId,
      storeId: row.storeId,
      salesChannelId: row.salesChannelId,
      isDefault: Boolean(row.isDefault),
      isActive: Boolean(row.isActive),
      settings: row.settings ?? {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      channel,
    };
  }
}

export default new SalesChannelRepo();
