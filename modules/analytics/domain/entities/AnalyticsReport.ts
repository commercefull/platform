/**
 * Analytics Report Entities
 *
 * Domain entities for automated reporting and analytics predictions.
 */

export type ReportType = 'sales' | 'customers' | 'products' | 'inventory' | 'executive';
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'html';
export type ReportScheduleType = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface ReportSchedule {
  reportScheduleId: string;
  name: string;
  type: ReportScheduleType;
  reportType: ReportType;
  recipients: string[];
  format: ReportFormat;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt: Date;
  parameters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportExecution {
  reportExecutionId: string;
  reportScheduleId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  fileUrl?: string;
  errorMessage?: string;
  recipientCount: number;
  deliveryStatus: Record<string, 'sent' | 'failed' | 'pending'>;
  createdAt: Date;
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  period: string;
  summary: Record<string, unknown>;
  data: unknown[];
  charts?: Array<{
    title: string;
    type: 'line' | 'bar' | 'pie' | 'area';
    data: unknown;
  }>;
}

export interface SalesForecast {
  predictions: Array<{ date: Date; predicted: number; confidence: number }>;
  trends: { slope: number; seasonality: number; accuracy: number };
}

export interface ChurnPrediction {
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: Array<{ factor: string; impact: number; weight: number }>;
  recommendations: string[];
}

export interface InventoryOptimization {
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
}

export interface ProductRecommendations {
  personalized: Array<{ productId: string; score: number; reason: string }>;
  trending: Array<{ productId: string; trend: number; category: string }>;
  complementary: Array<{ productId: string; baseProductId: string; lift: number }>;
}

export interface CustomerSegmentation {
  segments: Array<{
    id: string;
    name: string;
    size: number;
    characteristics: Record<string, unknown>;
    avgLifetimeValue: number;
    churnRate: number;
  }>;
  segmentMigration: Array<{
    fromSegment: string;
    toSegment: string;
    count: number;
    percentage: number;
  }>;
}
