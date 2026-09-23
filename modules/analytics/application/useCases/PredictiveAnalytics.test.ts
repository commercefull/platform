import '../../tests/testUtils';
import { PredictiveAnalyticsUseCase } from './PredictiveAnalytics';
import { AnalyticsValidationError } from '../../domain/errors/AnalyticsErrors';
import { queryMock } from '../../tests/testUtils';

describe('PredictiveAnalyticsUseCase', () => {
  const useCase = new PredictiveAnalyticsUseCase();

  it('should forecast sales revenue for the requested horizon', async () => {
    const historicalData = Array.from({ length: 10 }, (_, i) => ({
      date: new Date(2026, 0, i + 1),
      revenue: 1000 + i * 100,
      orders: 10 + i,
    }));

    const result = await useCase.forecastSalesRevenue(historicalData, 7);

    expect(result.predictions).toHaveLength(7);
    expect(result.predictions[0].predicted).toBeGreaterThan(0);
    expect(result.predictions[0].confidence).toBeGreaterThan(0);
  });

  it('should throw AnalyticsValidationError when there is not enough historical data', async () => {
    await expect(useCase.forecastSalesRevenue([], 7)).rejects.toThrow(AnalyticsValidationError);
  });

  it('should predict customer churn from purchase history', async () => {
    const historicalData = Array.from({ length: 5 }, (_, i) => ({
      date: new Date(2026, 0, i + 1),
      orders: 5 - i,
      revenue: 500 - i * 50,
    }));

    const result = await useCase.predictCustomerChurn('c1', historicalData);

    expect(result.riskLevel).toBeDefined();
  });

  it('should flag high churn risk for an inactive customer', async () => {
    const oldDate = new Date(Date.now() - 120 * 86400000);
    const result = await useCase.predictCustomerChurn('c1', [{ date: oldDate, orders: 1, revenue: 10 }]);

    expect(result.riskLevel).toBe('high');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should flag low churn risk for an active customer', async () => {
    const recentDate = new Date(Date.now() - 5 * 86400000);
    const result = await useCase.predictCustomerChurn(
      'c1',
      Array.from({ length: 20 }, () => ({
        date: recentDate,
        orders: 20,
        revenue: 20000,
      })),
    );

    expect(result.riskLevel).toBe('low');
  });

  it('should recommend inventory levels and raise restock alerts', async () => {
    queryMock.mockResolvedValueOnce([
      { product_id: 'p1', name: 'Widget', stock_quantity: '5', reorder_point: '10', daily_sales_avg: '2', sales_volatility: '1' },
    ]);

    const result = await useCase.optimizeInventoryLevels();

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].productId).toBe('p1');
    expect(result.alerts.length).toBeGreaterThan(0);
  });

  it('should raise an overstock alert when stock far exceeds demand', async () => {
    queryMock.mockResolvedValueOnce([
      { product_id: 'p1', name: 'Widget', stock_quantity: '1000', reorder_point: '10', daily_sales_avg: '1', sales_volatility: '0.5' },
    ]);

    const result = await useCase.optimizeInventoryLevels();

    expect(result.alerts.some(a => a.alertType === 'overstock')).toBe(true);
  });

  it('should generate personalized, trending and complementary recommendations', async () => {
    queryMock
      .mockResolvedValueOnce([{ product_id: 'p1', category: 'electronics', purchased_at: new Date().toISOString() }])
      .mockResolvedValueOnce([{ product_id: 'p2' }])
      .mockResolvedValueOnce([{ product_id: 'p3', sales_count: '50', category: 'electronics' }])
      .mockResolvedValueOnce([{ product_a: 'p1', product_b: 'p2', frequency: '10' }]);

    const result = await useCase.generateProductRecommendations('c1');

    expect(result.personalized).toBeDefined();
    expect(result.trending).toBeDefined();
    expect(result.complementary).toBeDefined();
  });

  it('should segment customers into behavioral groups', async () => {
    queryMock.mockResolvedValueOnce([
      { customer_id: 'c1', recency: '10', frequency: '15', monetary: '600' },
      { customer_id: 'c2', recency: '200', frequency: '1', monetary: '50' },
    ]);

    const result = await useCase.performCustomerSegmentation();

    expect(result.segments).toHaveLength(4);
    expect(result.segments.find(s => s.id === 'champions')).toBeDefined();
    expect(result.segments.find(s => s.id === 'lost')).toBeDefined();
  });
});
