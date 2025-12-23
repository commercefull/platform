/**
 * SuspendMerchant Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface SuspendMerchantInput {
  merchantId: string;
  reason: string;
  suspendedBy: string;
}

export interface SuspendMerchantOutput {
  merchantId: string;
  status: string;
  suspendedAt: string;
}

export class SuspendMerchantUseCase {
  constructor(private readonly merchantRepository: any) {}

  async execute(input: SuspendMerchantInput): Promise<SuspendMerchantOutput> {
    const merchant = await this.merchantRepository.findById(input.merchantId);
    if (!merchant) {
      throw new Error(`Merchant not found: ${input.merchantId}`);
    }

    if (merchant.status === 'suspended') {
      throw new Error('Merchant is already suspended');
    }

    const now = new Date();
    await this.merchantRepository.update(input.merchantId, {
      status: 'suspended',
      isActive: false,
      suspendedAt: now,
      suspendedBy: input.suspendedBy,
      suspensionReason: input.reason,
    });

    eventBus.emit('merchant.suspended', {
      merchantId: input.merchantId,
      reason: input.reason,
      suspendedBy: input.suspendedBy,
    });

    return {
      merchantId: input.merchantId,
      status: 'suspended',
      suspendedAt: now.toISOString(),
    };
  }
}
