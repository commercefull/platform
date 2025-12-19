/**
 * Inventory Aggregate Root
 * Manages inventory across multiple locations/warehouses
 */

export interface InventoryLocation {
  locationId: string;
  name: string;
  type: 'warehouse' | 'store' | 'supplier';
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isActive: boolean;
  priority: number; // For fulfillment priority
  metadata?: Record<string, any>;
}

export interface InventoryItem {
  inventoryId: string;
  productId: string;
  variantId?: string;
  locationId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number; // Quantity reserved for orders
  availableQuantity: number; // quantity - reservedQuantity
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestockedAt?: Date;
  lastCountedAt?: Date;
  cost?: number;
  supplierId?: string;
  binLocation?: string; // Physical location in warehouse
  expiryDate?: Date;
  batchNumber?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovement {
  movementId: string;
  inventoryId: string;
  productId: string;
  variantId?: string;
  locationId: string;
  type: 'inbound' | 'outbound' | 'transfer' | 'adjustment' | 'count';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceId?: string; // Order ID, Transfer ID, etc.
  referenceType?: string;
  performedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface InventoryTransfer {
  transferId: string;
  productId: string;
  variantId?: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  requestedBy: string;
  approvedBy?: string;
  shippedAt?: Date;
  receivedAt?: Date;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Inventory {
  private props: InventoryItem;

  private constructor(props: InventoryItem) {
    this.props = props;
  }

  static create(props: {
    inventoryId: string;
    productId: string;
    variantId?: string;
    locationId: string;
    sku: string;
    quantity?: number;
    lowStockThreshold?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    cost?: number;
    supplierId?: string;
    binLocation?: string;
    expiryDate?: Date;
    batchNumber?: string;
    metadata?: Record<string, any>;
  }): Inventory {
    const now = new Date();

    return new Inventory({
      inventoryId: props.inventoryId,
      productId: props.productId,
      variantId: props.variantId,
      locationId: props.locationId,
      sku: props.sku,
      quantity: props.quantity || 0,
      reservedQuantity: 0,
      availableQuantity: props.quantity || 0,
      lowStockThreshold: props.lowStockThreshold || 5,
      reorderPoint: props.reorderPoint || 10,
      reorderQuantity: props.reorderQuantity || 50,
      cost: props.cost,
      supplierId: props.supplierId,
      binLocation: props.binLocation,
      expiryDate: props.expiryDate,
      batchNumber: props.batchNumber,
      isActive: true,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: InventoryItem): Inventory {
    return new Inventory(props);
  }

  // Getters
  get inventoryId(): string { return this.props.inventoryId; }
  get productId(): string { return this.props.productId; }
  get variantId(): string | undefined { return this.props.variantId; }
  get locationId(): string { return this.props.locationId; }
  get sku(): string { return this.props.sku; }
  get quantity(): number { return this.props.quantity; }
  get reservedQuantity(): number { return this.props.reservedQuantity; }
  get availableQuantity(): number { return this.props.availableQuantity; }
  get lowStockThreshold(): number { return this.props.lowStockThreshold; }
  get reorderPoint(): number { return this.props.reorderPoint; }
  get reorderQuantity(): number { return this.props.reorderQuantity; }
  get cost(): number | undefined { return this.props.cost; }
  get supplierId(): string | undefined { return this.props.supplierId; }
  get binLocation(): string | undefined { return this.props.binLocation; }
  get expiryDate(): Date | undefined { return this.props.expiryDate; }
  get batchNumber(): string | undefined { return this.props.batchNumber; }
  get isActive(): boolean { return this.props.isActive; }
  get metadata(): Record<string, any> | undefined { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Computed properties
  get isInStock(): boolean {
    return this.props.availableQuantity > 0;
  }

  get isLowStock(): boolean {
    return this.props.availableQuantity <= this.props.lowStockThreshold;
  }

  get isOutOfStock(): boolean {
    return this.props.availableQuantity <= 0;
  }

  get needsReorder(): boolean {
    return this.props.quantity <= this.props.reorderPoint;
  }

  get isExpired(): boolean {
    return this.props.expiryDate ? this.props.expiryDate < new Date() : false;
  }

  // Domain methods
  updateQuantity(quantity: number, reason?: string, performedBy?: string): InventoryMovement {
    const movement: InventoryMovement = {
      movementId: '', // Will be set by repository
      inventoryId: this.props.inventoryId,
      productId: this.props.productId,
      variantId: this.props.variantId,
      locationId: this.props.locationId,
      type: 'adjustment',
      quantity: quantity - this.props.quantity,
      previousQuantity: this.props.quantity,
      newQuantity: quantity,
      reason,
      performedBy: performedBy || 'system',
      createdAt: new Date()
    };

    this.props.quantity = quantity;
    this.updateAvailableQuantity();
    this.touch();

    return movement;
  }

  adjustQuantity(adjustment: number, reason?: string, performedBy?: string): InventoryMovement {
    return this.updateQuantity(this.props.quantity + adjustment, reason, performedBy);
  }

  reserveQuantity(quantity: number, orderId?: string, performedBy?: string): boolean {
    if (this.props.availableQuantity < quantity) {
      return false;
    }

    this.props.reservedQuantity += quantity;
    this.updateAvailableQuantity();
    this.touch();

    // TODO: Create movement record
    return true;
  }

  releaseReservation(quantity: number, performedBy?: string): void {
    this.props.reservedQuantity = Math.max(0, this.props.reservedQuantity - quantity);
    this.updateAvailableQuantity();
    this.touch();
  }

  fulfillReservation(quantity: number, performedBy?: string): void {
    // Convert reservation to actual outbound
    this.props.reservedQuantity = Math.max(0, this.props.reservedQuantity - quantity);
    this.props.quantity -= quantity;
    this.updateAvailableQuantity();
    this.touch();
  }

  updateSettings(settings: {
    lowStockThreshold?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    cost?: number;
    supplierId?: string;
    binLocation?: string;
    expiryDate?: Date;
    batchNumber?: string;
  }): void {
    if (settings.lowStockThreshold !== undefined) this.props.lowStockThreshold = settings.lowStockThreshold;
    if (settings.reorderPoint !== undefined) this.props.reorderPoint = settings.reorderPoint;
    if (settings.reorderQuantity !== undefined) this.props.reorderQuantity = settings.reorderQuantity;
    if (settings.cost !== undefined) this.props.cost = settings.cost;
    if (settings.supplierId !== undefined) this.props.supplierId = settings.supplierId;
    if (settings.binLocation !== undefined) this.props.binLocation = settings.binLocation;
    if (settings.expiryDate !== undefined) this.props.expiryDate = settings.expiryDate;
    if (settings.batchNumber !== undefined) this.props.batchNumber = settings.batchNumber;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  private updateAvailableQuantity(): void {
    this.props.availableQuantity = Math.max(0, this.props.quantity - this.props.reservedQuantity);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      inventoryId: this.props.inventoryId,
      productId: this.props.productId,
      variantId: this.props.variantId,
      locationId: this.props.locationId,
      sku: this.props.sku,
      quantity: this.props.quantity,
      reservedQuantity: this.props.reservedQuantity,
      availableQuantity: this.props.availableQuantity,
      lowStockThreshold: this.props.lowStockThreshold,
      reorderPoint: this.props.reorderPoint,
      reorderQuantity: this.props.reorderQuantity,
      cost: this.props.cost,
      supplierId: this.props.supplierId,
      binLocation: this.props.binLocation,
      expiryDate: this.props.expiryDate?.toISOString(),
      batchNumber: this.props.batchNumber,
      isActive: this.props.isActive,
      metadata: this.props.metadata,
      isInStock: this.isInStock,
      isLowStock: this.isLowStock,
      isOutOfStock: this.isOutOfStock,
      needsReorder: this.needsReorder,
      isExpired: this.isExpired,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }
}
