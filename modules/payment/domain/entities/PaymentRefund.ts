/**
 * Payment Refund Entity
 */

import { RefundStatus } from '../valueObjects/PaymentStatus';

export interface PaymentRefundProps {
  refundId: string;
  transactionId: string;
  externalRefundId?: string;
  amount: number;
  currency: string;
  reason?: string;
  status: RefundStatus;
  gatewayResponse?: Record<string, any>;
  errorCode?: string;
  errorMessage?: string;
  processedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentRefund {
  private props: PaymentRefundProps;

  private constructor(props: PaymentRefundProps) {
    this.props = props;
  }

  static create(props: {
    refundId: string;
    transactionId: string;
    amount: number;
    currency: string;
    reason?: string;
    metadata?: Record<string, any>;
  }): PaymentRefund {
    const now = new Date();
    return new PaymentRefund({
      refundId: props.refundId,
      transactionId: props.transactionId,
      amount: props.amount,
      currency: props.currency.toUpperCase(),
      reason: props.reason,
      status: RefundStatus.PENDING,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PaymentRefundProps): PaymentRefund {
    return new PaymentRefund(props);
  }

  // Getters
  get refundId(): string {
    return this.props.refundId;
  }
  get transactionId(): string {
    return this.props.transactionId;
  }
  get externalRefundId(): string | undefined {
    return this.props.externalRefundId;
  }
  get amount(): number {
    return this.props.amount;
  }
  get currency(): string {
    return this.props.currency;
  }
  get reason(): string | undefined {
    return this.props.reason;
  }
  get status(): RefundStatus {
    return this.props.status;
  }
  get gatewayResponse(): Record<string, any> | undefined {
    return this.props.gatewayResponse;
  }
  get errorCode(): string | undefined {
    return this.props.errorCode;
  }
  get errorMessage(): string | undefined {
    return this.props.errorMessage;
  }
  get processedAt(): Date | undefined {
    return this.props.processedAt;
  }
  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed
  get isPending(): boolean {
    return this.props.status === RefundStatus.PENDING;
  }
  get isCompleted(): boolean {
    return this.props.status === RefundStatus.COMPLETED;
  }
  get isFailed(): boolean {
    return this.props.status === RefundStatus.FAILED;
  }

  // Domain methods
  startProcessing(): void {
    this.props.status = RefundStatus.PROCESSING;
    this.touch();
  }

  complete(externalRefundId: string, gatewayResponse?: Record<string, any>): void {
    this.props.status = RefundStatus.COMPLETED;
    this.props.externalRefundId = externalRefundId;
    this.props.gatewayResponse = gatewayResponse;
    this.props.processedAt = new Date();
    this.touch();
  }

  fail(errorCode: string, errorMessage: string, gatewayResponse?: Record<string, any>): void {
    this.props.status = RefundStatus.FAILED;
    this.props.errorCode = errorCode;
    this.props.errorMessage = errorMessage;
    this.props.gatewayResponse = gatewayResponse;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      refundId: this.props.refundId,
      transactionId: this.props.transactionId,
      externalRefundId: this.props.externalRefundId,
      amount: this.props.amount,
      currency: this.props.currency,
      reason: this.props.reason,
      status: this.props.status,
      isCompleted: this.isCompleted,
      isFailed: this.isFailed,
      processedAt: this.props.processedAt?.toISOString(),
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
