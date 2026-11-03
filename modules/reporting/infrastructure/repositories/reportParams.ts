/**
 * Report query parameters — shared between reportDataProvider and secondary reports.
 */

export interface ReportParameters {
  dateFrom?: string;
  dateTo?: string;
  storeId?: string;
  organizationId?: string;
  categoryId?: string;
  customerGroupId?: string;
  warehouseId?: string;
  lowStockOnly?: boolean;
  region?: string;
  taxClassId?: string;
  status?: string;
  paymentMethod?: string;
  gateway?: string;
  carrierId?: string;
  limit?: number;
}
