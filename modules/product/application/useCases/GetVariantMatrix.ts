/**
 * Get Variant Matrix Use Case
 * Assembles the variant matrix for a configurable product:
 * variant rows joined with their pricing-owned base prices.
 */

import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { CatalogVariantOption, CatalogVariantWritePort } from '../ports/CatalogVariantPort';
import type { ProductPricingPort } from '../ports/ProductPricingPort';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';

// ============================================================================
// Response
// ============================================================================

export interface VariantMatrixRow {
  variantId: string;
  sku: string;
  name: string;
  priceCents: number | null;
  salePriceCents: number | null;
  compareAtPriceCents: number | null;
  currencyCode: string | null;
  inventory: number;
  isDefault: boolean;
  position: number;
  options: CatalogVariantOption[];
  isActive: boolean;
}

export interface VariantMatrixResponse {
  productId: string;
  productName: string;
  hasVariants: boolean;
  optionAxes: string[];
  variants: VariantMatrixRow[];
}

// ============================================================================
// Use Case
// ============================================================================

export class GetVariantMatrixUseCase {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly variantRepo: Pick<CatalogVariantWritePort, 'findByProductId'>,
    private readonly pricingPort: ProductPricingPort,
  ) {}

  async execute(productId: string): Promise<VariantMatrixResponse> {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const variants = await this.variantRepo.findByProductId(productId);

    // Variant prices come from the pricing-owned store (integer cents)
    const priceRows = await this.pricingPort.listProductPrices(productId);
    const productLevelPrice = priceRows.find(p => p.productVariantId == null) ?? null;
    const priceByVariantId = new Map(priceRows.filter(p => p.productVariantId != null).map(p => [p.productVariantId, p]));

    const matrix: VariantMatrixRow[] = variants.map(v => {
      const price = priceByVariantId.get(v.id) ?? productLevelPrice;
      return {
        variantId: v.id,
        sku: v.sku,
        name: v.name,
        priceCents: price?.priceCents ?? null,
        salePriceCents: price?.salePriceCents ?? null,
        compareAtPriceCents: price?.compareAtPriceCents ?? null,
        currencyCode: price?.currencyCode ?? null,
        inventory: v.inventory,
        isDefault: v.isDefault,
        position: v.position,
        options: v.options,
        isActive: v.isActive,
      };
    });

    const optionAxes = matrix.length > 0 ? [...new Set(matrix.flatMap(v => (v.options ?? []).map(o => o.name)))] : [];

    return { productId, productName: product.name, hasVariants: product.hasVariants, optionAxes, variants: matrix };
  }
}
