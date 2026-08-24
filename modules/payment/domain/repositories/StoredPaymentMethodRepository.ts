export interface StoredPaymentMethod {
  storedPaymentMethodId: string;
  customerId: string;
  organizationId: string;
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
  findByCustomer(customerId: string): Promise<StoredPaymentMethod[]>;
  findById(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null>;
  create(params: StoredPaymentMethodCreateParams): Promise<StoredPaymentMethod | null>;
  setDefault(storedPaymentMethodId: string, customerId: string): Promise<StoredPaymentMethod | null>;
  softDelete(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null>;
}
