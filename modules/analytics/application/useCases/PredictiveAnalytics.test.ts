import { PredictiveAnalyticsUseCase } from './PredictiveAnalytics';
import { AnalyticsValidationError } from '../../domain/errors/AnalyticsErrors';

jest.mock('../../../../libs/db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
}));

import { query } from '../../../../libs/db';

describe('PredictiveAnalyticsUseCase', () => {
  let useCase: PredictiveAnalyticsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new PredictiveAnalyticsUseCase();
  });

  it('should forecast sales revenue (happy path)', async () => {
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

  it('should throw AnalyticsValidationError for insufficient data', async () => {
    await expect(useCase.forecastSalesRevenue([], 7))
      .rejects.toThrow(AnalyticsValidationError);
  });

  it('should predict customer churn', async () => {
    const historicalData = Array.from({ length: 5 }, (_, i) => ({
      date: new Date(2026, 0, i + 1),
      orders: 5 - i,
      revenue: 500 - i * 100,
    }));

    const result = await useCase.predictCustomerChurn('c1', historicalData);

    expect(result.churnProbability).toBeGreaterThanOrEqual(0);
    expect(result.churnProbability).toBeLessThanOrEqual(1);
    expect(result.factors).toHaveLength(3);
  });

  it('should predict high risk churn for inactive customer', async () => {
    const oldDate = new Date(Date.now() - 120 * 86400000);
    const result = await useCase.predictCustomerChurn('c1', [
      { date: oldDate, orders: 1, revenue: 10 },
    ]);

    expect(result.riskLevel).toBe('high');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should predict low risk for active customer', async () => {
    const recentDate = new Date(Date.now() - 5 * 86400000);
    const result = await useCase.predictCustomerChurn('c1', Array.from({ length: 20 }, () => ({
      date: recentDate, orders: 20, revenue: 20000,
    })));

    expect(result.riskLevel).toBe('low');
  });

  it('should optimize inventory levels', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      { product_id: 'p1', name: 'Widget', stock_quantity: '5', reorder_point: '10', daily_sales_avg: '2', sales_volatility: '1' },
    ]);

    const result = await useCase.optimizeInventoryLevels();
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].productId).toBe('p1');
    expect(result.alerts.length).toBeGreaterThan(0);
  });

  it('should detect overstock in inventory optimization', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      { product_id: 'p1', name: 'Widget', stock_quantity: '1000', reorder_point: '10', daily_sales_avg: '1', sales_volatility: '0.5' },
    ]);

    const result = await useCase.optimizeInventoryLevels();
    expect(result.alerts.some(a => a.alertType === 'overstock')).toBe(true);
  });

  it('should generate product recommendations', async () => {
    (query as jest.Mock)
      .mockResolvedValueOnce([{ product_id: 'p1', category: 'electronics', purchased_at: new Date().toISOString() }])
      .mockResolvedValueOnce([{ product_id: 'p2' }])
      .mockResolvedValueOnce([{ product_id: 'p3', sales_count: '50', category: 'electronics' }])
      .mockResolvedValueOnce([{ product_a: 'p1', product_b: 'p2', frequency: '10' }]);

    const result = await useCase.generateProductRecommendations('c1');
    expect(result.personalized).toBeDefined();
    expect(result.trending).toBeDefined();
    expect(result.complementary).toBeDefined();
  });

  it('should perform customer segmentation', async () => {
    (query as jest.Mock).mockResolvedValueOnce([
      { customer_id: 'c1', recency: '10', frequency: '15', monetary: '600' },
      { customer_id: 'c2', recency: '200', frequency: '1', monetary: '50' },
    ]);

    const result = await useCase.performCustomerSegmentation();
    expect(result.segments).toHaveLength(4);
    expect(result.segments.find(s => s.id === 'champions')).toBeDefined();
    expect(result.segments.find(s => s.id === 'lost')).toBeDefined();
  });
});
