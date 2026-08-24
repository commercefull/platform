/**
 * Theme Repository Implementation (PostgreSQL)
 */

import { query, queryOne } from '../../../../libs/db';
import { ThemeRepository } from '../../domain/repositories/ThemeRepository';
import { Theme, ThemeProps, ThemeStatus, ThemeType, ThemeSettingsSchema, ThemeLayoutConfig, ThemeComponentConfig, ThemeAssetConfig } from '../../domain/entities/Theme';
import { ThemeOverride, ThemeOverrideProps } from '../../domain/entities/ThemeOverride';

export class ThemeRepositoryImpl implements ThemeRepository {
  // ── Theme CRUD ──────────────────────────────────────────────

  async findById(themeId: string): Promise<Theme | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "theme" WHERE "themeId" = $1',
      [themeId],
    );
    return row ? this.mapToTheme(row) : null;
  }

  async findBySlug(slug: string): Promise<Theme | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "theme" WHERE slug = $1',
      [slug],
    );
    return row ? this.mapToTheme(row) : null;
  }

  async findAll(filters?: { status?: string; type?: string; tags?: string[]; organizationId?: string }): Promise<Theme[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`status = $${idx}`);
      idx++;
    }
    if (filters?.type) {
      params.push(filters.type);
      conditions.push(`type = $${idx}`);
      idx++;
    }
    if (filters?.organizationId) {
      params.push(filters.organizationId);
      conditions.push(`"organizationId" = $${idx}`);
      idx++;
    }
    if (filters?.tags && filters.tags.length > 0) {
      params.push(JSON.stringify(filters.tags));
      conditions.push(`tags @> $${idx}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query<Record<string, unknown>[]>(
      `SELECT * FROM "theme" ${where} ORDER BY "createdAt" ASC`,
      params,
    );
    return (rows || []).map(row => this.mapToTheme(row));
  }

  async findActive(): Promise<Theme[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "theme" WHERE status = $1 ORDER BY "createdAt" ASC',
      ['active'],
    );
    return (rows || []).map(row => this.mapToTheme(row));
  }

  async findBuiltIn(): Promise<Theme[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "theme" WHERE type = $1 ORDER BY "createdAt" ASC',
      ['built_in'],
    );
    return (rows || []).map(row => this.mapToTheme(row));
  }

  async save(theme: Theme): Promise<Theme> {
    const now = new Date().toISOString();
    const json = theme.toJSON();

    const existing = await queryOne<Record<string, unknown>>(
      'SELECT "themeId" FROM "theme" WHERE "themeId" = $1',
      [theme.themeId],
    );

    if (existing) {
      await query(
        `UPDATE "theme" SET
          name = $1, description = $2, version = $3, type = $4, status = $5,
          author = $6, "screenshotUrl" = $7, "previewUrl" = $8,
          "settingsSchema" = $9, "defaultSettings" = $10, layout = $11,
          components = $12, assets = $13, tags = $14, "isCustomizable" = $15,
          "organizationId" = $16, "updatedAt" = $17
        WHERE "themeId" = $18`,
        [
          json.name, json.description, json.version, json.type, json.status,
          json.author, json.screenshotUrl, json.previewUrl,
          JSON.stringify(json.settingsSchema), JSON.stringify(json.defaultSettings),
          JSON.stringify(json.layout), JSON.stringify(json.components), JSON.stringify(json.assets),
          JSON.stringify(json.tags), json.isCustomizable, json.organizationId,
          now, theme.themeId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "theme" (
          "themeId", slug, name, description, version, type, status,
          author, "screenshotUrl", "previewUrl",
          "settingsSchema", "defaultSettings", layout, components, assets,
          tags, "isCustomizable", "organizationId", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )`,
        [
          theme.themeId, theme.slug, json.name, json.description, json.version,
          json.type, json.status, json.author, json.screenshotUrl, json.previewUrl,
          JSON.stringify(json.settingsSchema), JSON.stringify(json.defaultSettings),
          JSON.stringify(json.layout), JSON.stringify(json.components), JSON.stringify(json.assets),
          JSON.stringify(json.tags), json.isCustomizable, json.organizationId,
          theme.createdAt.toISOString(), now,
        ],
      );
    }

    return theme;
  }

  async delete(themeId: string): Promise<boolean> {
    const result = await query<{ rowCount?: number }>(
      'DELETE FROM "theme" WHERE "themeId" = $1',
      [themeId],
    );
    return (result?.rowCount ?? 0) > 0;
  }

  // ── Theme Override CRUD ─────────────────────────────────────

  async findOverrideByStore(storeId: string): Promise<ThemeOverride | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "themeOverride" WHERE "storeId" = $1 AND "isActive" = true',
      [storeId],
    );
    return row ? this.mapToOverride(row) : null;
  }

  async findOverrideById(overrideId: string): Promise<ThemeOverride | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "themeOverride" WHERE "overrideId" = $1',
      [overrideId],
    );
    return row ? this.mapToOverride(row) : null;
  }

  async findOverridesByTheme(themeId: string): Promise<ThemeOverride[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "themeOverride" WHERE "themeId" = $1 ORDER BY "createdAt" DESC',
      [themeId],
    );
    return (rows || []).map(row => this.mapToOverride(row));
  }

  async findOverridesByOrganization(organizationId: string): Promise<ThemeOverride[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "themeOverride" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC',
      [organizationId],
    );
    return (rows || []).map(row => this.mapToOverride(row));
  }

  async saveOverride(override: ThemeOverride): Promise<ThemeOverride> {
    const now = new Date().toISOString();
    const json = override.toJSON();

    const existing = await queryOne<Record<string, unknown>>(
      'SELECT "overrideId" FROM "themeOverride" WHERE "overrideId" = $1',
      [override.overrideId],
    );

    if (existing) {
      await query(
        `UPDATE "themeOverride" SET
          settings = $1, "customCss" = $2, "customLogoUrl" = $3, "customFaviconUrl" = $4,
          "customBannerUrl" = $5, "customHeadTags" = $6, "customBodyAttributes" = $7,
          "isActive" = $8, "updatedAt" = $9
        WHERE "overrideId" = $10`,
        [
          JSON.stringify(json.settings), json.customCss, json.customLogoUrl,
          json.customFaviconUrl, json.customBannerUrl,
          JSON.stringify(json.customHeadTags || []), JSON.stringify(json.customBodyAttributes || {}),
          json.isActive, now, override.overrideId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "themeOverride" (
          "overrideId", "storeId", "themeId", "organizationId",
          settings, "customCss", "customLogoUrl", "customFaviconUrl",
          "customBannerUrl", "customHeadTags", "customBodyAttributes",
          "isActive", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )`,
        [
          override.overrideId, override.storeId, override.themeId, override.organizationId,
          JSON.stringify(json.settings), json.customCss, json.customLogoUrl,
          json.customFaviconUrl, json.customBannerUrl,
          JSON.stringify(json.customHeadTags || []), JSON.stringify(json.customBodyAttributes || {}),
          json.isActive, override.createdAt.toISOString(), now,
        ],
      );
    }

    return override;
  }

  async deleteOverride(overrideId: string): Promise<boolean> {
    const result = await query<{ rowCount?: number }>(
      'DELETE FROM "themeOverride" WHERE "overrideId" = $1',
      [overrideId],
    );
    return (result?.rowCount ?? 0) > 0;
  }

  // ── Theme Assignment ────────────────────────────────────────

  async findThemeAssignment(storeId: string): Promise<{ themeId: string; overrideId?: string } | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT "themeId", "overrideId" FROM "themeAssignment" WHERE "storeId" = $1',
      [storeId],
    );
    if (!row) return null;
    return {
      themeId: row.themeId as string,
      overrideId: row.overrideId as string | undefined,
    };
  }

  async assignThemeToStore(storeId: string, themeId: string, organizationId: string): Promise<void> {
    const now = new Date().toISOString();
    const existing = await queryOne<Record<string, unknown>>(
      'SELECT "storeId" FROM "themeAssignment" WHERE "storeId" = $1',
      [storeId],
    );

    if (existing) {
      await query(
        'UPDATE "themeAssignment" SET "themeId" = $1, "organizationId" = $2, "updatedAt" = $3 WHERE "storeId" = $4',
        [themeId, organizationId, now, storeId],
      );
    } else {
      await query(
        'INSERT INTO "themeAssignment" ("storeId", "themeId", "organizationId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5)',
        [storeId, themeId, organizationId, now, now],
      );
    }
  }

  async unassignThemeFromStore(storeId: string): Promise<boolean> {
    const result = await query<{ rowCount?: number }>(
      'DELETE FROM "themeAssignment" WHERE "storeId" = $1',
      [storeId],
    );
    return (result?.rowCount ?? 0) > 0;
  }

  // ── Mapping ─────────────────────────────────────────────────

  private mapToTheme(row: Record<string, unknown>): Theme {
    const props: ThemeProps = {
      themeId: row.themeId as string,
      slug: row.slug as string,
      name: row.name as string,
      description: row.description as string | undefined,
      version: row.version as string,
      type: row.type as ThemeType,
      status: row.status as ThemeStatus,
      author: row.author as string | undefined,
      screenshotUrl: row.screenshotUrl as string | undefined,
      previewUrl: row.previewUrl as string | undefined,
      settingsSchema: row.settingsSchema as ThemeSettingsSchema,
      defaultSettings: row.defaultSettings as Record<string, string | number | boolean>,
      layout: row.layout as ThemeLayoutConfig,
      components: row.components as ThemeComponentConfig,
      assets: row.assets as ThemeAssetConfig,
      tags: row.tags as string[],
      isCustomizable: row.isCustomizable as boolean,
      organizationId: row.organizationId as string | undefined,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
    return Theme.reconstitute(props);
  }

  private mapToOverride(row: Record<string, unknown>): ThemeOverride {
    const props: ThemeOverrideProps = {
      overrideId: row.overrideId as string,
      storeId: row.storeId as string,
      themeId: row.themeId as string,
      organizationId: row.organizationId as string,
      settings: row.settings as Record<string, string | number | boolean>,
      customCss: row.customCss as string | undefined,
      customLogoUrl: row.customLogoUrl as string | undefined,
      customFaviconUrl: row.customFaviconUrl as string | undefined,
      customBannerUrl: row.customBannerUrl as string | undefined,
      customHeadTags: row.customHeadTags as string[] | undefined,
      customBodyAttributes: row.customBodyAttributes as Record<string, string> | undefined,
      isActive: row.isActive as boolean,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
    return ThemeOverride.reconstitute(props);
  }
}
