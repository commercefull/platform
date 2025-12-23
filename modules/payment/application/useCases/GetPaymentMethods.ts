/**
 * GetPaymentMethods Use Case
 *
 * Retrieves available payment methods for a customer or checkout.
 */

export interface GetPaymentMethodsInput {
  customerId?: string;
  storeId?: string;
  channelId?: string;
  currency?: string;
  amount?: number;
  country?: string;
}

export interface PaymentMethodInfo {
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
  minAmount?: number;
  maxAmount?: number;
  supportedCurrencies?: string[];
}

export interface GetPaymentMethodsOutput {
  savedMethods: PaymentMethodInfo[];
  availableMethods: PaymentMethodInfo[];
}

export class GetPaymentMethodsUseCase {
  constructor(
    private readonly paymentRepository: any, // PaymentRepository
    private readonly paymentConfigRepository: any, // PaymentConfigRepository
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
          minAmount: config.minAmount,
          maxAmount: config.maxAmount,
          supportedCurrencies: config.supportedCurrencies,
        });
      }
    }

    return {
      savedMethods,
      availableMethods,
    };
  }

  private formatMethodName(method: any): string {
    if (method.type === 'card') {
      return `${method.brand || 'Card'} •••• ${method.last4}`;
    }
    return method.type;
  }

  private isMethodValid(method: any): boolean {
    if (method.type === 'card') {
      const now = new Date();
      const expiryDate = new Date(method.expiryYear, method.expiryMonth - 1);
      return expiryDate > now;
    }
    return true;
  }

  private checkMethodAvailability(config: any, input: GetPaymentMethodsInput): boolean {
    // Check currency support
    if (input.currency && config.supportedCurrencies?.length > 0) {
      if (!config.supportedCurrencies.includes(input.currency)) {
        return false;
      }
    }

    // Check amount limits
    if (input.amount) {
      if (config.minAmount && input.amount < config.minAmount) {
        return false;
      }
      if (config.maxAmount && input.amount > config.maxAmount) {
        return false;
      }
    }

    // Check country support
    if (input.country && config.supportedCountries?.length > 0) {
      if (!config.supportedCountries.includes(input.country)) {
        return false;
      }
    }

    return config.isActive;
  }
}
