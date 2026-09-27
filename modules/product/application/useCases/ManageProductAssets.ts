import {
  ProductDownloadNotFoundError,
  ProductImageNotFoundError,
  ProductRelationshipNotFoundError,
  ProductValidationError,
} from '../../domain/errors/ProductErrors';

interface ProductImageRecord {
  productImageId?: string;
  productId?: string;
  url?: string;
  position?: number;
  isPrimary?: boolean;
  productVariantId?: string | null;
  alt?: string | null;
  title?: string | null;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  type?: string | null;
  isVisible?: boolean | null;
}

export interface ProductImageCreateProps {
  productId: string;
  url: string;
  position: number;
  isPrimary: boolean;
  productVariantId?: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  size?: number;
  type?: string;
  isVisible?: boolean;
}

export interface ProductImageUpdateProps {
  url?: string;
  position?: number;
  isPrimary?: boolean;
  productVariantId?: string;
  alt?: string;
  altText?: string;
  title?: string;
  width?: number;
  height?: number;
  size?: number;
  type?: string;
  isVisible?: boolean;
}

interface ProductImagePort {
  findByProductId(productId: string): Promise<ProductImageRecord[]>;
  create(props: ProductImageCreateProps): Promise<ProductImageRecord>;
  update(id: string, props: ProductImageUpdateProps): Promise<ProductImageRecord>;
  delete(id: string): Promise<boolean>;
  reorder(productId: string, imageIds: string[]): Promise<boolean>;
}

export class ManageProductImagesUseCase {
  constructor(private readonly imageRepo: ProductImagePort) {}

  async listForProduct(productId: string) {
    return this.imageRepo.findByProductId(productId);
  }

  async create(productId: string, input: { url?: string } & Partial<ProductImageCreateProps>) {
    return this.imageRepo.create({
      productId,
      url: input.url as string,
      position: input.position ?? 0,
      isPrimary: input.isPrimary ?? false,
      productVariantId: input.productVariantId,
      alt: input.alt,
      title: input.title,
      width: input.width,
      height: input.height,
      size: input.size,
      type: input.type,
      isVisible: input.isVisible,
    });
  }

  async update(imageId: string, input: ProductImageUpdateProps) {
    const image = await this.imageRepo.update(imageId, input);
    if (!image) {
      throw new ProductImageNotFoundError(imageId);
    }
    return image;
  }

  async delete(imageId: string) {
    await this.imageRepo.delete(imageId);
  }

  async reorder(productId: string, imageIds: unknown) {
    if (!Array.isArray(imageIds)) {
      throw new ProductValidationError('imageIds must be an array');
    }
    await this.imageRepo.reorder(productId, imageIds);
  }
}

interface ProductDownloadRecord {
  productDownloadId?: string;
  productId?: string;
  productVariantId?: string;
  name?: string;
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  maxDownloads?: number;
  daysValid?: number;
  isActive?: boolean;
  sampleUrl?: string;
  sortOrder?: number;
}

export interface ProductDownloadCreateProps {
  productId: string;
  productVariantId?: string;
  name: string;
  fileUrl: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  maxDownloads?: number;
  daysValid?: number;
  isActive: boolean;
  sampleUrl?: string;
  sortOrder: number;
}

export interface ProductDownloadUpdateProps {
  name?: string;
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  maxDownloads?: number;
  daysValid?: number;
  isActive?: boolean;
  sampleUrl?: string;
  sortOrder?: number;
  productVariantId?: string;
}

interface ProductDownloadPort {
  findByProductId(productId: string, productVariantId?: string, activeOnly?: boolean): Promise<ProductDownloadRecord[]>;
  create(params: ProductDownloadCreateProps): Promise<ProductDownloadRecord>;
  update(id: string, params: ProductDownloadUpdateProps): Promise<ProductDownloadRecord | null>;
  delete(id: string): Promise<boolean>;
}

export class ManageProductDownloadsUseCase {
  constructor(private readonly downloadRepo: ProductDownloadPort) {}

  async listForProduct(productId: string, activeOnly?: boolean) {
    return this.downloadRepo.findByProductId(productId, undefined, activeOnly);
  }

  async create(productId: string, input: { name?: string; fileUrl?: string } & Partial<ProductDownloadCreateProps>) {
    if (!input.name?.trim()) {
      throw new ProductValidationError('name is required');
    }
    if (!input.fileUrl?.trim()) {
      throw new ProductValidationError('fileUrl is required');
    }
    return this.downloadRepo.create({
      ...input,
      productId,
      name: input.name,
      fileUrl: input.fileUrl,
      isActive: input.isActive !== false,
      sortOrder: input.sortOrder || 0,
    });
  }

  async update(downloadId: string, input: ProductDownloadUpdateProps) {
    const updated = await this.downloadRepo.update(downloadId, input);
    if (!updated) {
      throw new ProductDownloadNotFoundError(downloadId);
    }
    return updated;
  }

  async delete(downloadId: string) {
    const deleted = await this.downloadRepo.delete(downloadId);
    if (!deleted) {
      throw new ProductDownloadNotFoundError(downloadId);
    }
  }
}

import type { ProductRelationType } from '../../domain/entities/ProductRelationship';
import type { ProductRelationshipRepository } from '../../domain/repositories/ProductRelationshipRepository';
import { PRODUCT_RELATION_TYPES } from '../../domain/entities/ProductRelationship';

export type { ProductRelationType };

interface ProductOwnershipLookup {
  /**
   * Owning organization of a product: `undefined` when the product does not
   * exist, `null` when it exists but has no organization (legacy/platform rows).
   */
  getOrganizationId(productId: string): Promise<string | null | undefined>;
}

export class ManageProductRelationshipsUseCase {
  constructor(
    private readonly relationshipRepo: ProductRelationshipRepository,
    private readonly productLookup?: ProductOwnershipLookup,
  ) {}

  async listForProduct(productId: string, type?: ProductRelationType) {
    return this.relationshipRepo.findByProductId(productId, type);
  }

  async create(
    productId: string,
    input: { relatedProductId?: string; type?: string; position?: number; isAutomated?: boolean; bidirectional?: boolean },
  ) {
    if (!input.relatedProductId) {
      throw new ProductValidationError('relatedProductId is required');
    }
    if (!input.type || !PRODUCT_RELATION_TYPES.includes(input.type as ProductRelationType)) {
      throw new ProductValidationError('type is required (related, accessory, cross_sell, up_sell, grouped)');
    }
    await this.assertSameOrganization(productId, input.relatedProductId);

    if (input.bidirectional) {
      return this.relationshipRepo.createBidirectional(productId, input.relatedProductId, input.type as ProductRelationType);
    }
    return this.relationshipRepo.create({
      productId,
      relatedProductId: input.relatedProductId,
      type: input.type as ProductRelationType,
      position: input.position || 0,
      isAutomated: input.isAutomated || false,
    });
  }

  async reorder(updates: Array<{ productRelatedId?: string; position?: number }>) {
    const sanitized = updates
      .filter((u): u is { productRelatedId: string; position: number } => !!u.productRelatedId && typeof u.position === 'number')
      .map(u => ({ productRelatedId: u.productRelatedId, position: u.position }));
    if (sanitized.length === 0) {
      throw new ProductValidationError('At least one { productRelatedId, position } pair is required');
    }
    return this.relationshipRepo.bulkReorder(sanitized);
  }

  /** Reject links across organizations — relationships must stay within a tenant. */
  private async assertSameOrganization(productId: string, relatedProductId: string): Promise<void> {
    if (!this.productLookup) return;
    const [sourceOrg, targetOrg] = await Promise.all([
      this.productLookup.getOrganizationId(productId),
      this.productLookup.getOrganizationId(relatedProductId),
    ]);
    if (targetOrg === undefined) {
      throw new ProductValidationError('relatedProductId does not reference an existing product');
    }
    if (sourceOrg && targetOrg && sourceOrg !== targetOrg) {
      throw new ProductValidationError('Cannot link products from different organizations');
    }
  }

  async delete(relationshipId: string) {
    const deleted = await this.relationshipRepo.delete(relationshipId);
    if (!deleted) {
      throw new ProductRelationshipNotFoundError(relationshipId);
    }
  }
}

interface ProductVariantRecordPort {
  findById(variantId: string): Promise<unknown>;
  findByProductId(productId: string): Promise<unknown[]>;
  delete(variantId: string): Promise<unknown>;
}

export class ManageProductVariantsUseCase {
  constructor(private readonly variantRepo: ProductVariantRecordPort) {}

  async listForProduct(productId: string) {
    return this.variantRepo.findByProductId(productId);
  }

  async findById(variantId: string) {
    return this.variantRepo.findById(variantId);
  }

  async delete(variantId: string) {
    await this.variantRepo.delete(variantId);
  }
}
