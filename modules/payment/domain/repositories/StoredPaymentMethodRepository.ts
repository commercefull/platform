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

export interface StoredPaymentMethodRepository {
  findStoredMethodsByCustomer(customerId: string): Promise<StoredPaymentMethod[]>;
  findStoredMethodById(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null>;
  createStoredMethod(params: StoredPaymentMethodCreateParams): Promise<StoredPaymentMethod | null>;
  setDefaultStoredMethod(storedPaymentMethodId: string, customerId: string): Promise<StoredPaymentMethod | null>;
  softDeleteStoredMethod(storedPaymentMethodId: string, customerId?: string): Promise<StoredPaymentMethod | null>;
}
