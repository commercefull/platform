import '../../tests/testUtils';
import { GetProductPerformanceUseCase } from './GetProductPerformance';
import { createProductPerformanceRepository } from '../../tests/testUtils';

describe('GetProductPerformanceUseCase', () => {
  const analyticsRepo = createProductPerformanceRepository();
  const useCase = new GetProductPerformanceUseCase(analyticsRepo);

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsRepo.getProductPerformance.mockResolvedValue([
      {
        productId: 'p1',
        name: 'Widget',
        sku: 'SKU1',
        views: 100,
        addToCarts: 20,
        purchases: 10,
        revenueCents: 500,
        units: 10,
        returns: 1,
      },
      {
        productId: 'p2',
        name: 'Gadget',
        sku: 'SKU2',
        views: 50,
        addToCarts: 5,
        purchases: 2,
        revenueCents: 100,
        units: 2,
        returns: 0,
      },
    ]);
  });

  it('should return product performance with aggregated summary', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });

    expect(result.products).toHaveLength(2);
    expect(result.products[0].conversionRate).toBe(10);
    expect(result.summary.totalRevenueCents).toBe(600);
    expect(result.summary.totalViews).toBe(150);
  });

  it('should calculate the return rate per product', async () => {
    const result = await useCase.execute({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });

    expect(result.products[0].returnRate).toBe(10);
    expect(result.products[1].returnRate).toBe(0);
  });

  it('should pass filters and sorting to the repository', async () => {
    await useCase.execute({
      storeId: 's1',
      categoryId: 'cat1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      sortBy: 'units',
      limit: 10,
    });

    expect(analyticsRepo.getProductPerformance).toHaveBeenCalledWith(
      { storeId: 's1', categoryId: 'cat1' },
      new Date('2024-01-01'),
      new Date('2024-12-31'),
      'units',
      10,
    );
  });
});
