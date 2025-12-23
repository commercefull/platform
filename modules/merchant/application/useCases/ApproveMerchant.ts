/**
 * ApproveMerchant Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ApproveMerchantInput {
  merchantId: string;
  approvedBy: string;
  notes?: string;
}

export interface ApproveMerchantOutput {
  merchantId: string;
  status: string;
  approvedAt: string;
}

export class ApproveMerchantUseCase {
  constructor(private readonly merchantRepository: any) {}

  async execute(input: ApproveMerchantInput): Promise<ApproveMerchantOutput> {
    const merchant = await this.merchantRepository.findById(input.merchantId);
    if (!merchant) {
      throw new Error(`Merchant not found: ${input.merchantId}`);
    }

    if (merchant.status === 'approved') {
      throw new Error('Merchant is already approved');
    }

    const now = new Date();
    await this.merchantRepository.update(input.merchantId, {
      status: 'approved',
      isActive: true,
      isVerified: true,
      approvedAt: now,
      approvedBy: input.approvedBy,
      approvalNotes: input.notes,
    });

    eventBus.emit('merchant.approved', {
      merchantId: input.merchantId,
      approvedBy: input.approvedBy,
    });

    return {
      merchantId: input.merchantId,
      status: 'approved',
      approvedAt: now.toISOString(),
    };
  }
}
