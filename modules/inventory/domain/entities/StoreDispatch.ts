export type DispatchStatus = 'draft' | 'pending_approval' | 'approved' | 'dispatched' | 'in_transit' | 'received' | 'cancelled';

export interface StoreDispatchItemProps {
  dispatchItemId: string;
  dispatchId: string;
  productId: string;
  variantId?: string;
  sku?: string;
  productName?: string;
  requestedQuantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  notes?: string;
}

export interface StoreDispatchProps {
  dispatchId: string;
  fromStoreId: string;
  toStoreId: string;
  dispatchNumber: string;
  status: DispatchStatus;
  items: StoreDispatchItemProps[];
  requestedBy?: string;
  approvedBy?: string;
  dispatchedBy?: string;
  receivedBy?: string;
  requestedAt?: Date;
  approvedAt?: Date;
  dispatchedAt?: Date;
  receivedAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class StoreDispatch {
  private props: StoreDispatchProps;

  private constructor(props: StoreDispatchProps) {
    this.props = props;
  }

  static create(props: {
    dispatchId: string;
    fromStoreId: string;
    toStoreId: string;
    dispatchNumber: string;
    items: Array<{
      dispatchItemId: string;
      productId: string;
      variantId?: string;
      sku?: string;
      productName?: string;
      requestedQuantity: number;
      notes?: string;
    }>;
    requestedBy?: string;
    notes?: string;
    metadata?: Record<string, any>;
    status?: DispatchStatus;
  }): StoreDispatch {
    const now = new Date();

    return new StoreDispatch({
      dispatchId: props.dispatchId,
      fromStoreId: props.fromStoreId,
      toStoreId: props.toStoreId,
      dispatchNumber: props.dispatchNumber,
      status: props.status || 'draft',
      items: props.items.map(item => ({
        dispatchItemId: item.dispatchItemId,
        dispatchId: props.dispatchId,
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        requestedQuantity: item.requestedQuantity,
        dispatchedQuantity: 0,
        receivedQuantity: 0,
        notes: item.notes,
      })),
      requestedBy: props.requestedBy,
      requestedAt: props.requestedBy ? now : undefined,
      notes: props.notes,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: StoreDispatchProps): StoreDispatch {
    return new StoreDispatch(props);
  }

  get dispatchId(): string {
    return this.props.dispatchId;
  }

  get fromStoreId(): string {
    return this.props.fromStoreId;
  }

  get toStoreId(): string {
    return this.props.toStoreId;
  }

  get dispatchNumber(): string {
    return this.props.dispatchNumber;
  }

  get status(): DispatchStatus {
    return this.props.status;
  }

  get items(): StoreDispatchItemProps[] {
    return this.props.items.map(item => ({ ...item }));
  }

  get requestedBy(): string | undefined {
    return this.props.requestedBy;
  }

  get approvedBy(): string | undefined {
    return this.props.approvedBy;
  }

  get dispatchedBy(): string | undefined {
    return this.props.dispatchedBy;
  }

  get receivedBy(): string | undefined {
    return this.props.receivedBy;
  }

  get requestedAt(): Date | undefined {
    return this.props.requestedAt;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get dispatchedAt(): Date | undefined {
    return this.props.dispatchedAt;
  }

  get receivedAt(): Date | undefined {
    return this.props.receivedAt;
  }

  get notes(): string | undefined {
    return this.props.notes;
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

  approve(approvedBy: string): void {
    if (!['draft', 'pending_approval'].includes(this.props.status)) {
      throw new Error('Dispatch cannot be approved from the current status');
    }

    this.props.status = 'approved';
    this.props.approvedBy = approvedBy;
    this.props.approvedAt = new Date();
    this.touch();
  }

  markDispatched(dispatchedBy: string, dispatchedItems?: Array<{ dispatchItemId: string; dispatchedQuantity: number }>): void {
    if (this.props.status !== 'approved') {
      throw new Error('Dispatch must be approved before it can be dispatched');
    }

    if (dispatchedItems && dispatchedItems.length > 0) {
      this.props.items = this.props.items.map(item => {
        const match = dispatchedItems.find(candidate => candidate.dispatchItemId === item.dispatchItemId);
        if (!match) {
          return item;
        }
        if (match.dispatchedQuantity < 0 || match.dispatchedQuantity > item.requestedQuantity) {
          throw new Error('Dispatched quantity cannot exceed requested quantity');
        }
        return { ...item, dispatchedQuantity: match.dispatchedQuantity };
      });
    } else {
      this.props.items = this.props.items.map(item => ({ ...item, dispatchedQuantity: item.requestedQuantity }));
    }

    this.props.status = 'dispatched';
    this.props.dispatchedBy = dispatchedBy;
    this.props.dispatchedAt = new Date();
    this.touch();
  }

  markInTransit(): void {
    if (this.props.status !== 'dispatched') {
      throw new Error('Dispatch must be dispatched before it can be in transit');
    }

    this.props.status = 'in_transit';
    this.touch();
  }

  markReceived(receivedBy: string, receivedItems: Array<{ dispatchItemId: string; receivedQuantity: number }>, notes?: string): void {
    if (!['dispatched', 'in_transit'].includes(this.props.status)) {
      throw new Error('Dispatch must be dispatched or in transit before it can be received');
    }

    this.props.items = this.props.items.map(item => {
      const match = receivedItems.find(candidate => candidate.dispatchItemId === item.dispatchItemId);
      const receivedQuantity = match?.receivedQuantity ?? item.dispatchedQuantity;

      if (receivedQuantity < 0 || receivedQuantity > item.dispatchedQuantity) {
        throw new Error('Received quantity cannot exceed dispatched quantity');
      }

      return {
        ...item,
        receivedQuantity,
      };
    });

    this.props.status = 'received';
    this.props.receivedBy = receivedBy;
    this.props.receivedAt = new Date();
    if (notes) {
      this.props.notes = this.props.notes ? `${this.props.notes}\n${notes}` : notes;
    }
    this.touch();
  }

  cancel(reason?: string): void {
    if (['dispatched', 'in_transit', 'received', 'cancelled'].includes(this.props.status)) {
      throw new Error('Dispatch cannot be cancelled from the current status');
    }

    this.props.status = 'cancelled';
    if (reason) {
      this.props.notes = this.props.notes ? `${this.props.notes}\n${reason}` : reason;
    }
    this.touch();
  }

  toJSON(): Record<string, any> {
    return {
      dispatchId: this.props.dispatchId,
      fromStoreId: this.props.fromStoreId,
      toStoreId: this.props.toStoreId,
      dispatchNumber: this.props.dispatchNumber,
      status: this.props.status,
      items: this.props.items.map(item => ({ ...item })),
      requestedBy: this.props.requestedBy,
      approvedBy: this.props.approvedBy,
      dispatchedBy: this.props.dispatchedBy,
      receivedBy: this.props.receivedBy,
      requestedAt: this.props.requestedAt?.toISOString(),
      approvedAt: this.props.approvedAt?.toISOString(),
      dispatchedAt: this.props.dispatchedAt?.toISOString(),
      receivedAt: this.props.receivedAt?.toISOString(),
      notes: this.props.notes,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
