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
  findWebhookByExternalId(externalId: string): Promise<PaymentWebhook | null>;
  createWebhook(params: PaymentWebhookCreateParams): Promise<PaymentWebhook | null>;
  markWebhookProcessed(paymentWebhookId: string): Promise<PaymentWebhook | null>;
}
