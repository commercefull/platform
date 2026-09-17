export interface PaymentSettings {
  paymentSettingsId: string;
  organizationId: string;
  capturePaymentsAutomatically: boolean;
  authorizationValidityPeriod: number;
  cardVaultingEnabled: boolean;
  allowGuestCheckout: boolean;
  requireBillingAddress: boolean;
  requireCvv: boolean;
  requirePostalCodeVerification: boolean;
  threeDSecureSettings?: Record<string, unknown>;
  fraudDetectionSettings?: Record<string, unknown>;
  receiptSettings?: Record<string, unknown>;
  paymentFormCustomization?: Record<string, unknown>;
  autoRefundOnCancel: boolean;
  paymentAttemptLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentSettingsUpsertParams = { organizationId: string } & Partial<
  Omit<PaymentSettings, 'paymentSettingsId' | 'organizationId' | 'createdAt' | 'updatedAt'>
>;

export interface PaymentSettingsRepository {
  findByMerchant(organizationId: string): Promise<PaymentSettings | null>;
  upsert(params: PaymentSettingsUpsertParams): Promise<PaymentSettings | null>;
  findAll(): Promise<PaymentSettings[]>;
}
