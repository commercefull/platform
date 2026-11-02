export interface StoredPaymentMethod {
  storedPaymentMethodId: string;
  customerId: string;
  organizationId?: string;
  type: string;
  provider: string;
  providerToken: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type StoredPaymentMethodCreateParams = Omit<StoredPaymentMethod, 'storedPaymentMethodId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;


