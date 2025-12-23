/**
 * Generate Sales Report Use Case
 * Generates a sales report for a given date range
 */

import * as analyticsRepo from '../../repos/analyticsRepo';
import { eventBus } from '../../../../libs/events/eventBus';

export interface GenerateSalesReportCommand {
  startDate: Date;
  endDate: Date;
  merchantId?: string;
  generatedBy?: string;
}

export interface GenerateSalesReportResponse {
  success: boolean;
  report?: {
    id: string;
    dateRange: { start: string; end: string };
    summary: {
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
      totalItemsSold: number;
    };
    generatedAt: Date;
  };
  error?: string;
}

export class GenerateSalesReportUseCase {
  async execute(command: GenerateSalesReportCommand): Promise<GenerateSalesReportResponse> {
    try {
      // Validate date range
      if (command.startDate >= command.endDate) {
        return { success: false, error: 'Start date must be before end date' };
      }

      // Get sales summary from analytics repo
      const summary = await analyticsRepo.getSalesSummary(command.startDate, command.endDate, command.merchantId);

      const reportId = `report_${Date.now()}`;

      // Emit event
      (eventBus as any).emit('analytics.report.generated', {
        reportId,
        reportType: 'sales',
        dateRange: {
          start: command.startDate.toISOString(),
          end: command.endDate.toISOString(),
        },
        generatedBy: command.generatedBy,
        format: 'json',
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        report: {
          id: reportId,
          dateRange: {
            start: command.startDate.toISOString(),
            end: command.endDate.toISOString(),
          },
          summary: {
            totalOrders: summary.totalOrders,
            totalRevenue: summary.totalRevenue,
            averageOrderValue: summary.averageOrderValue,
            totalItemsSold: 0, // Not available in current summary, would need daily data
          },
          generatedAt: new Date(),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
