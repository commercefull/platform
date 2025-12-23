/**
 * SavePaymentMethod Use Case
 *
 * Saves a customer's payment method for future use.
 */

export interface SavePaymentMethodInput {
  customerId: string;
  type: 'card' | 'bank_account' | 'wallet' | 'buy_now_pay_later';
  provider: 'stripe' | 'paypal' | 'adyen' | 'braintree';
  providerPaymentMethodId: string;
  isDefault?: boolean;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  metadata?: Record<string, unknown>;
}

export interface SavePaymentMethodOutput {
  paymentMethodId: string;
  type: string;
  provider: string;
  last4?: string;
  brand?: string;
  expiresAt?: string;
  isDefault: boolean;
  createdAt: string;
}

export class SavePaymentMethodUseCase {
  constructor(private readonly paymentRepository: any) {}

  async execute(input: SavePaymentMethodInput): Promise<SavePaymentMethodOutput> {
    if (!input.customerId || !input.providerPaymentMethodId) {
      throw new Error('Customer ID and provider payment method ID are required');
    }

    // Check if payment method already exists
    const existing = await this.paymentRepository.findPaymentMethodByProviderId(input.customerId, input.providerPaymentMethodId);
    if (existing) {
      throw new Error('Payment method already saved');
    }

    const paymentMethodId = `pm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    // Fetch payment method details from provider
    const providerDetails = await this.fetchProviderDetails(input);

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await this.paymentRepository.unsetDefaultPaymentMethods(input.customerId);
    }

    const paymentMethod = await this.paymentRepository.createPaymentMethod({
      paymentMethodId,
      customerId: input.customerId,
      type: input.type,
      provider: input.provider,
      providerPaymentMethodId: input.providerPaymentMethodId,
      isDefault: input.isDefault ?? false,
      last4: providerDetails.last4,
      brand: providerDetails.brand,
      expiresAt: providerDetails.expiresAt,
      billingAddress: input.billingAddress,
      metadata: input.metadata,
    });

    return {
      paymentMethodId: paymentMethod.paymentMethodId,
      type: paymentMethod.type,
      provider: paymentMethod.provider,
      last4: paymentMethod.last4,
      brand: paymentMethod.brand,
      expiresAt: paymentMethod.expiresAt?.toISOString(),
      isDefault: paymentMethod.isDefault,
      createdAt: paymentMethod.createdAt.toISOString(),
    };
  }

  private async fetchProviderDetails(input: SavePaymentMethodInput): Promise<{
    last4?: string;
    brand?: string;
    expiresAt?: Date;
  }> {
    // This would fetch actual details from the payment provider
    // For now, return placeholder data
    if (input.type === 'card') {
      return {
        last4: '4242',
        brand: 'visa',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };
    }
    return {};
  }
}
