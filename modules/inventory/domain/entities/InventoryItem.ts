/**
 * Inventory Item Aggregate Root
 */

export type TransactionType = 'restock' | 'sale' | 'return' | 'adjustment' | 'transfer' | 'reservation' | 'release';

import { InventoryValidationError, InvalidStockQuantityError, InsufficientStockError } from '../errors/InventoryErrors';

export interface InventoryItemProps {
  inventoryId: string;
  productId: string;
  variantId?: string;
  sku: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestockAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class InventoryItem {
  private props: InventoryItemProps;

  private constructor(props: InventoryItemProps) {
    this.props = props;
  }

  static create(props: {
    inventoryId: string;
    productId: string;
    variantId?: string;
    sku: string;
    locationId: string;
    quantity?: number;
    lowStockThreshold?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    metadata?: Record<string, unknown>;
  }): InventoryItem {
    const now = new Date();
    return new InventoryItem({
      inventoryId: props.inventoryId,
      productId: props.productId,
      variantId: props.variantId,
      sku: props.sku,
      locationId: props.locationId,
      quantity: props.quantity || 0,
      reservedQuantity: 0,
      lowStockThreshold: props.lowStockThreshold || 5,
      reorderPoint: props.reorderPoint || 10,
      reorderQuantity: props.reorderQuantity || 50,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: InventoryItemProps): InventoryItem {
    return new InventoryItem(props);
  }

  // Getters
  get inventoryId(): string {
    return this.props.inventoryId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get variantId(): string | undefined {
    return this.props.variantId;
  }
  get sku(): string {
    return this.props.sku;
  }
  get locationId(): string {
    return this.props.locationId;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get reservedQuantity(): number {
    return this.props.reservedQuantity;
  }
  get lowStockThreshold(): number {
    return this.props.lowStockThreshold;
  }
  get reorderPoint(): number {
    return this.props.reorderPoint;
  }
  get reorderQuantity(): number {
    return this.props.reorderQuantity;
  }
  get lastRestockAt(): Date | undefined {
    return this.props.lastRestockAt;
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
  get availableQuantity(): number {
    return Math.max(0, this.props.quantity - this.props.reservedQuantity);
  }
  get isLowStock(): boolean {
    return this.availableQuantity <= this.props.lowStockThreshold;
  }
  get isOutOfStock(): boolean {
    return this.availableQuantity <= 0;
  }
  get needsReorder(): boolean {
    return this.availableQuantity <= this.props.reorderPoint;
  }

  // Domain methods
  restock(quantity: number): void {
    if (quantity <= 0) throw new InventoryValidationError('Restock quantity must be positive');
    this.props.quantity += quantity;
    this.props.lastRestockAt = new Date();
    this.touch();
  }

  sell(quantity: number): void {
    if (quantity > this.availableQuantity) {
      throw new InsufficientStockError(this.props.sku, quantity, this.availableQuantity);
    }
    this.props.quantity -= quantity;
    this.touch();
  }

  returnStock(quantity: number): void {
    if (quantity <= 0) throw new InventoryValidationError('Return quantity must be positive');
    this.props.quantity += quantity;
    this.touch();
  }

  adjust(newQuantity: number): void {
    if (newQuantity < 0) throw new InvalidStockQuantityError(newQuantity);
    if (newQuantity < this.props.reservedQuantity) {
      throw new InventoryValidationError('Cannot adjust below reserved quantity');
    }
    this.props.quantity = newQuantity;
    this.touch();
  }

  reserve(quantity: number): void {
    if (quantity > this.availableQuantity) {
      throw new InsufficientStockError(this.props.sku, quantity, this.availableQuantity);
    }
    this.props.reservedQuantity += quantity;
    this.touch();
  }

  releaseReservation(quantity: number): void {
    this.props.reservedQuantity = Math.max(0, this.props.reservedQuantity - quantity);
    this.touch();
  }

  fulfillReservation(quantity: number): void {
    this.props.reservedQuantity = Math.max(0, this.props.reservedQuantity - quantity);
    this.props.quantity -= quantity;
    this.touch();
  }

  updateThresholds(thresholds: { lowStockThreshold?: number; reorderPoint?: number; reorderQuantity?: number }): void {
    if (thresholds.lowStockThreshold !== undefined) {
      this.props.lowStockThreshold = thresholds.lowStockThreshold;
    }
    if (thresholds.reorderPoint !== undefined) {
      this.props.reorderPoint = thresholds.reorderPoint;
    }
    if (thresholds.reorderQuantity !== undefined) {
      this.props.reorderQuantity = thresholds.reorderQuantity;
    }
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      inventoryId: this.props.inventoryId,
      productId: this.props.productId,
      variantId: this.props.variantId,
      sku: this.props.sku,
      locationId: this.props.locationId,
      quantity: this.props.quantity,
      reservedQuantity: this.props.reservedQuantity,
      availableQuantity: this.availableQuantity,
      lowStockThreshold: this.props.lowStockThreshold,
      reorderPoint: this.props.reorderPoint,
      reorderQuantity: this.props.reorderQuantity,
      isLowStock: this.isLowStock,
      isOutOfStock: this.isOutOfStock,
      needsReorder: this.needsReorder,
      lastRestockAt: this.props.lastRestockAt?.toISOString(),
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
