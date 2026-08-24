import type { AnalyticsDataPort } from '../../domain/repositories/AnalyticsDataPort';

export class GetAnalyticsDataUseCase {
  constructor(private readonly port: AnalyticsDataPort) {}

  async getSalesSummary(startDate: Date, endDate: Date) {
    return this.port.getSalesSummary(startDate, endDate);
  }
  async getTopProducts(startDate: Date, endDate: Date, sortBy?: 'revenue' | 'purchases' | 'views', limit?: number) {
    return this.port.getTopProducts(startDate, endDate, sortBy, limit);
  }
  async getCustomerCohorts() {
    return this.port.getCustomerCohorts();
  }
  async findRecentCustomerIds(limit: number) {
    return this.port.findRecentCustomerIds(limit);
  }
  async findCustomerPurchaseHistory(customerId: string, days: number) {
    return this.port.findCustomerPurchaseHistory(customerId, days);
  }
  async findRecentCustomerId() {
    return this.port.findRecentCustomerId();
  }
  async getRevenueData(startDate: Date, endDate: Date) {
    return this.port.getRevenueData(startDate, endDate);
  }
  async getCustomerData(startDate: Date, endDate: Date) {
    return this.port.getCustomerData(startDate, endDate);
  }
  async getInventoryData(startDate: Date, endDate: Date) {
    return this.port.getInventoryData(startDate, endDate);
  }
  async getRealTimeMetrics() {
    return this.port.getRealTimeMetrics();
  }
}
