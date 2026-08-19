/**
 * Reporting Module - Domain Entities
 *
 * Collaborates with the analytics module to provide scheduled report generation,
 * standard report templates, and export capabilities.
 */

export type ReportType =
  | 'sales_summary'
  | 'product_performance'
  | 'customer_summary'
  | 'inventory_report'
  | 'tax_report'
  | 'order_detail'
  | 'payment_report'
  | 'fulfillment_report';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'html';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type ReportExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ReportScheduleProps {
  reportScheduleId: string;
  organizationId?: string;
  name: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  parameters: Record<string, unknown>;
  recipients: string[];
  format: ReportFormat;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportExecutionProps {
  reportExecutionId: string;
  reportScheduleId: string;
  status: ReportExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface ReportData {
  reportType: ReportType;
  generatedAt: Date;
  dateRange: { from: Date; to: Date };
  summary: Record<string, unknown>;
  rows: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
}

export interface ReportTemplate {
  reportType: ReportType;
  name: string;
  description: string;
  defaultFormat: ReportFormat;
  requiredParameters: string[];
  optionalParameters: string[];
}

export const REPORT_TEMPLATES: Record<ReportType, ReportTemplate> = {
  sales_summary: {
    reportType: 'sales_summary',
    name: 'Sales Summary Report',
    description: 'Overview of sales performance including revenue, orders, and averages',
    defaultFormat: 'pdf',
    requiredParameters: ['dateFrom', 'dateTo'],
    optionalParameters: ['storeId', 'organizationId'],
  },
  product_performance: {
    reportType: 'product_performance',
    name: 'Product Performance Report',
    description: 'Top and bottom performing products by revenue and units sold',
    defaultFormat: 'excel',
    requiredParameters: ['dateFrom', 'dateTo'],
    optionalParameters: ['categoryId', 'limit'],
  },
  customer_summary: {
    reportType: 'customer_summary',
    name: 'Customer Summary Report',
    description: 'Customer acquisition, retention, and lifetime value metrics',
    defaultFormat: 'pdf',
    requiredParameters: ['dateFrom', 'dateTo'],
    optionalParameters: ['customerGroupId'],
  },
  inventory_report: {
    reportType: 'inventory_report',
    name: 'Inventory Report',
    description: 'Current stock levels, low stock alerts, and inventory valuation',
    defaultFormat: 'excel',
    requiredParameters: [],
    optionalParameters: ['storeId', 'warehouseId', 'lowStockOnly'],
  },
  tax_report: {
    reportType: 'tax_report',
    name: 'Tax Report',
    description: 'Tax collected by jurisdiction and tax class',
    defaultFormat: 'pdf',
    requiredParameters: ['dateFrom', 'dateTo'],
    optionalParameters: ['region', 'taxClassId'],
  },
  order_detail: {
    reportType: 'order_detail',
    name: 'Order Detail Report',
    description: 'Detailed list of orders with line items and statuses',
    defaultFormat: 'excel',
    requiredParameters: ['dateFrom', 'dateTo'],
    optionalParameters: ['status', 'storeId'],
  },
  payment_report: {
    reportType: 'payment_report',
    name: 'Payment Report',
    description: 'Payment transactions, refunds, and gateway balances',
    defaultFormat: 'pdf',
    requiredParameters: ['dateFrom', 'dateTo'],
    optionalParameters: ['paymentMethod', 'gateway'],
  },
  fulfillment_report: {
    reportType: 'fulfillment_report',
    name: 'Fulfillment Report',
    description: 'Fulfillment performance, shipping times, and carrier breakdown',
    defaultFormat: 'pdf',
    requiredParameters: ['dateFrom', 'dateTo'],
    optionalParameters: ['carrierId', 'status'],
  },
};
