/**
 * GetProductPerformance Use Case
 * 
 * Analyzes product performance metrics including sales, views, conversion.
 */

export interface GetProductPerformanceInput {
  storeId?: string;
  productId?: string;
  categoryId?: string;
  startDate: Date;
  endDate: Date;
  sortBy?: 'revenue' | 'units' | 'views' | 'conversion';
  limit?: number;
}

export interface ProductPerformanceItem {
  productId: string;
  name: string;
  sku: string;
  views: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  units: number;
  conversionRate: number;
  averagePrice: number;
  returnRate: number;
}

export interface GetProductPerformanceOutput {
  products: ProductPerformanceItem[];
  summary: {
    totalProducts: number;
    totalViews: number;
    totalPurchases: number;
    totalRevenue: number;
    averageConversionRate: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export class GetProductPerformanceUseCase {
  constructor(private readonly analyticsRepository: any) {}

  async execute(input: GetProductPerformanceInput): Promise<GetProductPerformanceOutput> {
    const {
      storeId,
      productId,
      categoryId,
      startDate,
      endDate,
      sortBy = 'revenue',
      limit = 50,
    } = input;

    // Build filters
    const filters: Record<string, unknown> = {};
    if (storeId) filters.storeId = storeId;
    if (productId) filters.productId = productId;
    if (categoryId) filters.categoryId = categoryId;

    // Get product performance data
    const products = await this.analyticsRepository.getProductPerformance(
      filters,
      startDate,
      endDate,
      sortBy,
      limit
    );

    // Calculate metrics for each product
    const enrichedProducts: ProductPerformanceItem[] = products.map((p: any) => ({
      productId: p.productId,
      name: p.name,
      sku: p.sku,
      views: p.views || 0,
      addToCarts: p.addToCarts || 0,
      purchases: p.purchases || 0,
      revenue: p.revenue || 0,
      units: p.units || 0,
      conversionRate: p.views > 0 ? (p.purchases / p.views) * 100 : 0,
      averagePrice: p.units > 0 ? p.revenue / p.units : 0,
      returnRate: p.purchases > 0 ? ((p.returns || 0) / p.purchases) * 100 : 0,
    }));

    // Calculate summary
    const summary = enrichedProducts.reduce(
      (acc, p) => ({
        totalProducts: acc.totalProducts + 1,
        totalViews: acc.totalViews + p.views,
        totalPurchases: acc.totalPurchases + p.purchases,
        totalRevenue: acc.totalRevenue + p.revenue,
        averageConversionRate: 0,
      }),
      {
        totalProducts: 0,
        totalViews: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        averageConversionRate: 0,
      }
    );

    summary.averageConversionRate = summary.totalViews > 0
      ? (summary.totalPurchases / summary.totalViews) * 100
      : 0;

    return {
      products: enrichedProducts,
      summary,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }
}
