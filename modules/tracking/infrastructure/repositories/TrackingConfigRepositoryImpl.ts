import { query, queryOne } from '../../../../libs/db';
import { TrackingConfig, TrackingConfigProps, GTMConfig, MetaCAPIConfig, EventMapping } from '../../domain/entities/TrackingConfig';
import { TrackingConfigRepository } from '../../domain/repositories/TrackingConfigRepository';

export class TrackingConfigRepositoryImpl implements TrackingConfigRepository {
  async findById(configId: string): Promise<TrackingConfig | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "trackingConfig" WHERE "configId" = $1',
      [configId],
    );
    return row ? this.mapToEntity(row) : null;
  }

  async findByStoreId(storeId: string): Promise<TrackingConfig | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "trackingConfig" WHERE "storeId" = $1',
      [storeId],
    );
    return row ? this.mapToEntity(row) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<TrackingConfig[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "trackingConfig" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC',
      [organizationId],
    );
    return (rows || []).map(row => this.mapToEntity(row));
  }

  async save(config: TrackingConfig): Promise<TrackingConfig> {
    const props = this.getProps(config);

    const existing = await queryOne<Record<string, unknown>>(
      'SELECT "configId" FROM "trackingConfig" WHERE "configId" = $1',
      [props.configId],
    );

    if (existing) {
      await query(
        `UPDATE "trackingConfig" SET
          "storeId" = $2,
          "organizationId" = $3,
          "status" = $4,
          "gtm" = $5,
          "metaCapi" = $6,
          "eventMappings" = $7,
          "defaultConsentCategory" = $8,
          "hashPii" = $9,
          "serverSideEnabled" = $10,
          "updatedAt" = NOW()
        WHERE "configId" = $1`,
        [
          props.configId,
          props.storeId,
          props.organizationId,
          props.status,
          JSON.stringify(props.gtm),
          JSON.stringify(props.metaCapi),
          JSON.stringify(props.eventMappings),
          props.defaultConsentCategory,
          props.hashPii,
          props.serverSideEnabled,
        ],
      );
    } else {
      await query(
        `INSERT INTO "trackingConfig" (
          "configId", "storeId", "organizationId", "status",
          "gtm", "metaCapi", "eventMappings",
          "defaultConsentCategory", "hashPii", "serverSideEnabled",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          props.configId,
          props.storeId,
          props.organizationId,
          props.status,
          JSON.stringify(props.gtm),
          JSON.stringify(props.metaCapi),
          JSON.stringify(props.eventMappings),
          props.defaultConsentCategory,
          props.hashPii,
          props.serverSideEnabled,
        ],
      );
    }

    return config;
  }

  async delete(configId: string): Promise<void> {
    await query('DELETE FROM "trackingConfig" WHERE "configId" = $1', [configId]);
  }

  private getProps(config: TrackingConfig): TrackingConfigProps {
    return {
      configId: config.configId,
      storeId: config.storeId,
      organizationId: config.organizationId,
      status: config.status,
      gtm: config.gtm,
      metaCapi: config.metaCapi,
      eventMappings: config.eventMappings,
      defaultConsentCategory: config.defaultConsentCategory,
      hashPii: config.hashPii,
      serverSideEnabled: config.serverSideEnabled,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  private mapToEntity(row: Record<string, unknown>): TrackingConfig {
    return TrackingConfig.reconstitute({
      configId: row.configId as string,
      storeId: row.storeId as string,
      organizationId: row.organizationId as string,
      status: row.status as 'active' | 'disabled',
      gtm: row.gtm as GTMConfig | null,
      metaCapi: row.metaCapi as MetaCAPIConfig | null,
      eventMappings: row.eventMappings as EventMapping[],
      defaultConsentCategory: row.defaultConsentCategory as 'analytics' | 'marketing' | 'thirdParty',
      hashPii: row.hashPii as boolean,
      serverSideEnabled: row.serverSideEnabled as boolean,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    });
  }
}
