import type { BundleType, PricingType } from '../../domain/bundle';
import { BundleItemNotFoundError, BundleNotFoundError } from '../../domain/errors/ProductErrors';

export interface ProductBundleRecord {
  productBundleId: string;
  productId: string;
  name: string;
  isActive: boolean;
  bundleType?: BundleType;
  pricingType?: PricingType;
  slug?: string;
  description?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BundleItemRecord {
  bundleItemId?: string;
  productBundleId?: string;
  productId?: string;
  productVariantId?: string;
  slotName?: string;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  isRequired?: boolean;
  isDefault?: boolean;
  priceAdjustmentCents?: number;
  discountPercent?: number;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface BundlePricing {
  priceCents: number;
  savingsCents: number;
  savingsPercent: number;
}

interface BundlePort {
  getBundles(
    filters?: { bundleType?: BundleType; isActive?: boolean },
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: ProductBundleRecord[]; total: number }>;
  getBundle(productBundleId: string): Promise<ProductBundleRecord | null>;
  getBundleByProductId(productId: string): Promise<ProductBundleRecord | null>;
  getActiveBundles(): Promise<ProductBundleRecord[]>;
  saveBundle(bundle: Partial<ProductBundleRecord> & { productId: string; name: string }): Promise<ProductBundleRecord>;
  deleteBundle(productBundleId: string): Promise<void>;
  getBundleItem(bundleItemId: string): Promise<BundleItemRecord | null>;
  getBundleItems(productBundleId: string): Promise<BundleItemRecord[]>;
  saveBundleItem(item: Partial<BundleItemRecord> & { productBundleId: string; productId: string }): Promise<BundleItemRecord>;
  deleteBundleItem(bundleItemId: string): Promise<void>;
  calculateBundlePrice(
    productBundleId: string,
    selectedItems?: { productId: string; productVariantId?: string; quantity: number }[],
  ): Promise<BundlePricing>;
}

export class ManageBundlesUseCase {
  constructor(private readonly bundleRepo: BundlePort) {}

  async listBundles(
    filters?: { bundleType?: BundleType; isActive?: boolean },
    pagination?: { limit?: number; offset?: number },
  ) {
    return this.bundleRepo.getBundles(filters, pagination);
  }

  async getBundleWithItems(id: string) {
    const bundle = await this.bundleRepo.getBundle(id);
    if (!bundle) {
      throw new BundleNotFoundError();
    }
    const items = await this.bundleRepo.getBundleItems(id);
    return { ...bundle, items };
  }

  async createBundle(bundle: Partial<ProductBundleRecord> & { productId: string; name: string }) {
    return this.bundleRepo.saveBundle(bundle);
  }

  async updateBundle(id: string, updates: Partial<ProductBundleRecord>) {
    const existing = await this.bundleRepo.getBundle(id);
    if (!existing) {
      throw new BundleNotFoundError();
    }
    return this.bundleRepo.saveBundle({
      ...existing,
      productBundleId: id,
      ...updates,
    } as Parameters<BundlePort['saveBundle']>[0]);
  }

  async deleteBundle(id: string) {
    await this.bundleRepo.deleteBundle(id);
  }

  async addBundleItem(bundleId: string, item: Partial<BundleItemRecord> & { productId: string }) {
    return this.bundleRepo.saveBundleItem({ productBundleId: bundleId, ...item });
  }

  async updateBundleItem(bundleId: string, itemId: string, updates: Partial<BundleItemRecord>) {
    const existing = await this.bundleRepo.getBundleItem(itemId);
    if (!existing) {
      throw new BundleItemNotFoundError();
    }
    return this.bundleRepo.saveBundleItem({
      ...existing,
      bundleItemId: itemId,
      productBundleId: bundleId,
      ...updates,
    } as Parameters<BundlePort['saveBundleItem']>[0]);
  }

  async deleteBundleItem(itemId: string) {
    await this.bundleRepo.deleteBundleItem(itemId);
  }

  async listActiveBundles() {
    return this.bundleRepo.getActiveBundles();
  }

  async getActiveBundleDetails(id: string) {
    const bundle = await this.bundleRepo.getBundle(id);
    if (!bundle || !bundle.isActive) {
      throw new BundleNotFoundError();
    }
    const items = await this.bundleRepo.getBundleItems(id);
    const pricing = await this.bundleRepo.calculateBundlePrice(id);
    return { ...bundle, items, pricing };
  }

  async getActiveBundleForProduct(productId: string) {
    const bundle = await this.bundleRepo.getBundleByProductId(productId);
    if (!bundle || !bundle.isActive) {
      throw new BundleNotFoundError();
    }
    const items = await this.bundleRepo.getBundleItems(bundle.productBundleId);
    const pricing = await this.bundleRepo.calculateBundlePrice(bundle.productBundleId);
    return { ...bundle, items, pricing };
  }

  async calculatePrice(id: string, selectedItems?: { productId: string; productVariantId?: string; quantity: number }[]) {
    return this.bundleRepo.calculateBundlePrice(id, selectedItems);
  }
}
