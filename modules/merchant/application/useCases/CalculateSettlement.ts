/**
 * CalculateSettlement Use Case
 *
 * Calculates merchant settlement for a period.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface CalculateSettlementInput {
  merchantId: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface SettlementLineItem {
  orderId: string;
  orderDate: Date;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  fees: number;
  netAmount: number;
}

export interface CalculateSettlementOutput {
  settlementId: string;
  merchantId: string;
  periodStart: string;
  periodEnd: string;
  grossSales: number;
  totalCommission: number;
  totalFees: number;
  refunds: number;
  netPayout: number;
  lineItems: SettlementLineItem[];
  status: string;
}

export class CalculateSettlementUseCase {
  constructor(
    private readonly merchantRepository: any,
    private readonly orderRepository: any,
    private readonly settlementRepository: any,
  ) {}

  async execute(input: CalculateSettlementInput): Promise<CalculateSettlementOutput> {
    const merchant = await this.merchantRepository.findById(input.merchantId);
    if (!merchant) {
      throw new Error(`Merchant not found: ${input.merchantId}`);
    }

    // Get completed orders for the period
    const orders = await this.orderRepository.findByMerchantAndPeriod(input.merchantId, input.periodStart, input.periodEnd);

    const lineItems: SettlementLineItem[] = [];
    let grossSales = 0;
    let totalCommission = 0;
    let totalFees = 0;
    let refunds = 0;

    for (const order of orders) {
      const commissionRate = merchant.commissionRate || 0.1;
      const commissionAmount = order.total * commissionRate;
      const fees = order.paymentFee || 0;
      const netAmount = order.total - commissionAmount - fees;

      if (order.status === 'refunded') {
        refunds += order.total;
      } else {
        grossSales += order.total;
        totalCommission += commissionAmount;
        totalFees += fees;
      }

      lineItems.push({
        orderId: order.orderId,
        orderDate: order.createdAt,
        grossAmount: order.total,
        commissionRate,
        commissionAmount,
        fees,
        netAmount,
      });
    }

    const netPayout = grossSales - totalCommission - totalFees - refunds;
    const settlementId = `stl_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    // Save settlement
    await this.settlementRepository.create({
      settlementId,
      merchantId: input.merchantId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      grossSales,
      totalCommission,
      totalFees,
      refunds,
      netPayout,
      status: 'pending',
      lineItems,
    });

    eventBus.emit('merchant.settlement_created', {
      settlementId,
      merchantId: input.merchantId,
      netPayout,
    });

    return {
      settlementId,
      merchantId: input.merchantId,
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      grossSales,
      totalCommission,
      totalFees,
      refunds,
      netPayout,
      lineItems,
      status: 'pending',
    };
  }
}
