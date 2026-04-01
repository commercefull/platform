/**
 * ProcessPaymentWebhook Use Case
 *
 * Idempotent webhook ingestion: checks for an existing record by externalId
 * before inserting. Returns the existing record if already processed.
 *
 * Validates: Requirements 1.4, 1.10
 */

import paymentWebhookRepo, { PaymentWebhook } from '../../infrastructure/repositories/paymentWebhookRepo';

// ============================================================================
// Command
// ============================================================================

export class ProcessPaymentWebhookCommand {
  constructor(
    public readonly externalId: string,
    public readonly provider: string,
    public readonly eventType: string,
    public readonly payload: Record<string, any>,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ProcessPaymentWebhookResponse {
  paymentWebhookId: string;
  externalId: string;
  provider: string;
  eventType: string;
  processedAt?: string;
  createdAt: string;
  alreadyExisted: boolean;
}

// ============================================================================
// Use Case
// ============================================================================

export class ProcessPaymentWebhookUseCase {
  constructor(private readonly repo: typeof paymentWebhookRepo = paymentWebhookRepo) {}

  async execute(command: ProcessPaymentWebhookCommand): Promise<ProcessPaymentWebhookResponse> {
    // Idempotency check: skip insert if this externalId already exists
    const existing = await this.repo.findByExternalId(command.externalId);
    if (existing) {
      return { ...this.mapToResponse(existing), alreadyExisted: true };
    }

    const webhook = await this.repo.create({
      externalId: command.externalId,
      provider: command.provider,
      eventType: command.eventType,
      payload: command.payload,
      processedAt: new Date(),
    });

    if (!webhook) {
      throw new Error('Failed to create payment webhook record');
    }

    return { ...this.mapToResponse(webhook), alreadyExisted: false };
  }

  private mapToResponse(w: PaymentWebhook): Omit<ProcessPaymentWebhookResponse, 'alreadyExisted'> {
    return {
      paymentWebhookId: w.paymentWebhookId,
      externalId: w.externalId,
      provider: w.provider,
      eventType: w.eventType,
      processedAt: w.processedAt?.toISOString(),
      createdAt: w.createdAt.toISOString(),
    };
  }
}
