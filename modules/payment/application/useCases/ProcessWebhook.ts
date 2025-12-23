/**
 * ProcessWebhook Use Case
 * 
 * Handles payment provider webhooks (Stripe, PayPal, etc.)
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ProcessWebhookInput {
  provider: 'stripe' | 'paypal' | 'adyen' | 'braintree';
  eventType: string;
  payload: Record<string, unknown>;
  signature?: string;
  timestamp?: string;
}

export interface ProcessWebhookOutput {
  processed: boolean;
  eventType: string;
  transactionId?: string;
  action?: 'payment_completed' | 'payment_failed' | 'refund_completed' | 'dispute_created' | 'subscription_updated';
  processedAt: string;
}

export class ProcessWebhookUseCase {
  constructor(
    private readonly paymentRepository: any,
    private readonly webhookSecrets: Record<string, string>
  ) {}

  async execute(input: ProcessWebhookInput): Promise<ProcessWebhookOutput> {
    // Verify webhook signature if provided
    if (input.signature) {
      const isValid = await this.verifySignature(input);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    let action: ProcessWebhookOutput['action'];
    let transactionId: string | undefined;

    // Process based on event type
    switch (input.eventType) {
      case 'payment_intent.succeeded':
      case 'PAYMENT.CAPTURE.COMPLETED':
        action = 'payment_completed';
        transactionId = await this.handlePaymentCompleted(input);
        break;

      case 'payment_intent.payment_failed':
      case 'PAYMENT.CAPTURE.DENIED':
        action = 'payment_failed';
        transactionId = await this.handlePaymentFailed(input);
        break;

      case 'charge.refunded':
      case 'PAYMENT.CAPTURE.REFUNDED':
        action = 'refund_completed';
        transactionId = await this.handleRefundCompleted(input);
        break;

      case 'charge.dispute.created':
      case 'CUSTOMER.DISPUTE.CREATED':
        action = 'dispute_created';
        transactionId = await this.handleDisputeCreated(input);
        break;

      case 'customer.subscription.updated':
      case 'BILLING.SUBSCRIPTION.UPDATED':
        action = 'subscription_updated';
        await this.handleSubscriptionUpdated(input);
        break;

      default:
        // Log unknown event types but don't fail
        console.log(`Unhandled webhook event: ${input.eventType}`);
    }

    return {
      processed: true,
      eventType: input.eventType,
      transactionId,
      action,
      processedAt: new Date().toISOString(),
    };
  }

  private async verifySignature(input: ProcessWebhookInput): Promise<boolean> {
    const secret = this.webhookSecrets[input.provider];
    if (!secret) return false;
    // Signature verification would be implemented per provider
    // For now, assume valid if secret exists
    return true;
  }

  private async handlePaymentCompleted(input: ProcessWebhookInput): Promise<string> {
    const providerTransactionId = this.extractTransactionId(input);
    
    const transaction = await this.paymentRepository.findByProviderTransactionId(providerTransactionId);
    if (transaction) {
      await this.paymentRepository.updateStatus(transaction.transactionId, 'completed');
      
      eventBus.emit('payment.completed', {
        transactionId: transaction.transactionId,
        orderId: transaction.orderId,
        amount: transaction.amount,
        provider: input.provider,
      });
      
      return transaction.transactionId;
    }
    return providerTransactionId;
  }

  private async handlePaymentFailed(input: ProcessWebhookInput): Promise<string> {
    const providerTransactionId = this.extractTransactionId(input);
    
    const transaction = await this.paymentRepository.findByProviderTransactionId(providerTransactionId);
    if (transaction) {
      const failureReason = (input.payload as any).last_payment_error?.message || 'Payment failed';
      await this.paymentRepository.updateStatus(transaction.transactionId, 'failed', { failureReason });
      
      eventBus.emit('payment.failed', {
        transactionId: transaction.transactionId,
        orderId: transaction.orderId,
        reason: failureReason,
      });
      
      return transaction.transactionId;
    }
    return providerTransactionId;
  }

  private async handleRefundCompleted(input: ProcessWebhookInput): Promise<string> {
    const providerRefundId = this.extractRefundId(input);
    
    const refund = await this.paymentRepository.findRefundByProviderRefundId(providerRefundId);
    if (refund) {
      await this.paymentRepository.updateRefundStatus(refund.refundId, 'completed');
      
      eventBus.emit('payment.refunded', {
        refundId: refund.refundId,
        transactionId: refund.transactionId,
        amount: refund.amount,
      });
      
      return refund.transactionId;
    }
    return providerRefundId;
  }

  private async handleDisputeCreated(input: ProcessWebhookInput): Promise<string> {
    const transactionId = this.extractTransactionId(input);
    
    await this.paymentRepository.createDispute({
      transactionId,
      provider: input.provider,
      providerDisputeId: (input.payload as any).id,
      amount: (input.payload as any).amount,
      reason: (input.payload as any).reason,
      status: 'open',
    });
    
    eventBus.emit('payment.disputed', {
      transactionId,
      provider: input.provider,
    });
    
    return transactionId;
  }

  private async handleSubscriptionUpdated(input: ProcessWebhookInput): Promise<void> {
    // Subscription webhook handling would be implemented here
  }

  private extractTransactionId(input: ProcessWebhookInput): string {
    const payload = input.payload as any;
    switch (input.provider) {
      case 'stripe':
        return payload.data?.object?.id || payload.id;
      case 'paypal':
        return payload.resource?.id;
      default:
        return payload.id || payload.transactionId;
    }
  }

  private extractRefundId(input: ProcessWebhookInput): string {
    const payload = input.payload as any;
    switch (input.provider) {
      case 'stripe':
        return payload.data?.object?.id;
      case 'paypal':
        return payload.resource?.id;
      default:
        return payload.id || payload.refundId;
    }
  }
}
