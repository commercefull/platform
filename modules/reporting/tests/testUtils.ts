/**
 * Shared test helpers for the reporting module.
 * Typed port mocks + record factories.
 */

import type { ReportingRepository } from '../domain/repositories/ReportingRepository';
import type { ReportScheduleProps, ReportExecutionProps, ReportData } from '../domain/entities/ReportEntities';

/**
 * A full `jest.Mocked<ReportingRepository>`: every accessed method is a
 * lazily-created `jest.fn`, so tests configure only the methods they exercise.
 */
export function createReportingRepository(): jest.Mocked<ReportingRepository> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<ReportingRepository>;
}

export function createReportSchedule(overrides: Partial<ReportScheduleProps> = {}): ReportScheduleProps {
  return {
    reportScheduleId: 'sched-1',
    organizationId: 'org-1',
    name: 'Daily Sales',
    reportType: 'sales_summary',
    frequency: 'daily',
    parameters: {},
    recipients: ['ops@example.com'],
    format: 'pdf',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createReportExecution(overrides: Partial<ReportExecutionProps> = {}): ReportExecutionProps {
  return {
    reportExecutionId: 'exec-1',
    reportScheduleId: 'sched-1',
    status: 'completed',
    startedAt: new Date(),
    completedAt: new Date(),
    ...overrides,
  };
}

export function createReportData(overrides: Partial<ReportData> = {}): ReportData {
  return {
    reportType: 'sales_summary',
    generatedAt: new Date(),
    dateRange: { from: new Date('2024-01-01'), to: new Date('2024-01-31') },
    summary: { totalOrders: 10, revenue: 1000 },
    rows: [],
    ...overrides,
  };
}
