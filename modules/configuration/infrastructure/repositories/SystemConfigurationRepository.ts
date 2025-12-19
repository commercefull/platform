/**
 * System Configuration Repository Implementation
 * PostgreSQL implementation for system configuration persistence
 */

import { query, queryOne } from '../../../../libs/db';
import { SystemConfigurationRepository as ISystemConfigurationRepository } from '../../domain/repositories/SystemConfigurationRepository';
import { SystemConfiguration } from '../../domain/entities/SystemConfiguration';

export class SystemConfigurationRepo implements ISystemConfigurationRepository {

  async findById(configId: string): Promise<SystemConfiguration | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM system_configuration WHERE "configId" = $1',
      [configId]
    );
    return row ? this.mapToSystemConfiguration(row) : null;
  }

  async findActive(): Promise<SystemConfiguration | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM system_configuration WHERE "isActive" = true ORDER BY "createdAt" DESC LIMIT 1',
      []
    );
    return row ? this.mapToSystemConfiguration(row) : null;
  }

  async findAll(): Promise<SystemConfiguration[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM system_configuration ORDER BY "createdAt" DESC',
      []
    );
    return (rows || []).map(row => this.mapToSystemConfiguration(row));
  }

  async save(config: SystemConfiguration): Promise<SystemConfiguration> {
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>(
      'SELECT "configId" FROM system_configuration WHERE "configId" = $1',
      [config.configId]
    );

    if (existing) {
      await query(
        `UPDATE system_configuration SET
          "systemMode" = $1, features = $2, "businessSettings" = $3,
          "platformSettings" = $4, "securitySettings" = $5, "notificationSettings" = $6,
          "integrationSettings" = $7, metadata = $8, "updatedAt" = $9
        WHERE "configId" = $10`,
        [
          config.systemMode, JSON.stringify(config.features),
          JSON.stringify(config.businessSettings), JSON.stringify(config.platformSettings),
          JSON.stringify(config.securitySettings), JSON.stringify(config.notificationSettings),
          JSON.stringify(config.integrationSettings), JSON.stringify(config.metadata || {}),
          now, config.configId
        ]
      );
    } else {
      await query(
        `INSERT INTO system_configuration (
          "configId", "systemMode", features, "businessSettings",
          "platformSettings", "securitySettings", "notificationSettings",
          "integrationSettings", metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          config.configId, config.systemMode, JSON.stringify(config.features),
          JSON.stringify(config.businessSettings), JSON.stringify(config.platformSettings),
          JSON.stringify(config.securitySettings), JSON.stringify(config.notificationSettings),
          JSON.stringify(config.integrationSettings), JSON.stringify(config.metadata || {}),
          now, now
        ]
      );
    }

    return config;
  }

  async delete(configId: string): Promise<void> {
    await query('DELETE FROM system_configuration WHERE "configId" = $1', [configId]);
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM system_configuration',
      []
    );
    return parseInt(result?.count || '0');
  }

  private mapToSystemConfiguration(row: Record<string, any>): SystemConfiguration {
    return SystemConfiguration.reconstitute({
      configId: row.configId,
      systemMode: row.systemMode,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
      businessSettings: typeof row.businessSettings === 'string' ? JSON.parse(row.businessSettings) : row.businessSettings,
      platformSettings: typeof row.platformSettings === 'string' ? JSON.parse(row.platformSettings) : row.platformSettings,
      securitySettings: typeof row.securitySettings === 'string' ? JSON.parse(row.securitySettings) : row.securitySettings,
      notificationSettings: typeof row.notificationSettings === 'string' ? JSON.parse(row.notificationSettings) : row.notificationSettings,
      integrationSettings: typeof row.integrationSettings === 'string' ? JSON.parse(row.integrationSettings) : row.integrationSettings,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}

export default new SystemConfigurationRepo();
