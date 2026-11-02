/**
 * GetPaymentMethods Use Case
 *
 * Retrieves available payment methods for a customer or checkout.
 * Method availability is resolved by `PaymentCapabilityService` — currency,
 * amount, and country eligibility from config capability rows.
 */

import { PaymentCapabilityService } from '../../domain/services/PaymentCapabilityService';

export interface GetPaymentMethodsInput {
  customerId?: string;
  storeId?: string;
  channelId?: string;
  currency?: string;
  amountCents?: number;
  country?: string;
  marketId?: string;
}

interface PaymentMethodInfo {
  paymentMethodId: string;
  type: 'card' | 'bank_account' | 'wallet' | 'buy_now_pay_later' | 'crypto';
  provider: string;
  name: string;
  isDefault: boolean;

  // For saved methods
  isSaved?: boolean;
  last4?: string;
  brand?: string; // visa, mastercard, etc.
  expiryMonth?: number;
  expiryYear?: number;

  // For new methods
  isAvailable: boolean;
  minAmountCents?: number;
  maxAmountCents?: number;
  supportedCurrencies?: string[];
}

export interface GetPaymentMethodsOutput {
  savedMethods: PaymentMethodInfo[];
  availableMethods: PaymentMethodInfo[];
}

interface SavedMethod {
  paymentMethodId: string;
  type: 'card' | 'bank_account' | 'wallet' | 'buy_now_pay_later' | 'crypto';
  provider: string;
  name?: string;
  isDefault: boolean;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

interface PaymentConfig {
  paymentMethodConfigId: string;
  type: 'card' | 'bank_account' | 'wallet' | 'buy_now_pay_later' | 'crypto';
  provider: string;
  displayName: string;
  isActive: boolean;
  minAmountCents?: number;
  maxAmountCents?: number;
  supportedCurrencies?: string[];
  supportedCountries?: string[];
}

interface PaymentRepositoryPort {
  findSavedPaymentMethods(customerId: string): Promise<SavedMethod[]>;
}

interface PaymentConfigRepositoryPort {
  findActiveConfigs(params: { storeId?: string; channelId?: string }): Promise<PaymentConfig[]>;
}

export class GetPaymentMethodsUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly paymentConfigRepository: PaymentConfigRepositoryPort,
    private readonly paymentCapabilityService: PaymentCapabilityService = new PaymentCapabilityService(),
  ) {}

  async execute(input: GetPaymentMethodsInput): Promise<GetPaymentMethodsOutput> {
    const savedMethods: PaymentMethodInfo[] = [];
    const availableMethods: PaymentMethodInfo[] = [];

    // Get saved payment methods for customer
    if (input.customerId) {
      const customerMethods = await this.paymentRepository.findSavedPaymentMethods(input.customerId);

      for (const method of customerMethods) {
        savedMethods.push({
          paymentMethodId: method.paymentMethodId,
          type: method.type,
          provider: method.provider,
          name: method.name || this.formatMethodName(method),
          isDefault: method.isDefault,
          isSaved: true,
          last4: method.last4,
          brand: method.brand,
          expiryMonth: method.expiryMonth,
          expiryYear: method.expiryYear,
          isAvailable: this.isMethodValid(method),
        });
      }
    }

    // Get available payment methods based on configuration
    const paymentConfigs = await this.paymentConfigRepository.findActiveConfigs({
      storeId: input.storeId,
      channelId: input.channelId,
    });

    for (const config of paymentConfigs) {
      // Check if method is available for this request
      const isAvailable = this.checkMethodAvailability(config, input);

      if (isAvailable) {
        availableMethods.push({
          paymentMethodId: config.paymentMethodConfigId,
          type: config.type,
          provider: config.provider,
          name: config.displayName,
          isDefault: false,
          isAvailable: true,
          minAmountCents: config.minAmountCents,
          maxAmountCents: config.maxAmountCents,
          supportedCurrencies: config.supportedCurrencies,
        });
      }
    }

    return {
      savedMethods,
      availableMethods,
    };
  }

  private formatMethodName(method: SavedMethod): string {
    if (method.type === 'card') {
      return `${method.brand || 'Card'} •••• ${method.last4}`;
    }
    return method.type;
  }

  private isMethodValid(method: SavedMethod): boolean {
    if (method.type === 'card') {
      const now = new Date();
      if (method.expiryYear && method.expiryMonth) {
        const expiryDate = new Date(method.expiryYear, method.expiryMonth - 1);
        return expiryDate > now;
      }
    }
    return true;
  }

  private checkMethodAvailability(config: PaymentConfig, input: GetPaymentMethodsInput): boolean {
    return this.paymentCapabilityService.checkEligibility(config, {
      currency: input.currency,
      amountCents: input.amountCents,
      country: input.country,
      marketId: input.marketId,
      channelId: input.channelId,
    }).eligible;
  }
}
