/**
 * Payment Transaction Entity
 */

import { TransactionStatus, canTransitionTo } from '../valueObjects/PaymentStatus';
import { RefundAmountExceedsRefundableError, InvalidStatusTransitionError } from '../errors/PaymentErrors';

export interface PaymentTransactionProps {
  transactionId: string;
  orderId: string;
  customerId?: string;
  paymentMethodConfigId: string;
  gatewayId: string;
  externalTransactionId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethodDetails?: Record<string, unknown>;
  gatewayResponse?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  refundedAmount: number;
  customerIp?: string;
  authorizedAt?: Date;
  capturedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentTransaction {
  private props: PaymentTransactionProps;

  private constructor(props: PaymentTransactionProps) {
    this.props = props;
  }

  static create(props: {
    transactionId: string;
    orderId: string;
    customerId?: string;
    paymentMethodConfigId: string;
    gatewayId: string;
    amount: number;
    currency: string;
    customerIp?: string;
    metadata?: Record<string, unknown>;
  }): PaymentTransaction {
    const now = new Date();
    return new PaymentTransaction({
      transactionId: props.transactionId,
      orderId: props.orderId,
      customerId: props.customerId,
      paymentMethodConfigId: props.paymentMethodConfigId,
      gatewayId: props.gatewayId,
      amount: props.amount,
      currency: props.currency.toUpperCase(),
      status: TransactionStatus.PENDING,
      refundedAmount: 0,
      customerIp: props.customerIp,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PaymentTransactionProps): PaymentTransaction {
    return new PaymentTransaction(props);
  }

  // Getters
  get transactionId(): string {
    return this.props.transactionId;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get customerId(): string | undefined {
    return this.props.customerId;
  }
  get paymentMethodConfigId(): string {
    return this.props.paymentMethodConfigId;
  }
  get gatewayId(): string {
    return this.props.gatewayId;
  }
  get externalTransactionId(): string | undefined {
    return this.props.externalTransactionId;
  }
  get amount(): number {
    return this.props.amount;
  }
  get currency(): string {
    return this.props.currency;
  }
  get status(): TransactionStatus {
    return this.props.status;
  }
  get paymentMethodDetails(): Record<string, unknown> | undefined {
    return this.props.paymentMethodDetails;
  }
  get gatewayResponse(): Record<string, unknown> | undefined {
    return this.props.gatewayResponse;
  }
  get errorCode(): string | undefined {
    return this.props.errorCode;
  }
  get errorMessage(): string | undefined {
    return this.props.errorMessage;
  }
  get refundedAmount(): number {
    return this.props.refundedAmount;
  }
  get customerIp(): string | undefined {
    return this.props.customerIp;
  }
  get authorizedAt(): Date | undefined {
    return this.props.authorizedAt;
  }
  get capturedAt(): Date | undefined {
    return this.props.capturedAt;
  }
  get metadata(): Record<string, unknown> | undefined {
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
    return this.props.status === TransactionStatus.PENDING;
  }
  get isAuthorized(): boolean {
    return this.props.status === TransactionStatus.AUTHORIZED;
  }
  get isPaid(): boolean {
    return this.props.status === TransactionStatus.PAID;
  }
  get isFailed(): boolean {
    return this.props.status === TransactionStatus.FAILED;
  }
  get isRefunded(): boolean {
    return this.props.status === TransactionStatus.REFUNDED;
  }
  get canBeRefunded(): boolean {
    return [TransactionStatus.PAID, TransactionStatus.PARTIALLY_REFUNDED].includes(this.props.status);
  }
  get refundableAmount(): number {
    return this.props.amount - this.props.refundedAmount;
  }

  // Domain methods
  authorize(externalTransactionId: string, gatewayResponse?: Record<string, unknown>): void {
    this.updateStatus(TransactionStatus.AUTHORIZED);
    this.props.externalTransactionId = externalTransactionId;
    this.props.gatewayResponse = gatewayResponse;
    this.props.authorizedAt = new Date();
    this.touch();
  }

  capture(gatewayResponse?: Record<string, unknown>): void {
    this.updateStatus(TransactionStatus.PAID);
    this.props.gatewayResponse = gatewayResponse;
    this.props.capturedAt = new Date();
    this.touch();
  }

  markAsPaid(externalTransactionId: string, gatewayResponse?: Record<string, unknown>): void {
    this.updateStatus(TransactionStatus.PAID);
    this.props.externalTransactionId = externalTransactionId;
    this.props.gatewayResponse = gatewayResponse;
    this.props.capturedAt = new Date();
    this.touch();
  }

  void(gatewayResponse?: Record<string, unknown>): void {
    this.updateStatus(TransactionStatus.VOIDED);
    this.props.gatewayResponse = gatewayResponse;
    this.touch();
  }

  fail(errorCode: string, errorMessage: string, gatewayResponse?: Record<string, unknown>): void {
    this.updateStatus(TransactionStatus.FAILED);
    this.props.errorCode = errorCode;
    this.props.errorMessage = errorMessage;
    this.props.gatewayResponse = gatewayResponse;
    this.touch();
  }

  expire(): void {
    this.updateStatus(TransactionStatus.EXPIRED);
    this.touch();
  }

  cancel(): void {
    this.updateStatus(TransactionStatus.CANCELLED);
    this.touch();
  }

  recordRefund(amount: number): void {
    if (amount > this.refundableAmount) {
      throw new RefundAmountExceedsRefundableError(amount, this.refundableAmount);
    }
    this.props.refundedAmount += amount;

    if (this.props.refundedAmount >= this.props.amount) {
      this.props.status = TransactionStatus.REFUNDED;
    } else {
      this.props.status = TransactionStatus.PARTIALLY_REFUNDED;
    }
    this.touch();
  }

  setPaymentMethodDetails(details: Record<string, unknown>): void {
    this.props.paymentMethodDetails = details;
    this.touch();
  }

  updateMetadata(metadata: Record<string, unknown>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  private updateStatus(newStatus: TransactionStatus): void {
    if (!canTransitionTo(this.props.status, newStatus)) {
      throw new InvalidStatusTransitionError(this.props.status, newStatus);
    }
    this.props.status = newStatus;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      transactionId: this.props.transactionId,
      orderId: this.props.orderId,
      customerId: this.props.customerId,
      paymentMethodConfigId: this.props.paymentMethodConfigId,
      gatewayId: this.props.gatewayId,
      externalTransactionId: this.props.externalTransactionId,
      amount: this.props.amount,
      currency: this.props.currency,
      status: this.props.status,
      refundedAmount: this.props.refundedAmount,
      refundableAmount: this.refundableAmount,
      isPaid: this.isPaid,
      canBeRefunded: this.canBeRefunded,
      authorizedAt: this.props.authorizedAt?.toISOString(),
      capturedAt: this.props.capturedAt?.toISOString(),
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
