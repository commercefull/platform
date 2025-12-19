/**
 * Machine Learning Service
 * Provides AI-powered analytics, predictions, and recommendations
 * for the CommerceFull platform - Phase 7
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Sales Forecasting
// ============================================================================

export async function forecastSalesRevenue(
  historicalData: Array<{ date: Date; revenue: number; orders: number }>,
  forecastDays: number = 30
): Promise<{
  predictions: Array<{ date: Date; predicted: number; confidence: number }>;
  trends: { slope: number; seasonality: number; accuracy: number };
}> {
  // Simple linear regression for demonstration
  // In production, this would use ML libraries like TensorFlow.js

  if (historicalData.length < 7) {
    throw new Error('Insufficient historical data for forecasting');
  }

  // Calculate trend using simple moving average
  const recentData = historicalData.slice(-30); // Last 30 days
  const avgRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length;
  const avgOrders = recentData.reduce((sum, d) => sum + d.orders, 0) / recentData.length;

  // Simple trend calculation
  const slope = calculateTrendSlope(recentData);

  // Generate predictions
  const predictions = [];
  const lastDate = new Date(recentData[recentData.length - 1].date);

  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    // Simple linear projection with some randomness
    const basePrediction = avgRevenue * (1 + slope * i);
    const seasonalFactor = getSeasonalFactor(forecastDate);
    const predicted = basePrediction * seasonalFactor;

    // Confidence decreases over time
    const confidence = Math.max(0.5, 0.9 - (i / forecastDays) * 0.4);

    predictions.push({
      date: forecastDate,
      predicted: Math.max(0, predicted),
      confidence
    });
  }

  return {
    predictions,
    trends: {
      slope,
      seasonality: 1.05, // Simplified seasonal factor
      accuracy: 0.75 // Would be calculated from validation data
    }
  };
}

// ============================================================================
// Customer Churn Prediction
// ============================================================================

export async function predictCustomerChurn(
  customerId: string,
  historicalData: Array<{ date: Date; orders: number; revenue: number }>
): Promise<{
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: Array<{ factor: string; impact: number; weight: number }>;
  recommendations: string[];
}> {
  // Simplified churn prediction logic
  // In production, this would use ML classification models

  const totalOrders = historicalData.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  const lastOrderDate = new Date(Math.max(...historicalData.map(d => d.date.getTime())));
  const daysSinceLastOrder = Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate risk factors
  const recencyScore = Math.min(1, daysSinceLastOrder / 90); // Higher score = higher risk
  const frequencyScore = Math.min(1, 1 / Math.max(1, totalOrders / 12)); // Lower frequency = higher risk
  const monetaryScore = Math.min(1, 500 / Math.max(1, avgOrderValue)); // Lower value = higher risk

  const churnProbability = (recencyScore * 0.4 + frequencyScore * 0.3 + monetaryScore * 0.3);

  let riskLevel: 'low' | 'medium' | 'high';
  if (churnProbability < 0.3) riskLevel = 'low';
  else if (churnProbability < 0.7) riskLevel = 'medium';
  else riskLevel = 'high';

  const factors = [
    { factor: 'Days since last order', impact: recencyScore, weight: 0.4 },
    { factor: 'Order frequency', impact: frequencyScore, weight: 0.3 },
    { factor: 'Average order value', impact: monetaryScore, weight: 0.3 }
  ];

  const recommendations = [];
  if (riskLevel === 'high') {
    recommendations.push('Send immediate re-engagement email');
    recommendations.push('Offer special discount for next purchase');
    recommendations.push('Personalized product recommendations');
  } else if (riskLevel === 'medium') {
    recommendations.push('Send win-back campaign');
    recommendations.push('Loyalty program reminder');
  }

  return {
    churnProbability,
    riskLevel,
    factors,
    recommendations
  };
}

// ============================================================================
// Inventory Optimization
// ============================================================================

export async function optimizeInventoryLevels(): Promise<{
  recommendations: Array<{
    productId: string;
    currentStock: number;
    recommendedStock: number;
    reorderPoint: number;
    confidence: number;
    reason: string;
  }>;
  alerts: Array<{
    productId: string;
    alertType: 'overstock' | 'understock' | 'reorder';
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
}> {
  // Get product sales data
  const productData = await query<Array<{
    product_id: string;
    name: string;
    stock_quantity: string;
    reorder_point: string;
    daily_sales_avg: string;
    sales_volatility: string;
  }>>(
    `SELECT
      p.product_id,
      p.name,
      p.stock_quantity,
      p.reorder_point,
      AVG(oi.quantity) as daily_sales_avg,
      STDDEV(oi.quantity) as sales_volatility
    FROM product p
    LEFT JOIN order_item oi ON p.product_id = oi.product_id
    LEFT JOIN "order" o ON oi.order_id = o.order_id AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
    WHERE p.is_active = true
    GROUP BY p.product_id, p.name, p.stock_quantity, p.reorder_point`
  );

  const recommendations = [];
  const alerts = [];

  const productDataSafe = productData || [];

  for (const product of productDataSafe) {
    const currentStock = parseInt(product.stock_quantity) || 0;
    const reorderPoint = parseInt(product.reorder_point) || 10;
    const dailySalesAvg = parseFloat(product.daily_sales_avg) || 0;
    const salesVolatility = parseFloat(product.sales_volatility) || 0;

    // Calculate recommended stock level (service level optimization)
    const leadTimeDays = 7; // Assume 7-day lead time
    const serviceLevel = 0.95; // 95% service level
    const safetyStock = salesVolatility * Math.sqrt(leadTimeDays) * 1.645; // Z-score for 95%
    const recommendedStock = (dailySalesAvg * leadTimeDays) + safetyStock + reorderPoint;

    const confidence = Math.min(0.9, Math.max(0.5, 1 - (salesVolatility / dailySalesAvg)));

    recommendations.push({
      productId: product.product_id,
      currentStock,
      recommendedStock: Math.ceil(recommendedStock),
      reorderPoint,
      confidence,
      reason: `Based on ${dailySalesAvg.toFixed(1)} daily sales with ${leadTimeDays}-day lead time`
    });

    // Generate alerts
    if (currentStock <= reorderPoint) {
      alerts.push({
        productId: product.product_id,
        alertType: 'reorder' as const,
        severity: 'high' as const,
        message: `Stock below reorder point (${currentStock} <= ${reorderPoint})`
      });
    } else if (currentStock > recommendedStock * 1.5) {
      alerts.push({
        productId: product.product_id,
        alertType: 'overstock' as const,
        severity: 'medium' as const,
        message: `Potential overstock (${currentStock} vs recommended ${Math.ceil(recommendedStock)})`
      });
    }
  }

  return { recommendations, alerts };
}

// ============================================================================
// Product Recommendations
// ============================================================================

export async function generateProductRecommendations(customerId: string): Promise<{
  personalized: Array<{ productId: string; score: number; reason: string }>;
  trending: Array<{ productId: string; trend: number; category: string }>;
  complementary: Array<{ productId: string; baseProductId: string; lift: number }>;
}> {
  // Get customer's purchase history
  const customerPurchases = await query<Array<{ product_id: string; category: string; purchased_at: string }>>(
    `SELECT DISTINCT
      oi.product_id,
      p.category,
      o.created_at as purchased_at
    FROM order_item oi
    JOIN "order" o ON oi.order_id = o.order_id
    JOIN product p ON oi.product_id = p.product_id
    WHERE o.customer_id = $1 AND o.status = 'completed'
    ORDER BY o.created_at DESC
    LIMIT 50`,
    [customerId]
  );

  // Simple collaborative filtering simulation
  const personalized: Array<{ productId: string; score: number; reason: string }> = [];
  const categoryCounts = new Map<string, number>();

  // Count categories purchased
  if (customerPurchases) {
    customerPurchases.forEach(purchase => {
      const count = categoryCounts.get(purchase.category) || 0;
      categoryCounts.set(purchase.category, count + 1);
    });
  }

  // Get products from most purchased categories
  for (const [category, count] of categoryCounts) {
    const categoryProducts = await query<Array<{ product_id: string }>>(
      `SELECT product_id FROM product
       WHERE category = $1 AND is_active = true
       ORDER BY RANDOM() LIMIT 5`,
      [category]
    );

    if (categoryProducts) {
      categoryProducts.forEach(product => {
        personalized.push({
          productId: product.product_id,
          score: count / (customerPurchases?.length || 1),
          reason: `Based on ${count} purchases in ${category}`
        });
      });
    }
  }

  // Get trending products
  const trending = await query<Array<{ product_id: string; sales_count: string; category: string }>>(
    `SELECT
      oi.product_id,
      COUNT(*) as sales_count,
      p.category
    FROM order_item oi
    JOIN "order" o ON oi.order_id = o.order_id
    JOIN product p ON oi.product_id = p.product_id
    WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND o.status = 'completed'
    GROUP BY oi.product_id, p.category
    ORDER BY sales_count DESC
    LIMIT 10`
  ).then(rows => rows ? rows.map(row => ({
    productId: row.product_id,
    trend: parseInt(row.sales_count),
    category: row.category
  })) : []);

  // Simple complementary products (products bought together)
  const complementary = await query<Array<{ product_a: string; product_b: string; frequency: string }>>(
    `SELECT
      o1.product_id as product_a,
      o2.product_id as product_b,
      COUNT(*) as frequency
    FROM order_item o1
    JOIN order_item o2 ON o1.order_id = o2.order_id AND o1.product_id != o2.product_id
    JOIN "order" ord ON o1.order_id = ord.order_id
    WHERE ord.created_at >= CURRENT_DATE - INTERVAL '90 days'
      AND ord.status = 'completed'
    GROUP BY o1.product_id, o2.product_id
    ORDER BY frequency DESC
    LIMIT 10`
  ).then(rows => rows ? rows.map(row => ({
    productId: row.product_b,
    baseProductId: row.product_a,
    lift: parseInt(row.frequency)
  })) : []);

  return {
    personalized: personalized.slice(0, 10),
    trending,
    complementary
  };
}

// ============================================================================
// Customer Segmentation
// ============================================================================

export async function performCustomerSegmentation(): Promise<{
  segments: Array<{
    id: string;
    name: string;
    size: number;
    characteristics: Record<string, any>;
    avgLifetimeValue: number;
    churnRate: number;
  }>;
  segmentMigration: Array<{
    fromSegment: string;
    toSegment: string;
    count: number;
    percentage: number;
  }>;
}> {
  // RFM (Recency, Frequency, Monetary) segmentation
  const customerRFM = await query<Array<{
    customer_id: string;
    recency: string;
    frequency: string;
    monetary: string;
  }>>(
    `WITH customer_rfm AS (
      SELECT
        customer_id,
        EXTRACT(EPOCH FROM (CURRENT_DATE - MAX(created_at))) / 86400 as recency,
        COUNT(*) as frequency,
        SUM(total_amount) as monetary
      FROM "order"
      WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '1 year'
      GROUP BY customer_id
    )
    SELECT
      customer_id,
      recency::text,
      frequency::text,
      monetary::text
    FROM customer_rfm`
  );

  // Simple segmentation logic
  const segments = [
    {
      id: 'champions',
      name: 'Champions',
      size: 0,
      characteristics: { recency: '< 30 days', frequency: 'high', monetary: 'high' },
      avgLifetimeValue: 0,
      churnRate: 0.05
    },
    {
      id: 'loyal',
      name: 'Loyal Customers',
      size: 0,
      characteristics: { recency: '< 90 days', frequency: 'medium', monetary: 'medium' },
      avgLifetimeValue: 0,
      churnRate: 0.15
    },
    {
      id: 'at_risk',
      name: 'At Risk',
      size: 0,
      characteristics: { recency: '90-180 days', frequency: 'low', monetary: 'medium' },
      avgLifetimeValue: 0,
      churnRate: 0.35
    },
    {
      id: 'lost',
      name: 'Lost',
      size: 0,
      characteristics: { recency: '> 180 days', frequency: 'low', monetary: 'low' },
      avgLifetimeValue: 0,
      churnRate: 0.75
    }
  ];

  // Assign customers to segments (simplified)
  if (customerRFM) {
    customerRFM.forEach(customer => {
      const recency = parseFloat(customer.recency);
      const frequency = parseInt(customer.frequency);
      const monetary = parseFloat(customer.monetary);

      let segmentId = 'lost';

      if (recency < 30 && frequency > 10 && monetary > 500) {
        segmentId = 'champions';
      } else if (recency < 90 && frequency > 5 && monetary > 200) {
        segmentId = 'loyal';
      } else if (recency < 180 && frequency > 2) {
        segmentId = 'at_risk';
      }

      const segment = segments.find(s => s.id === segmentId);
      if (segment) {
        segment.size++;
      }
    });
  }

  return {
    segments,
    segmentMigration: [] // Would implement segment migration tracking
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function calculateTrendSlope(data: Array<{ date: Date; revenue: number }>): number {
  if (data.length < 2) return 0;

  // Simple linear regression slope
  const n = data.length;
  const sumX = data.reduce((sum, d, i) => sum + i, 0);
  const sumY = data.reduce((sum, d) => sum + d.revenue, 0);
  const sumXY = data.reduce((sum, d, i) => sum + i * d.revenue, 0);
  const sumXX = data.reduce((sum, d, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Return as percentage change per day
  const avgRevenue = sumY / n;
  return slope / avgRevenue;
}

function getSeasonalFactor(date: Date): number {
  // Simple seasonal adjustment (higher sales on weekends, lower mid-week)
  const dayOfWeek = date.getDay();
  const seasonalFactors = {
    0: 1.1, // Sunday
    1: 0.9, // Monday
    2: 0.8, // Tuesday
    3: 0.8, // Wednesday
    4: 0.9, // Thursday
    5: 1.2, // Friday
    6: 1.3  // Saturday
  };

  return seasonalFactors[dayOfWeek as keyof typeof seasonalFactors] || 1.0;
}
