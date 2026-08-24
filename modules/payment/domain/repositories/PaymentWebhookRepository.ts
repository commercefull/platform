export interface PaymentWebhook {
  paymentWebhookId: string;
  externalId: string;
  provider: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentWebhookCreateParams = Omit<PaymentWebhook, 'paymentWebhookId' | 'createdAt' | 'updatedAt'>;

export interface PaymentWebhookRepository {
  findByExternalId(externalId: string): Promise<PaymentWebhook | null>;
  create(params: PaymentWebhookCreateParams): Promise<PaymentWebhook | null>;
  markProcessed(paymentWebhookId: string): Promise<PaymentWebhook | null>;
}
