export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';

import { QuoteStatusError, QuoteExpiredError, B2BValidationError } from '../errors/B2BErrors';

export interface QuoteLineItem {
  lineItemId: string;
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
  notes?: string;
}

export interface QuoteProps {
  quoteId: string;
  companyId: string;
  organizationId: string;
  quoteNumber: string;
  status: QuoteStatus;
  requestedBy: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  notes?: string;
  internalNotes?: string;
  validUntil: Date;
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  convertedOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Quote {
  private props: QuoteProps;

  private constructor(props: QuoteProps) {
    this.props = { ...props };
  }

  static create(input: {
    companyId: string;
    organizationId: string;
    requestedBy: string;
    currency?: string;
    validUntilDays?: number;
    notes?: string;
  }): Quote {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + (input.validUntilDays ?? 30));
    const quoteNumber = `QT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    return new Quote({
      quoteId: crypto.randomUUID(),
      companyId: input.companyId,
      organizationId: input.organizationId,
      quoteNumber,
      status: 'draft',
      requestedBy: input.requestedBy,
      lineItems: [],
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      total: 0,
      currency: input.currency ?? 'USD',
      notes: input.notes,
      validUntil,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: QuoteProps): Quote {
    return new Quote(props);
  }

  get quoteId(): string { return this.props.quoteId; }
  get companyId(): string { return this.props.companyId; }
  get organizationId(): string { return this.props.organizationId; }
  get quoteNumber(): string { return this.props.quoteNumber; }
  get status(): QuoteStatus { return this.props.status; }
  get requestedBy(): string { return this.props.requestedBy; }
  get lineItems(): QuoteLineItem[] { return [...this.props.lineItems]; }
  get subtotal(): number { return this.props.subtotal; }
  get discountTotal(): number { return this.props.discountTotal; }
  get taxTotal(): number { return this.props.taxTotal; }
  get total(): number { return this.props.total; }
  get currency(): string { return this.props.currency; }
  get notes(): string | undefined { return this.props.notes; }
  get internalNotes(): string | undefined { return this.props.internalNotes; }
  get validUntil(): Date { return this.props.validUntil; }
  get sentAt(): Date | undefined { return this.props.sentAt; }
  get viewedAt(): Date | undefined { return this.props.viewedAt; }
  get acceptedAt(): Date | undefined { return this.props.acceptedAt; }
  get rejectedAt(): Date | undefined { return this.props.rejectedAt; }
  get convertedOrderId(): string | undefined { return this.props.convertedOrderId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  addLineItem(item: Omit<QuoteLineItem, 'lineItemId'>): void {
    if (this.props.status !== 'draft') {
      throw new QuoteStatusError(this.props.quoteId, 'add_line_items_to', this.props.status);
    }
    this.props.lineItems.push({ ...item, lineItemId: crypto.randomUUID() });
    this.recalculate();
    this.props.updatedAt = new Date();
  }

  updateLineItem(lineItemId: string, updates: Partial<Omit<QuoteLineItem, 'lineItemId'>>): void {
    if (this.props.status !== 'draft') {
      throw new QuoteStatusError(this.props.quoteId, 'update_line_items_on', this.props.status);
    }
    const item = this.props.lineItems.find(i => i.lineItemId === lineItemId);
    if (!item) throw new B2BValidationError(`Line item not found: ${lineItemId}`);
    Object.assign(item, updates);
    this.recalculate();
    this.props.updatedAt = new Date();
  }

  removeLineItem(lineItemId: string): void {
    if (this.props.status !== 'draft') {
      throw new QuoteStatusError(this.props.quoteId, 'remove_line_items_from', this.props.status);
    }
    this.props.lineItems = this.props.lineItems.filter(i => i.lineItemId !== lineItemId);
    this.recalculate();
    this.props.updatedAt = new Date();
  }

  send(): void {
    if (this.props.status !== 'draft') {
      throw new QuoteStatusError(this.props.quoteId, 'send', this.props.status);
    }
    if (this.props.lineItems.length === 0) {
      throw new B2BValidationError('Cannot send an empty quote');
    }
    this.props.status = 'sent';
    this.props.sentAt = new Date();
    this.props.updatedAt = new Date();
  }

  markViewed(): void {
    if (this.props.status !== 'sent') {
      throw new QuoteStatusError(this.props.quoteId, 'mark_viewed', this.props.status);
    }
    this.props.status = 'viewed';
    this.props.viewedAt = new Date();
    this.props.updatedAt = new Date();
  }

  accept(): void {
    if (this.props.status !== 'sent' && this.props.status !== 'viewed') {
      throw new QuoteStatusError(this.props.quoteId, 'accept', this.props.status);
    }
    if (this.props.validUntil < new Date()) {
      throw new QuoteExpiredError(this.props.quoteId);
    }
    this.props.status = 'accepted';
    this.props.acceptedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reject(reason?: string): void {
    if (this.props.status !== 'sent' && this.props.status !== 'viewed') {
      throw new QuoteStatusError(this.props.quoteId, 'reject', this.props.status);
    }
    this.props.status = 'rejected';
    this.props.rejectedAt = new Date();
    if (reason) this.props.notes = `${this.props.notes ?? ''}\nRejection reason: ${reason}`.trim();
    this.props.updatedAt = new Date();
  }

  convert(orderId: string): void {
    if (this.props.status !== 'accepted') {
      throw new QuoteStatusError(this.props.quoteId, 'convert', this.props.status);
    }
    this.props.status = 'converted';
    this.props.convertedOrderId = orderId;
    this.props.updatedAt = new Date();
  }

  expire(): void {
    if (this.props.status === 'draft' || this.props.status === 'sent' || this.props.status === 'viewed') {
      this.props.status = 'expired';
      this.props.updatedAt = new Date();
    }
  }

  setNotes(notes: string): void {
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  setInternalNotes(notes: string): void {
    this.props.internalNotes = notes;
    this.props.updatedAt = new Date();
  }

  get isExpired(): boolean {
    return this.props.validUntil < new Date() && this.props.status !== 'accepted' && this.props.status !== 'converted';
  }

  get lineItemCount(): number {
    return this.props.lineItems.length;
  }

  private recalculate(): void {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    for (const item of this.props.lineItems) {
      const lineSubtotal = item.unitPrice * item.quantity;
      const discount = item.discountPercent ? lineSubtotal * (item.discountPercent / 100) : 0;
      const taxable = lineSubtotal - discount;
      const tax = item.taxRate ? taxable * (item.taxRate / 100) : 0;

      subtotal += lineSubtotal;
      discountTotal += discount;
      taxTotal += tax;
    }

    this.props.subtotal = subtotal;
    this.props.discountTotal = discountTotal;
    this.props.taxTotal = taxTotal;
    this.props.total = subtotal - discountTotal + taxTotal;
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props, lineItems: [...this.props.lineItems] };
  }
}
