/**
 * Bundle Domain Types
 * Defines the domain model for product bundles
 */

import { ProductValidationError } from './errors/ProductErrors';

export type BundleType = 'fixed' | 'customizable' | 'mix_and_match';
export type PricingType = 'fixed' | 'calculated' | 'percentage_discount';

export interface BundleItemProps {
  bundleItemId: string;
  productBundleId: string;
  productId: string;
  productVariantId?: string;
  slotName?: string;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  isRequired: boolean;
  isDefault: boolean;
  priceAdjustmentCents: number;
  discountPercent: number;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BundleProps {
  productBundleId: string;
  productId: string;
  name: string;
  slug?: string;
  description?: string;
  bundleType: BundleType;
  pricingType: PricingType;
  fixedPriceCents?: number;
  discountPercent?: number;
  discountAmountCents?: number;
  minPriceCents?: number;
  maxPriceCents?: number;
  currency: string;
  minItems?: number;
  maxItems?: number;
  minQuantity: number;
  maxQuantity?: number;
  requireAllItems: boolean;
  allowDuplicates: boolean;
  showSavings: boolean;
  savingsAmountCents?: number;
  savingsPercent?: number;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  items: BundleItemProps[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Bundle {
  private props: BundleProps;

  private constructor(props: BundleProps) {
    this.props = props;
  }

  static create(props: Omit<BundleProps, 'createdAt' | 'updatedAt' | 'items'> & { items?: BundleItemProps[] }): Bundle {
    const now = new Date();
    return new Bundle({
      ...props,
      items: props.items || [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: BundleProps): Bundle {
    return new Bundle(props);
  }

  get productBundleId(): string {
    return this.props.productBundleId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string | undefined {
    return this.props.slug;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get bundleType(): BundleType {
    return this.props.bundleType;
  }
  get pricingType(): PricingType {
    return this.props.pricingType;
  }
  get fixedPriceCents(): number | undefined {
    return this.props.fixedPriceCents;
  }
  get currency(): string {
    return this.props.currency;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get items(): BundleItemProps[] {
    return [...this.props.items];
  }
  get requireAllItems(): boolean {
    return this.props.requireAllItems;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get requiredItemCount(): number {
    return this.props.items.filter(i => i.isRequired).length;
  }

  get totalItemCount(): number {
    return this.props.items.length;
  }

  get isAvailable(): boolean {
    if (!this.props.isActive) return false;
    const now = new Date();
    if (this.props.startDate && now < this.props.startDate) return false;
    if (this.props.endDate && now > this.props.endDate) return false;
    return true;
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  updateInfo(updates: { name?: string; description?: string; slug?: string }): void {
    if (updates.name) this.props.name = updates.name;
    if (updates.description !== undefined) this.props.description = updates.description;
    if (updates.slug !== undefined) this.props.slug = updates.slug;
    this.touch();
  }

  updatePricing(pricing: { pricingType?: PricingType; fixedPriceCents?: number; discountPercent?: number; discountAmountCents?: number }): void {
    if (pricing.pricingType) this.props.pricingType = pricing.pricingType;
    if (pricing.fixedPriceCents !== undefined) this.props.fixedPriceCents = pricing.fixedPriceCents;
    if (pricing.discountPercent !== undefined) this.props.discountPercent = pricing.discountPercent;
    if (pricing.discountAmountCents !== undefined) this.props.discountAmountCents = pricing.discountAmountCents;
    this.touch();
  }

  addItem(item: BundleItemProps): void {
    if (!this.props.allowDuplicates) {
      const exists = this.props.items.find(i => i.productId === item.productId && i.productVariantId === item.productVariantId);
      if (exists) {
        throw new ProductValidationError('Duplicate items not allowed in this bundle');
      }
    }
    if (this.props.maxItems && this.props.items.length >= this.props.maxItems) {
      throw new ProductValidationError(`Bundle cannot exceed ${this.props.maxItems} items`);
    }
    this.props.items.push(item);
    this.touch();
  }

  removeItem(bundleItemId: string): void {
    const index = this.props.items.findIndex(i => i.bundleItemId === bundleItemId);
    if (index === -1) throw new ProductValidationError('Bundle item not found');
    const item = this.props.items[index];
    if (item.isRequired && this.props.requireAllItems) {
      throw new ProductValidationError('Cannot remove a required item from this bundle');
    }
    this.props.items.splice(index, 1);
    this.touch();
  }

  calculatePrice(itemPriceCents: Map<string, number>): number {
    if (this.props.pricingType === 'fixed' && this.props.fixedPriceCents !== undefined) {
      return this.props.fixedPriceCents;
    }

    let total = 0;
    for (const item of this.props.items) {
      const basePriceCents = itemPriceCents.get(item.productId) || 0;
      const adjustedPriceCents = basePriceCents + item.priceAdjustmentCents;
      const discountedCents = adjustedPriceCents * (1 - item.discountPercent / 100);
      total += discountedCents * item.quantity;
    }

    if (this.props.pricingType === 'percentage_discount' && this.props.discountPercent) {
      total = total * (1 - this.props.discountPercent / 100);
    }

    if (this.props.minPriceCents && total < this.props.minPriceCents) total = this.props.minPriceCents;
    if (this.props.maxPriceCents && total > this.props.maxPriceCents) total = this.props.maxPriceCents;

    return Math.round(total);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props, items: this.props.items.map(i => ({ ...i })) };
  }
}
