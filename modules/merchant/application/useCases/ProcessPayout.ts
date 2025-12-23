/**
 * ProcessPayout Use Case
 * 
 * Processes payout to merchant for approved settlements.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ProcessPayoutInput {
  settlementId: string;
  payoutMethod?: string;
  notes?: string;
}

export interface ProcessPayoutOutput {
  payoutId: string;
  settlementId: string;
  merchantId: string;
  amount: number;
  status: string;
  processedAt: string;
}

export class ProcessPayoutUseCase {
  constructor(
    private readonly settlementRepository: any,
    private readonly payoutRepository: any,
    private readonly paymentService: any
  ) {}

  async execute(input: ProcessPayoutInput): Promise<ProcessPayoutOutput> {
    const settlement = await this.settlementRepository.findById(input.settlementId);
    if (!settlement) {
      throw new Error(`Settlement not found: ${input.settlementId}`);
    }

    if (settlement.status !== 'approved') {
      throw new Error('Settlement must be approved before payout');
    }

    const payoutId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    // Process payment to merchant
    let paymentResult;
    try {
      paymentResult = await this.paymentService.sendPayout({
        merchantId: settlement.merchantId,
        amount: settlement.netPayout,
        currency: 'USD',
        reference: payoutId,
      });
    } catch (error) {
      // Mark as failed
      await this.payoutRepository.create({
        payoutId,
        settlementId: input.settlementId,
        merchantId: settlement.merchantId,
        amount: settlement.netPayout,
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }

    // Create payout record
    const now = new Date();
    await this.payoutRepository.create({
      payoutId,
      settlementId: input.settlementId,
      merchantId: settlement.merchantId,
      amount: settlement.netPayout,
      status: 'completed',
      payoutMethod: input.payoutMethod,
      externalReference: paymentResult?.transactionId,
      processedAt: now,
      notes: input.notes,
    });

    // Update settlement status
    await this.settlementRepository.update(input.settlementId, {
      status: 'paid',
      paidAt: now,
    });

    eventBus.emit('merchant.payout_processed', {
      payoutId,
      merchantId: settlement.merchantId,
      amount: settlement.netPayout,
    });

    return {
      payoutId,
      settlementId: input.settlementId,
      merchantId: settlement.merchantId,
      amount: settlement.netPayout,
      status: 'completed',
      processedAt: now.toISOString(),
    };
  }
}
