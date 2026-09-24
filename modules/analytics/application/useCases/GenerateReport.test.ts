import '../../tests/testUtils';
import { GenerateReportUseCase } from './GenerateReport';
import { AnalyticsValidationError } from '../../domain/errors/AnalyticsErrors';
import { queryMock, queryOneMock } from '../../tests/testUtils';

describe('GenerateReportUseCase', () => {
  const useCase = new GenerateReportUseCase();

  it('should generate a sales report with title and summary', async () => {
    const result = await useCase.execute('sales', { period: '30d' });

    expect(result.title).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should aggregate sales rows into report summary and charts', async () => {
    queryMock
      .mockResolvedValueOnce([{ date: '2026-01-01', orders: '10', revenue: '1000', customers: '5' }])
      .mockResolvedValueOnce([{ product_id: 'p1', name: 'Widget', sales: '5', revenue: '500' }]);

    const result = await useCase.execute('sales', { period: '7d' });

    expect(result.summary.totalOrders).toBe(10);
    expect(result.summary.totalRevenueCents).toBe(1000);
    expect(result.charts).toHaveLength(2);
  });

  it('should generate a customer report with segment data', async () => {
    queryMock
      .mockResolvedValueOnce([
        { date: '2026-01-01', new_customers: '3', returning_customers: '2', orders: '5', revenue: '500' },
      ])
      .mockResolvedValueOnce([{ segment: 'High Value', customers: '10', revenue: '5000' }]);

    const result = await useCase.execute('customers', { period: '7d' });

    expect(result.title).toContain('Customer');
    expect(result.summary.newCustomers).toBe(3);
  });

  it('should flag low-stock products in a product report', async () => {
    queryMock.mockResolvedValueOnce([
      { product_id: 'p1', name: 'Widget', category: 'electronics', sales: '10', revenue: '500', stock: '5', views: '100' },
    ]);

    const result = await useCase.execute('products', { period: '90d' });

    expect(result.summary.totalProducts).toBe(1);
    expect(result.summary.lowStockProducts).toBe(1);
  });

  it('should flag low-stock products and total inventory value in an inventory report', async () => {
    queryMock.mockResolvedValueOnce([
      {
        product_id: 'p1',
        name: 'Widget',
        category: 'electronics',
        stock_quantity: '5',
        reorder_point: '10',
        cost_price_cents: '2000',
        sales_velocity: '2',
      },
    ]);

    const result = await useCase.execute('inventory', { period: '30d' });

    expect(result.summary.lowStockProducts).toBe(1);
    expect(result.summary.totalInventoryValueCents).toBe(10000);
  });

  it('should generate an executive summary report with revenue and profit', async () => {
    queryOneMock.mockResolvedValueOnce({ revenue: '5000', orders: '100', customers: '60', profit: '1250' });

    const result = await useCase.execute('executive', { period: '30d' });

    expect(result.title).toContain('Executive');
    expect(result.summary.totalRevenueCents).toBe(5000);
    expect(result.summary.profitMargin).toBe(25);
  });

  it('should default the period to 30d when none is given', async () => {
    await useCase.execute('sales', {});

    expect(queryMock).toHaveBeenCalled();
  });

  it('should throw AnalyticsValidationError when the report type is unknown', async () => {
    await expect(useCase.execute('unknown', {})).rejects.toThrow(AnalyticsValidationError);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
