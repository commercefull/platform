import { GetProductPerformanceUseCase} from './GetProductPerformance';

describe('GetProductPerformanceUseCase', () => {
  let useCase: GetProductPerformanceUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getProductPerformance: jest.fn().mockResolvedValue([
        { productId: 'p1', name: 'Widget', sku: 'SKU1', views: 100, addToCarts: 20, purchases: 10, revenue: 500, units: 10, returns: 1 },
        { productId: 'p2', name: 'Gadget', sku: 'SKU2', views: 50, addToCarts: 5, purchases: 2, revenue: 100, units: 2, returns: 0 },
      ]),
    };
    useCase = new GetProductPerformanceUseCase(mockRepo as never);
  });

  it('should get product performance (happy path)', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'),
    });

    expect(result.products).toHaveLength(2);
    expect(result.products[0].conversionRate).toBe(10);
    expect(result.summary.totalRevenue).toBe(600);
    expect(result.summary.totalViews).toBe(150);
  });

  it('should calculate return rate', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'),
    });

    expect(result.products[0].returnRate).toBe(10);
    expect(result.products[1].returnRate).toBe(0);
  });

  it('should pass filters to repository', async () => {
    await useCase.execute({
      storeId: 's1', categoryId: 'cat1', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), sortBy: 'units', limit: 10,
    });

    expect(mockRepo.getProductPerformance).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 's1', categoryId: 'cat1' }),
      expect.any(Date), expect.any(Date), 'units', 10,
    );
  });
});
