/**
 * CreateMerchant Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface CreateMerchantInput {
  name: string;
  email: string;
  phone?: string;
  businessType: string;
  taxId?: string;
  website?: string;
  description?: string;
  logo?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
  };
  commissionRate?: number;
}

export interface CreateMerchantOutput {
  merchantId: string;
  name: string;
  status: string;
  createdAt: string;
}

export class CreateMerchantUseCase {
  constructor(private readonly merchantRepository: any) {}

  async execute(input: CreateMerchantInput): Promise<CreateMerchantOutput> {
    // Check email uniqueness
    const existing = await this.merchantRepository.findByEmail(input.email);
    if (existing) {
      throw new Error(`Merchant with email '${input.email}' already exists`);
    }

    const merchantId = `mch_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const merchant = await this.merchantRepository.create({
      merchantId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      businessType: input.businessType,
      taxId: input.taxId,
      website: input.website,
      description: input.description,
      logo: input.logo,
      address: input.address,
      bankDetails: input.bankDetails,
      commissionRate: input.commissionRate || 0.10, // 10% default
      status: 'pending',
      isActive: false,
      isVerified: false,
    });

    eventBus.emit('merchant.created', {
      merchantId: merchant.merchantId,
      name: merchant.name,
      email: merchant.email,
    });

    return {
      merchantId: merchant.merchantId,
      name: merchant.name,
      status: merchant.status,
      createdAt: merchant.createdAt.toISOString(),
    };
  }
}
