/**
 * Payment Domain Events
 */

import { TransactionStatus } from '../valueObjects/PaymentStatus';

export interface DomainEvent {
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  payload: Record<string, any>;
}

export class PaymentInitiatedEvent implements DomainEvent {
  readonly eventType = 'payment.initiated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { transactionId: string; orderId: string; amount: number; currency: string };

  constructor(transactionId: string, orderId: string, amount: number, currency: string) {
    this.occurredAt = new Date();
    this.aggregateId = transactionId;
    this.payload = { transactionId, orderId, amount, currency };
  }
}

export class PaymentAuthorizedEvent implements DomainEvent {
  readonly eventType = 'payment.authorized';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { transactionId: string; orderId: string; externalTransactionId: string };

  constructor(transactionId: string, orderId: string, externalTransactionId: string) {
    this.occurredAt = new Date();
    this.aggregateId = transactionId;
    this.payload = { transactionId, orderId, externalTransactionId };
  }
}

export class PaymentCapturedEvent implements DomainEvent {
  readonly eventType = 'payment.captured';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { transactionId: string; orderId: string; amount: number };

  constructor(transactionId: string, orderId: string, amount: number) {
    this.occurredAt = new Date();
    this.aggregateId = transactionId;
    this.payload = { transactionId, orderId, amount };
  }
}

export class PaymentFailedEvent implements DomainEvent {
  readonly eventType = 'payment.failed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { transactionId: string; orderId: string; errorCode: string; errorMessage: string };

  constructor(transactionId: string, orderId: string, errorCode: string, errorMessage: string) {
    this.occurredAt = new Date();
    this.aggregateId = transactionId;
    this.payload = { transactionId, orderId, errorCode, errorMessage };
  }
}

export class RefundInitiatedEvent implements DomainEvent {
  readonly eventType = 'payment.refund_initiated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { refundId: string; transactionId: string; amount: number; reason?: string };

  constructor(refundId: string, transactionId: string, amount: number, reason?: string) {
    this.occurredAt = new Date();
    this.aggregateId = refundId;
    this.payload = { refundId, transactionId, amount, reason };
  }
}

export class RefundCompletedEvent implements DomainEvent {
  readonly eventType = 'payment.refund_completed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { refundId: string; transactionId: string; amount: number };

  constructor(refundId: string, transactionId: string, amount: number) {
    this.occurredAt = new Date();
    this.aggregateId = refundId;
    this.payload = { refundId, transactionId, amount };
  }
}
