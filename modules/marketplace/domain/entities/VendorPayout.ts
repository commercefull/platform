import { randomUUID } from 'crypto';
import { PayoutStatusError, MarketplaceValidationError } from '../errors/MarketplaceErrors';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PayoutMethod = 'bank_transfer' | 'paypal' | 'stripe' | 'manual';

export interface PayoutLineItem {
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  grossRevenue: number;
  commissionAmount: number;
  netAmount: number;
  payoutDate?: Date;
}

export interface VendorPayoutProps {
  payoutId: string;
  vendorId: string;
  organizationId: string;
  payoutNumber: string;
  status: PayoutStatus;
  method: PayoutMethod;
  periodStart: Date;
  periodEnd: Date;
  lineItems: PayoutLineItem[];
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  transactionRef?: string;
  failureReason?: string;
  processedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class VendorPayout {
  private readonly _payoutId: string;
  private _vendorId: string;
  private _organizationId: string;
  private _payoutNumber: string;
  private _status: PayoutStatus;
  private _method: PayoutMethod;
  private _periodStart: Date;
  private _periodEnd: Date;
  private _lineItems: PayoutLineItem[];
  private _grossAmount: number;
  private _commissionAmount: number;
  private _netAmount: number;
  private _currency: string;
  private _transactionRef?: string;
  private _failureReason?: string;
  private _processedAt?: Date;
  private _completedAt?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: VendorPayoutProps) {
    this._payoutId = props.payoutId;
    this._vendorId = props.vendorId;
    this._organizationId = props.organizationId;
    this._payoutNumber = props.payoutNumber;
    this._status = props.status;
    this._method = props.method;
    this._periodStart = props.periodStart;
    this._periodEnd = props.periodEnd;
    this._lineItems = props.lineItems;
    this._grossAmount = props.grossAmount;
    this._commissionAmount = props.commissionAmount;
    this._netAmount = props.netAmount;
    this._currency = props.currency;
    this._transactionRef = props.transactionRef;
    this._failureReason = props.failureReason;
    this._processedAt = props.processedAt;
    this._completedAt = props.completedAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(input: {
    vendorId: string;
    organizationId: string;
    method: PayoutMethod;
    periodStart: Date;
    periodEnd: Date;
    currency?: string;
    lineItems?: PayoutLineItem[];
  }): VendorPayout {
    const now = new Date();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lineItems = input.lineItems ?? [];
    const grossAmount = lineItems.reduce((sum, li) => sum + li.grossRevenue, 0);
    const commissionAmount = lineItems.reduce((sum, li) => sum + li.commissionAmount, 0);
    const netAmount = grossAmount - commissionAmount;
    return new VendorPayout({
      payoutId: randomUUID(),
      vendorId: input.vendorId,
      organizationId: input.organizationId,
      payoutNumber: `PO-${year}${month}-${seq}`,
      status: 'pending',
      method: input.method,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      lineItems,
      grossAmount,
      commissionAmount,
      netAmount,
      currency: input.currency ?? 'USD',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: VendorPayoutProps): VendorPayout {
    return new VendorPayout(props);
  }

  get payoutId(): string { return this._payoutId; }
  get vendorId(): string { return this._vendorId; }
  get organizationId(): string { return this._organizationId; }
  get payoutNumber(): string { return this._payoutNumber; }
  get status(): PayoutStatus { return this._status; }
  get method(): PayoutMethod { return this._method; }
  get periodStart(): Date { return this._periodStart; }
  get periodEnd(): Date { return this._periodEnd; }
  get lineItems(): PayoutLineItem[] { return this._lineItems; }
  get grossAmount(): number { return this._grossAmount; }
  get commissionAmount(): number { return this._commissionAmount; }
  get netAmount(): number { return this._netAmount; }
  get currency(): string { return this._currency; }
  get transactionRef(): string | undefined { return this._transactionRef; }
  get failureReason(): string | undefined { return this._failureReason; }
  get processedAt(): Date | undefined { return this._processedAt; }
  get completedAt(): Date | undefined { return this._completedAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  get isPending(): boolean { return this._status === 'pending'; }
  get isCompleted(): boolean { return this._status === 'completed'; }
  get isProcessing(): boolean { return this._status === 'processing'; }
  get lineItemCount(): number { return this._lineItems.length; }

  addLineItem(item: Omit<PayoutLineItem, 'payoutDate'>): void {
    if (this._status !== 'pending') {
      throw new PayoutStatusError(this._payoutId, 'add_line_items_to', this._status);
    }
    this._lineItems.push({ ...item });
    this._grossAmount += item.grossRevenue;
    this._commissionAmount += item.commissionAmount;
    this._netAmount = this._grossAmount - this._commissionAmount;
    this._updatedAt = new Date();
  }

  startProcessing(): void {
    if (this._status !== 'pending') {
      throw new PayoutStatusError(this._payoutId, 'start_processing', this._status);
    }
    this._status = 'processing';
    this._processedAt = new Date();
    this._updatedAt = new Date();
  }

  complete(transactionRef?: string): void {
    if (this._status !== 'processing') {
      throw new PayoutStatusError(this._payoutId, 'complete', this._status);
    }
    this._status = 'completed';
    this._transactionRef = transactionRef;
    this._completedAt = new Date();
    this._lineItems = this._lineItems.map(li => ({ ...li, payoutDate: this._completedAt }));
    this._updatedAt = new Date();
  }

  fail(reason: string): void {
    if (this._status === 'completed' || this._status === 'cancelled') {
      throw new PayoutStatusError(this._payoutId, 'fail', this._status);
    }
    this._status = 'failed';
    this._failureReason = reason;
    this._updatedAt = new Date();
  }

  retry(): void {
    if (this._status !== 'failed') {
      throw new PayoutStatusError(this._payoutId, 'retry', this._status);
    }
    this._status = 'pending';
    this._failureReason = undefined;
    this._processedAt = undefined;
    this._updatedAt = new Date();
  }

  cancel(): void {
    if (this._status === 'completed') {
      throw new MarketplaceValidationError('Cannot cancel a completed payout');
    }
    this._status = 'cancelled';
    this._updatedAt = new Date();
  }

  setMethod(method: PayoutMethod): void {
    if (this._status !== 'pending') {
      throw new MarketplaceValidationError('Cannot change payout method after processing has started');
    }
    this._method = method;
    this._updatedAt = new Date();
  }

  toJSON(): VendorPayoutProps {
    return {
      payoutId: this._payoutId,
      vendorId: this._vendorId,
      organizationId: this._organizationId,
      payoutNumber: this._payoutNumber,
      status: this._status,
      method: this._method,
      periodStart: this._periodStart,
      periodEnd: this._periodEnd,
      lineItems: this._lineItems,
      grossAmount: this._grossAmount,
      commissionAmount: this._commissionAmount,
      netAmount: this._netAmount,
      currency: this._currency,
      transactionRef: this._transactionRef,
      failureReason: this._failureReason,
      processedAt: this._processedAt,
      completedAt: this._completedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
