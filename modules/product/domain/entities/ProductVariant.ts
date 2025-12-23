/**
 * Product Variant Entity
 * Represents a specific variation of a product
 */

import { Price } from '../valueObjects/Price';
import { Dimensions } from '../valueObjects/Dimensions';

export interface VariantAttribute {
  attributeId: string;
  attributeName: string;
  value: string;
  displayValue?: string;
}

export interface ProductVariantProps {
  variantId: string;
  productId: string;
  sku: string;
  name: string;
  price: Price;
  dimensions: Dimensions;
  attributes: VariantAttribute[];
  imageId?: string;
  imageUrl?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isDefault: boolean;
  isActive: boolean;
  position: number;
  barcode?: string;
  externalId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductVariant {
  private props: ProductVariantProps;

  private constructor(props: ProductVariantProps) {
    this.props = props;
  }

  static create(props: {
    variantId: string;
    productId: string;
    sku: string;
    name?: string;
    basePrice: number;
    salePrice?: number;
    cost?: number;
    currencyCode?: string;
    attributes: VariantAttribute[];
    weight?: number;
    weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
    imageId?: string;
    imageUrl?: string;
    stockQuantity?: number;
    lowStockThreshold?: number;
    isDefault?: boolean;
    position?: number;
    barcode?: string;
    externalId?: string;
    metadata?: Record<string, any>;
  }): ProductVariant {
    const now = new Date();
    const variantName = props.name || ProductVariant.generateName(props.attributes);

    return new ProductVariant({
      variantId: props.variantId,
      productId: props.productId,
      sku: props.sku,
      name: variantName,
      price: Price.create(props.basePrice, props.currencyCode || 'USD', props.salePrice, props.cost),
      dimensions: Dimensions.create({
        weight: props.weight,
        weightUnit: props.weightUnit,
        length: props.length,
        width: props.width,
        height: props.height,
        dimensionUnit: props.dimensionUnit,
      }),
      attributes: props.attributes,
      imageId: props.imageId,
      imageUrl: props.imageUrl,
      stockQuantity: props.stockQuantity || 0,
      lowStockThreshold: props.lowStockThreshold || 5,
      isDefault: props.isDefault || false,
      isActive: true,
      position: props.position || 0,
      barcode: props.barcode,
      externalId: props.externalId,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }

  // Getters
  get variantId(): string {
    return this.props.variantId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get sku(): string {
    return this.props.sku;
  }
  get name(): string {
    return this.props.name;
  }
  get price(): Price {
    return this.props.price;
  }
  get dimensions(): Dimensions {
    return this.props.dimensions;
  }
  get attributes(): VariantAttribute[] {
    return [...this.props.attributes];
  }
  get imageId(): string | undefined {
    return this.props.imageId;
  }
  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }
  get stockQuantity(): number {
    return this.props.stockQuantity;
  }
  get lowStockThreshold(): number {
    return this.props.lowStockThreshold;
  }
  get isDefault(): boolean {
    return this.props.isDefault;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get position(): number {
    return this.props.position;
  }
  get barcode(): string | undefined {
    return this.props.barcode;
  }
  get externalId(): string | undefined {
    return this.props.externalId;
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

  // Computed properties
  get isInStock(): boolean {
    return this.props.stockQuantity > 0;
  }

  get isLowStock(): boolean {
    return this.props.stockQuantity > 0 && this.props.stockQuantity <= this.props.lowStockThreshold;
  }

  get isOutOfStock(): boolean {
    return this.props.stockQuantity <= 0;
  }

  get effectivePrice(): number {
    return this.props.price.effectivePrice;
  }

  get attributeString(): string {
    return this.props.attributes.map(attr => `${attr.attributeName}: ${attr.displayValue || attr.value}`).join(', ');
  }

  // Domain methods
  updatePrice(basePrice: number, salePrice?: number, cost?: number): void {
    this.props.price = Price.create(basePrice, this.props.price.currency, salePrice, cost);
    this.touch();
  }

  setSalePrice(salePrice: number | null): void {
    this.props.price = this.props.price.setSalePrice(salePrice);
    this.touch();
  }

  updateDimensions(dimensions: {
    weight?: number;
    weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
  }): void {
    this.props.dimensions = Dimensions.create(dimensions);
    this.touch();
  }

  updateStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }
    this.props.stockQuantity = quantity;
    this.touch();
  }

  incrementStock(amount: number): void {
    this.props.stockQuantity += amount;
    this.touch();
  }

  decrementStock(amount: number): void {
    if (this.props.stockQuantity - amount < 0) {
      throw new Error('Insufficient stock');
    }
    this.props.stockQuantity -= amount;
    this.touch();
  }

  setLowStockThreshold(threshold: number): void {
    if (threshold < 0) {
      throw new Error('Threshold cannot be negative');
    }
    this.props.lowStockThreshold = threshold;
    this.touch();
  }

  updateSku(sku: string): void {
    this.props.sku = sku;
    this.touch();
  }

  updateBarcode(barcode: string): void {
    this.props.barcode = barcode;
    this.touch();
  }

  setImage(imageId: string, imageUrl?: string): void {
    this.props.imageId = imageId;
    this.props.imageUrl = imageUrl;
    this.touch();
  }

  removeImage(): void {
    this.props.imageId = undefined;
    this.props.imageUrl = undefined;
    this.touch();
  }

  setAsDefault(): void {
    this.props.isDefault = true;
    this.touch();
  }

  unsetDefault(): void {
    this.props.isDefault = false;
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  updatePosition(position: number): void {
    this.props.position = position;
    this.touch();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static generateName(attributes: VariantAttribute[]): string {
    return attributes.map(attr => attr.displayValue || attr.value).join(' / ');
  }

  toJSON(): Record<string, any> {
    return {
      variantId: this.props.variantId,
      productId: this.props.productId,
      sku: this.props.sku,
      name: this.props.name,
      price: this.props.price.toJSON(),
      dimensions: this.props.dimensions.toJSON(),
      attributes: this.props.attributes,
      attributeString: this.attributeString,
      imageId: this.props.imageId,
      imageUrl: this.props.imageUrl,
      stockQuantity: this.props.stockQuantity,
      lowStockThreshold: this.props.lowStockThreshold,
      isInStock: this.isInStock,
      isLowStock: this.isLowStock,
      isOutOfStock: this.isOutOfStock,
      isDefault: this.props.isDefault,
      isActive: this.props.isActive,
      position: this.props.position,
      barcode: this.props.barcode,
      externalId: this.props.externalId,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
