export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'denied'
  | 'inTransit'
  | 'received'
  | 'inspected'
  | 'completed'
  | 'cancelled';

import { InvalidReturnTransitionError } from '../errors/ReturnErrors';

export type ReturnType = 'refund' | 'exchange' | 'storeCredit' | 'repair';

export type ReturnCarrier = 'ups' | 'fedex' | 'dhl' | 'usps' | 'custom';

export type ReturnItemCondition = 'new' | 'likeNew' | 'used' | 'damaged' | 'unsellable';

export type ReturnItemReason = 'productNotAsDescribed' | 'wrongProduct' | 'damaged' | 'expired' | 'other';

export type WarrantyStatus = 'none' | 'claimed' | 'approved' | 'denied' | 'expired';

export interface ReturnItem {
  orderReturnItemId: string;
  orderReturnId: string;
  orderItemId: string;
  quantity: number;
  returnReason: ReturnItemReason;
  returnReasonDetail?: string;
  condition: ReturnItemCondition;
  restockItem: boolean;
  refundAmount?: number;
  exchangeProductId?: string;
  exchangeVariantId?: string;
  notes?: string;
  inspectionNotes?: string;
  warrantyClaimId?: string;
  warrantyStatus: WarrantyStatus;
  warrantyExpiresAt?: Date;
  createdAt: Date;
}

export interface ReturnRequestProps {
  orderReturnId: string;
  orderId: string;
  returnNumber: string;
  customerId?: string;
  status: ReturnStatus;
  returnType: ReturnType;
  requestedAt: Date;
  approvedAt?: Date;
  receivedAt?: Date;
  completedAt?: Date;
  rmaNumber?: string;
  paymentRefundId?: string;
  returnShippingPaid: boolean;
  returnShippingAmount?: number;
  returnShippingLabel?: string;
  returnCarrier: ReturnCarrier;
  returnTrackingNumber?: string;
  returnTrackingUrl?: string;
  returnReason?: string;
  returnInstructions?: string;
  customerNotes?: string;
  adminNotes?: string;
  requiresInspection: boolean;
  inspectionPassedItems?: Record<string, unknown>;
  inspectionFailedItems?: Record<string, unknown>;
  items: ReturnItem[];
  createdAt: Date;
  updatedAt: Date;
}

const VALID_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ['approved', 'denied', 'cancelled'],
  approved: ['inTransit', 'cancelled'],
  denied: [],
  inTransit: ['received', 'cancelled'],
  received: ['inspected', 'completed'],
  inspected: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export class ReturnRequest {
  private props: ReturnRequestProps;

  private constructor(props: ReturnRequestProps) {
    this.props = props;
  }

  static create(params: {
    orderId: string;
    customerId?: string;
    returnType: ReturnType;
    returnReason?: string;
    customerNotes?: string;
    returnCarrier?: ReturnCarrier;
    returnShippingPaid?: boolean;
    requiresInspection?: boolean;
    items: Array<Omit<ReturnItem, 'orderReturnItemId' | 'orderReturnId' | 'createdAt' | 'warrantyStatus'> & { warrantyStatus?: WarrantyStatus }>;
  }): ReturnRequest {
    const now = new Date();
    const returnNumber = `RET-${now.getTime().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return new ReturnRequest({
      orderReturnId: '',
      orderId: params.orderId,
      returnNumber,
      customerId: params.customerId,
      status: 'requested',
      returnType: params.returnType,
      requestedAt: now,
      returnShippingPaid: params.returnShippingPaid ?? false,
      returnCarrier: params.returnCarrier ?? 'custom',
      returnReason: params.returnReason,
      customerNotes: params.customerNotes,
      requiresInspection: params.requiresInspection ?? true,
      items: params.items.map(item => ({
        ...item,
        orderReturnItemId: '',
        orderReturnId: '',
        warrantyStatus: item.warrantyStatus ?? 'none',
        createdAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ReturnRequestProps): ReturnRequest {
    return new ReturnRequest(props);
  }

  canTransitionTo(newStatus: ReturnStatus): boolean {
    const allowed = VALID_TRANSITIONS[this.props.status];
    return allowed.includes(newStatus);
  }

  transitionTo(newStatus: ReturnStatus, reason?: string): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidReturnTransitionError(this.props.status, newStatus);
    }

    const now = new Date();
    this.props.status = newStatus;
    this.props.updatedAt = now;

    switch (newStatus) {
      case 'approved':
        this.props.approvedAt = now;
        if (!this.props.rmaNumber) {
          this.props.rmaNumber = `RMA-${now.getTime().toString(36).toUpperCase()}`;
        }
        break;
      case 'received':
        this.props.receivedAt = now;
        break;
      case 'completed':
        this.props.completedAt = now;
        break;
      case 'cancelled':
        if (reason) this.props.adminNotes = (this.props.adminNotes ?? '') + `\nCancelled: ${reason}`;
        break;
      case 'denied':
        if (reason) this.props.adminNotes = (this.props.adminNotes ?? '') + `\nDenied: ${reason}`;
        break;
    }
  }

  approve(rmaNumber?: string): void {
    this.transitionTo('approved');
    if (rmaNumber) this.props.rmaNumber = rmaNumber;
  }

  deny(reason?: string): void {
    this.transitionTo('denied', reason);
  }

  markInTransit(trackingNumber?: string, trackingUrl?: string): void {
    this.transitionTo('inTransit');
    if (trackingNumber) this.props.returnTrackingNumber = trackingNumber;
    if (trackingUrl) this.props.returnTrackingUrl = trackingUrl;
  }

  markReceived(): void {
    this.transitionTo('received');
  }

  completeInspection(passedItems?: Record<string, unknown>, failedItems?: Record<string, unknown>): void {
    this.transitionTo('inspected');
    if (passedItems) this.props.inspectionPassedItems = passedItems;
    if (failedItems) this.props.inspectionFailedItems = failedItems;
  }

  complete(): void {
    this.transitionTo('completed');
  }

  cancel(reason?: string): void {
    this.transitionTo('cancelled', reason);
  }

  addTracking(trackingNumber: string, trackingUrl?: string, carrier?: ReturnCarrier): void {
    this.props.returnTrackingNumber = trackingNumber;
    if (trackingUrl) this.props.returnTrackingUrl = trackingUrl;
    if (carrier) this.props.returnCarrier = carrier;
    this.props.updatedAt = new Date();
  }

  linkPaymentRefund(paymentRefundId: string): void {
    this.props.paymentRefundId = paymentRefundId;
    this.props.updatedAt = new Date();
  }

  setShippingLabel(label: string, amount?: number): void {
    this.props.returnShippingLabel = label;
    if (amount !== undefined) this.props.returnShippingAmount = amount;
    this.props.returnShippingPaid = true;
    this.props.updatedAt = new Date();
  }

  get orderReturnId(): string { return this.props.orderReturnId; }
  get orderId(): string { return this.props.orderId; }
  get returnNumber(): string { return this.props.returnNumber; }
  get customerId(): string | undefined { return this.props.customerId; }
  get status(): ReturnStatus { return this.props.status; }
  get returnType(): ReturnType { return this.props.returnType; }
  get requestedAt(): Date { return this.props.requestedAt; }
  get approvedAt(): Date | undefined { return this.props.approvedAt; }
  get receivedAt(): Date | undefined { return this.props.receivedAt; }
  get completedAt(): Date | undefined { return this.props.completedAt; }
  get rmaNumber(): string | undefined { return this.props.rmaNumber; }
  get paymentRefundId(): string | undefined { return this.props.paymentRefundId; }
  get returnShippingPaid(): boolean { return this.props.returnShippingPaid; }
  get returnShippingAmount(): number | undefined { return this.props.returnShippingAmount; }
  get returnShippingLabel(): string | undefined { return this.props.returnShippingLabel; }
  get returnCarrier(): ReturnCarrier { return this.props.returnCarrier; }
  get returnTrackingNumber(): string | undefined { return this.props.returnTrackingNumber; }
  get returnTrackingUrl(): string | undefined { return this.props.returnTrackingUrl; }
  get returnReason(): string | undefined { return this.props.returnReason; }
  get returnInstructions(): string | undefined { return this.props.returnInstructions; }
  get customerNotes(): string | undefined { return this.props.customerNotes; }
  get adminNotes(): string | undefined { return this.props.adminNotes; }
  get requiresInspection(): boolean { return this.props.requiresInspection; }
  get inspectionPassedItems(): Record<string, unknown> | undefined { return this.props.inspectionPassedItems; }
  get inspectionFailedItems(): Record<string, unknown> | undefined { return this.props.inspectionFailedItems; }
  get items(): ReturnItem[] { return this.props.items; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get isPending(): boolean {
    return ['requested', 'approved', 'inTransit', 'received', 'inspected'].includes(this.props.status);
  }

  get isCompleted(): boolean {
    return this.props.status === 'completed';
  }

  get isCancelled(): boolean {
    return this.props.status === 'cancelled';
  }

  get totalRefundAmount(): number {
    return this.props.items.reduce((sum, item) => sum + (item.refundAmount ?? 0), 0);
  }

  toJSON(): ReturnRequestProps {
    return { ...this.props };
  }
}
