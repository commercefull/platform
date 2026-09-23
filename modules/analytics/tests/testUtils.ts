/**
 * Shared test helpers for the analytics module.
 * Boundary mocks (event bus, libs/db) + typed port mocks.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { query, queryOne } from '../../../libs/db';
import type { AnalyticsDataPort, SalesSummary, RealTimeMetrics } from '../domain/repositories/AnalyticsDataPort';
import type { ProductPerformance, CustomerCohort } from '../domain/types';
import type { GetDashboardMetricsUseCase } from '../application/useCases/GetDashboardMetrics';
import type { GetProductPerformanceUseCase } from '../application/useCases/GetProductPerformance';
import type { GetSalesAnalyticsUseCase } from '../application/useCases/GetSalesAnalytics';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
}));

export const emitMock = jest.mocked(eventBus.emit);
export const queryMock = jest.mocked(query);
export const queryOneMock = jest.mocked(queryOne);

beforeEach(() => {
  emitMock.mockClear();
  queryMock.mockClear();
  queryOneMock.mockClear();
});

/**
 * A lazily-created `jest.Mocked<T>`: every accessed method is a `jest.fn`,
 * so tests configure only the methods they exercise. Works for anonymous
 * inline port shapes where an explicit factory would need re-declaring fields.
 */
function lazyMock<T>(): jest.Mocked<T> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
}

export function createAnalyticsDataPort(): jest.Mocked<AnalyticsDataPort> {
  return lazyMock<AnalyticsDataPort>();
}

export function createDashboardRepository(): jest.Mocked<ConstructorParameters<typeof GetDashboardMetricsUseCase>[0]> {
  return lazyMock();
}

export function createProductPerformanceRepository(): jest.Mocked<
  ConstructorParameters<typeof GetProductPerformanceUseCase>[0]
> {
  return lazyMock();
}

export function createSalesAnalyticsRepository(): jest.Mocked<ConstructorParameters<typeof GetSalesAnalyticsUseCase>[0]> {
  return lazyMock();
}

// ---------------------------------------------------------------------------
// Domain data factories (full port return shapes with Partial overrides)
// ---------------------------------------------------------------------------

export function createSalesSummary(overrides: Partial<SalesSummary> = {}): SalesSummary {
  return {
    totalRevenue: 5000,
    totalOrders: 100,
    averageOrderValue: 50,
    newCustomers: 20,
    conversionRate: 2.5,
    ...overrides,
  };
}

export function createRealTimeMetrics(overrides: Partial<RealTimeMetrics> = {}): RealTimeMetrics {
  return { activeUsers: 10, currentOrders: 3, revenueToday: 1200, conversionRate: 2.1, ...overrides };
}

export function createProductPerformance(overrides: Partial<ProductPerformance> = {}): ProductPerformance {
  return {
    analyticsProductPerformanceId: 'perf-1',
    productId: 'p1',
    date: new Date('2024-01-01'),
    channel: 'web',
    views: 100,
    uniqueViews: 80,
    detailViews: 60,
    addToCarts: 20,
    removeFromCarts: 2,
    viewToCartRate: 20,
    purchases: 10,
    quantitySold: 10,
    revenue: 1000,
    averagePrice: 100,
    cartToOrderRate: 50,
    returns: 1,
    returnQuantity: 1,
    returnRate: 10,
    reviews: 5,
    stockAlerts: 0,
    outOfStockViews: 0,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createCustomerCohort(overrides: Partial<CustomerCohort> = {}): CustomerCohort {
  return {
    analyticsCustomerCohortId: 'cohort-1',
    cohortMonth: new Date('2024-01-01'),
    monthNumber: 1,
    customersInCohort: 50,
    activeCustomers: 30,
    retentionRate: 60,
    revenue: 5000,
    orders: 100,
    averageOrderValue: 50,
    lifetimeValue: 100,
    repeatPurchasers: 20,
    repeatPurchaseRate: 40,
    averageOrdersPerCustomer: 2,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}
