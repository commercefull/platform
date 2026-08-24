jest.mock('../../../../libs/db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
}));

import { GenerateReportUseCase } from './GenerateReport';
import { AnalyticsValidationError } from '../../domain/errors/AnalyticsErrors';
import { query, queryOne } from '../../../../libs/db';

describe('GenerateReportUseCase', () => {
  let useCase: GenerateReportUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GenerateReportUseCase();
  });

  it('should generate sales report (happy path)', async () => {
    const result = await useCase.execute('sales', { period: '30d' });
    expect(result.title).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should generate sales report with data', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      { date: '2026-01-01', orders: '10', revenue: '1000', customers: '5' },
    ]).mockResolvedValueOnce([
      { product_id: 'p1', name: 'Widget', sales: '5', revenue: '500' },
    ]);

    const result = await useCase.execute('sales', { period: '7d' });
    expect(result.summary.totalOrders).toBe(10);
    expect(result.summary.totalRevenue).toBe(1000);
    expect(result.charts).toHaveLength(2);
  });

  it('should generate customer report', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      { date: '2026-01-01', new_customers: '3', returning_customers: '2', orders: '5', revenue: '500' },
    ]).mockResolvedValueOnce([
      { segment: 'High Value', customers: '10', revenue: '5000' },
    ]);

    const result = await useCase.execute('customers', { period: '7d' });
    expect(result.title).toContain('Customer');
    expect(result.summary.newCustomers).toBe(3);
  });

  it('should generate product report', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      { product_id: 'p1', name: 'Widget', category: 'electronics', sales: '10', revenue: '500', stock: '5', views: '100' },
    ]);

    const result = await useCase.execute('products', { period: '90d' });
    expect(result.summary.totalProducts).toBe(1);
    expect(result.summary.lowStockProducts).toBe(1);
  });

  it('should generate inventory report', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      { product_id: 'p1', name: 'Widget', category: 'electronics', stock_quantity: '5', reorder_point: '10', cost_price: '20', sales_velocity: '2' },
    ]);

    const result = await useCase.execute('inventory', { period: '30d' });
    expect(result.summary.lowStockProducts).toBe(1);
  });

  it('should generate executive report', async () => {
    (queryOne as jest.Mock).mockResolvedValueOnce({
      revenue: '10000', orders: '50', customers: '30', profit: '2500',
    });

    const result = await useCase.execute('executive', { period: '1y' });
    expect(result.summary.totalRevenue).toBe(10000);
    expect(result.summary.profitMargin).toBe(25);
  });

  it('should handle default period', async () => {
    const result = await useCase.execute('sales', {});
    expect(result.title).toBeDefined();
  });

  it('should throw AnalyticsValidationError for unknown report type', async () => {
    await expect(useCase.execute('unknown', {}))
      .rejects.toThrow(AnalyticsValidationError);
  });
});
