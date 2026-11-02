/**
 * Report Dashboard Repository
 *
 * Custom dashboard management for real-time reporting — split from
 * reportingRepo.ts; its public functions are re-exported there.
 */

import { query, queryOne } from '../../../../libs/db';
import type { AnalyticsReportDashboard as AnalyticsReportDashboardRow } from '../../../../libs/db/types';
import type { AnalyticsReportDashboard } from '../../domain/types';
import type { AnalyticsReportDashboard as DbAnalyticsReportDashboard } from '../../../../libs/db/types';

// ============================================================================
// Dashboards
// ============================================================================

export async function getDashboards(organizationId?: string): Promise<AnalyticsReportDashboard[]> {
  let whereClause = '1=1';
  const params: unknown[] = [];

  if (organizationId) {
    whereClause = '"organizationId" = $1 OR "isShared" = true';
    params.push(organizationId);
  }

  const rows = await query<DbAnalyticsReportDashboard[]>(
    `SELECT * FROM "analyticsReportDashboard" WHERE ${whereClause} ORDER BY "isDefault" DESC, "name" ASC`,
    params,
  );

  return (rows || []).map(mapToAnalyticsReportDashboard);
}

export async function getDashboard(dashboardId: string): Promise<AnalyticsReportDashboard | null> {
  const row = await queryOne<DbAnalyticsReportDashboard>(
    'SELECT * FROM "analyticsReportDashboard" WHERE "analyticsReportDashboardId" = $1',
    [dashboardId],
  );
  return row ? mapToAnalyticsReportDashboard(row) : null;
}

export async function saveDashboard(
  dashboard: Partial<AnalyticsReportDashboard> & {
    name: string;
  },
): Promise<AnalyticsReportDashboard> {
  const now = new Date().toISOString();

  if (dashboard.analyticsReportDashboardId) {
    await query(
      `UPDATE "analyticsReportDashboard" SET
        "name" = $1, "slug" = $2, "description" = $3,
        "isDefault" = $4, "isShared" = $5,
        "layout" = $6, "widgets" = $7, "filters" = $8, "dateRange" = $9,
        "updatedAt" = $10
       WHERE "analyticsReportDashboardId" = $11`,
      [
        dashboard.name,
        dashboard.slug,
        dashboard.description,
        dashboard.isDefault || false,
        dashboard.isShared || false,
        dashboard.layout ? JSON.stringify(dashboard.layout) : null,
        dashboard.widgets ? JSON.stringify(dashboard.widgets) : null,
        dashboard.filters ? JSON.stringify(dashboard.filters) : null,
        dashboard.dateRange || 'last_30_days',
        now,
        dashboard.analyticsReportDashboardId,
      ],
    );
    return (await getDashboard(dashboard.analyticsReportDashboardId))!;
  } else {
    const result = await queryOne<DbAnalyticsReportDashboard>(
      `INSERT INTO "analyticsReportDashboard" (
        "organizationId", "createdBy", "name", "slug", "description",
        "isDefault", "isShared", "layout", "widgets", "filters", "dateRange",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        dashboard.organizationId,
        dashboard.createdBy,
        dashboard.name,
        dashboard.slug,
        dashboard.description,
        dashboard.isDefault || false,
        dashboard.isShared || false,
        dashboard.layout ? JSON.stringify(dashboard.layout) : null,
        dashboard.widgets ? JSON.stringify(dashboard.widgets) : null,
        dashboard.filters ? JSON.stringify(dashboard.filters) : null,
        dashboard.dateRange || 'last_30_days',
        now,
        now,
      ],
    );
    return mapToAnalyticsReportDashboard(result!);
  }
}

export async function deleteDashboard(dashboardId: string): Promise<void> {
  await query('DELETE FROM "analyticsReportDashboard" WHERE "analyticsReportDashboardId" = $1', [dashboardId]);
}

// ============================================================================
// Mappers
// ============================================================================

function mapToAnalyticsReportDashboard(row: AnalyticsReportDashboardRow): AnalyticsReportDashboard {
  return {
    analyticsReportDashboardId: row.analyticsReportDashboardId,
    organizationId: row.organizationId ?? undefined,
    createdBy: row.createdBy ?? undefined,
    name: row.name,
    slug: row.slug ?? undefined,
    description: row.description ?? undefined,
    isDefault: Boolean(row.isDefault),
    isShared: Boolean(row.isShared),
    layout: (row.layout as Record<string, unknown>) ?? undefined,
    widgets: (row.widgets as unknown[]) ?? undefined,
    filters: (row.filters as Record<string, unknown>) ?? undefined,
    dateRange: row.dateRange ?? 'last_30_days',
    createdAt: new Date(row.createdAt ?? new Date()),
    updatedAt: new Date(row.updatedAt ?? new Date()),
  };
}
