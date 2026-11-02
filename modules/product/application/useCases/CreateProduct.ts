/**
 * Create Product Use Case
 * Creates a new product
 */

import { generateUUID } from '../../../../libs/uuid';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { Product } from '../../domain/entities/Product';
import { eventBus } from '../../../../libs/events/eventBus';
import type { ProductAttributeSetPort, DynamicAttributePort } from '../../domain/repositories/ProductCatalogPorts';
import type { ProductPricingPort } from '../ports/ProductPricingPort';
import { ProductSkuAlreadyExistsError, ProductSlugAlreadyExistsError, ProductValidationError } from '../../domain/errors/ProductErrors';
export interface CreateProductCommandProps {
  name: string;
  description: string;
  productTypeId: string;
  sku?: string;
  slug?: string;
  shortDescription?: string;
  categoryId?: string;
  organizationId?: string;
  /** Base price in integer cents — written to the pricing-owned store. */
  basePriceCents?: number;
  salePriceCents?: number;
  costPriceCents?: number;
  compareAtPriceCents?: number;
  currencyCode?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
  isFeatured?: boolean;
  isVirtual?: boolean;
  isDownloadable?: boolean;
  isSubscription?: boolean;
  isTaxable?: boolean;
  taxClass?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  isInventoryManaged?: boolean;
}

// ============================================================================
// Command
// ============================================================================

export class CreateProductCommand {
  public readonly name: string;
  public readonly description: string;
  public readonly productTypeId: string;
  public readonly sku?: string;
  public readonly slug?: string;
  public readonly shortDescription?: string;
  public readonly categoryId?: string;
  public readonly organizationId?: string;
  public readonly basePriceCents?: number;
  public readonly salePriceCents?: number;
  public readonly costPriceCents?: number;
  public readonly compareAtPriceCents?: number;
  public readonly currencyCode?: string;
  public readonly weight?: number;
  public readonly weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
  public readonly length?: number;
  public readonly width?: number;
  public readonly height?: number;
  public readonly dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
  public readonly isFeatured?: boolean;
  public readonly isVirtual?: boolean;
  public readonly isDownloadable?: boolean;
  public readonly isSubscription?: boolean;
  public readonly isTaxable?: boolean;
  public readonly taxClass?: string;
  public readonly metaTitle?: string;
  public readonly metaDescription?: string;
  public readonly metaKeywords?: string;
  public readonly tags?: string[];
  public readonly metadata?: Record<string, unknown>;
  public readonly isInventoryManaged?: boolean;

  constructor(props: CreateProductCommandProps) {
    this.name = props.name;
    this.description = props.description;
    this.productTypeId = props.productTypeId;
    this.sku = props.sku;
    this.slug = props.slug;
    this.shortDescription = props.shortDescription;
    this.categoryId = props.categoryId;
    this.organizationId = props.organizationId;
    this.basePriceCents = props.basePriceCents;
    this.salePriceCents = props.salePriceCents;
    this.costPriceCents = props.costPriceCents;
    this.compareAtPriceCents = props.compareAtPriceCents;
    this.currencyCode = props.currencyCode;
    this.weight = props.weight;
    this.weightUnit = props.weightUnit;
    this.length = props.length;
    this.width = props.width;
    this.height = props.height;
    this.dimensionUnit = props.dimensionUnit;
    this.isFeatured = props.isFeatured;
    this.isVirtual = props.isVirtual;
    this.isDownloadable = props.isDownloadable;
    this.isSubscription = props.isSubscription;
    this.isTaxable = props.isTaxable;
    this.taxClass = props.taxClass;
    this.metaTitle = props.metaTitle;
    this.metaDescription = props.metaDescription;
    this.metaKeywords = props.metaKeywords;
    this.tags = props.tags;
    this.metadata = props.metadata;
    this.isInventoryManaged = props.isInventoryManaged;
  }
}

// ============================================================================
// Response
// ============================================================================

export interface CreateProductResponse {
  productId: string;
  name: string;
  slug: string;
  sku?: string;
  productTypeId?: string | null;
  status: string;
  visibility: string;
  basePriceCents: number | null;
  effectivePriceCents: number | null;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly attributeSetRepo: ProductAttributeSetPort,
    private readonly dynamicAttrRepo: DynamicAttributePort,
    private readonly pricingPort: ProductPricingPort,
  ) {}

  async execute(command: CreateProductCommand): Promise<CreateProductResponse> {
    // Validate command
    if (!command.name?.trim()) {
      throw new ProductValidationError('Product name is required');
    }
    if (!command.productTypeId) {
      throw new ProductValidationError('Product type is required');
    }

    await this.assertUniqueSkuAndSlug(command);

    const productId = generateUUID();

    // Create product using domain entity
    const product = Product.create({
      productId,
      name: command.name,
      description: command.description,
      productTypeId: command.productTypeId,
      sku: command.sku,
      slug: command.slug,
      shortDescription: command.shortDescription,
      categoryId: command.categoryId,
      organizationId: command.organizationId,
      weight: command.weight,
      weightUnit: command.weightUnit,
      length: command.length,
      width: command.width,
      height: command.height,
      dimensionUnit: command.dimensionUnit,
      isFeatured: command.isFeatured,
      isVirtual: command.isVirtual,
      isDownloadable: command.isDownloadable,
      isSubscription: command.isSubscription,
      isTaxable: command.isTaxable,
      isInventoryManaged: command.isInventoryManaged,
      taxClass: command.taxClass,
      metaTitle: command.metaTitle,
      metaDescription: command.metaDescription,
      metaKeywords: command.metaKeywords,
      tags: command.tags,
      metadata: command.metadata,
    });

    // Save product
    const savedProduct = await this.productRepository.save(product);

    // Persist the base price in the pricing-owned store when provided
    const savedPrice = await this.persistBasePrice(command, savedProduct.productId);

    // Auto-assign attributes from the product type's attribute sets
    await this.autoAssignAttributes(command.productTypeId, savedProduct.productId);

    // Emit event
    eventBus.emit('product.created', {
      productId: savedProduct.productId,
      name: savedProduct.name,
      sku: savedProduct.sku,
      categoryId: savedProduct.categoryId,
      organizationId: savedProduct.organizationId,
    });

    return this.mapToResponse(savedProduct, savedPrice);
  }

  private async assertUniqueSkuAndSlug(command: CreateProductCommand): Promise<void> {
    // Check for duplicate SKU
    if (command.sku) {
      const existingProduct = await this.productRepository.findBySku(command.sku);
      if (existingProduct) {
        throw new ProductSkuAlreadyExistsError(command.sku);
      }
    }

    // Check for duplicate slug
    const slug = command.slug || Product.generateSlug(command.name);
    const existingBySlug = await this.productRepository.findBySlug(slug);
    if (existingBySlug) {
      throw new ProductSlugAlreadyExistsError(slug);
    }
  }

  private async persistBasePrice(
    command: CreateProductCommand,
    productId: string,
  ): Promise<{ priceCents: number; salePriceCents: number | null } | null> {
    if (command.basePriceCents === undefined) return null;
    this.assertPriceValues(command, command.basePriceCents);
    const row = await this.pricingPort.setBasePrice({
      productId,
      currencyCode: command.currencyCode || 'USD',
      priceCents: command.basePriceCents,
      salePriceCents: command.salePriceCents ?? null,
      costPriceCents: command.costPriceCents ?? null,
      compareAtPriceCents: command.compareAtPriceCents ?? null,
    });
    return { priceCents: row.priceCents, salePriceCents: row.salePriceCents };
  }

  private assertPriceValues(command: CreateProductCommand, basePriceCents: number): void {
    if (!Number.isInteger(basePriceCents) || basePriceCents < 0) {
      throw new ProductValidationError('basePriceCents must be a non-negative integer');
    }
    for (const [field, value] of Object.entries({
      salePriceCents: command.salePriceCents,
      costPriceCents: command.costPriceCents,
      compareAtPriceCents: command.compareAtPriceCents,
    })) {
      if (value !== undefined && value !== null && (!Number.isInteger(value) || value < 0)) {
        throw new ProductValidationError(`${field} must be a non-negative integer`);
      }
    }
    if (command.salePriceCents !== undefined && command.salePriceCents !== null && command.salePriceCents > basePriceCents) {
      throw new ProductValidationError('salePriceCents cannot exceed basePriceCents');
    }
  }

  private async autoAssignAttributes(productTypeId: string, productId: string): Promise<void> {
    try {
      const attributes = await this.attributeSetRepo.getAttributesForProductType(productTypeId);
      if (attributes.length > 0) {
        const attrsToSet = attributes
          .filter(attr => attr.isRequired)
          .map(attr => ({
            attributeId: attr.productAttributeId,
            value: attr.defaultValue || '',
          }));
        if (attrsToSet.length > 0) {
          await this.dynamicAttrRepo.setProductAttributes(productId, attrsToSet);
        }
      }
    } catch {
      // Auto-assignment is best-effort; don't fail product creation if it errors
    }
  }

  private mapToResponse(product: Product, price: { priceCents: number; salePriceCents: number | null } | null): CreateProductResponse {
    return {
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      productTypeId: product.productTypeId,
      status: product.status,
      visibility: product.visibility,
      basePriceCents: price?.priceCents ?? null,
      effectivePriceCents: price ? (price.salePriceCents ?? price.priceCents) : null,
      createdAt: product.createdAt.toISOString(),
    };
  }
}
