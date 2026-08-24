export interface PaymentSettings {
  paymentSettingsId: string;
  organizationId: string;
  provider: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentSettingsUpsertParams = Omit<PaymentSettings, 'paymentSettingsId' | 'createdAt' | 'updatedAt'>;

export interface PaymentSettingsRepository {
  findByMerchant(organizationId: string): Promise<PaymentSettings | null>;
  upsert(params: PaymentSettingsUpsertParams): Promise<PaymentSettings | null>;
  findAll(): Promise<PaymentSettings[]>;
}
