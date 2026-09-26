/**
 * Update Catalog Variant Use Case
 * Updates an options-based variant row and, when price fields are given,
 * writes the variant-level base price to the pricing-owned store.
 */

import type { CatalogVariantUpdateParams, CatalogVariantWritePort } from '../ports/CatalogVariantPort';
import type { ProductPricingPort } from '../ports/ProductPricingPort';
import type { CatalogVariantWithPrice } from './CreateCatalogVariant';

// ============================================================================
// Command
// ============================================================================

export class UpdateCatalogVariantCommand {
  constructor(
    public readonly productId: string,
    public readonly variantId: string,
    public readonly variantFields: CatalogVariantUpdateParams,
    public readonly priceCents?: number,
    public readonly salePriceCents?: number,
    public readonly compareAtPriceCents?: number,
    public readonly costPriceCents?: number,
    public readonly currencyCode?: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdateCatalogVariantUseCase {
  constructor(
    private readonly variantRepo: CatalogVariantWritePort,
    private readonly pricingPort: ProductPricingPort,
  ) {}

  async execute(command: UpdateCatalogVariantCommand): Promise<CatalogVariantWithPrice> {
    const variant = await this.variantRepo.update(command.variantId, command.variantFields);
    const productId = command.productId || variant.productId;

    const hasPriceInput =
      command.priceCents !== undefined ||
      command.salePriceCents !== undefined ||
      command.compareAtPriceCents !== undefined ||
      command.costPriceCents !== undefined;
    if (!hasPriceInput) {
      return { ...variant };
    }

    const existing = await this.pricingPort.getBasePrice(productId, command.variantId);
    const price = await this.pricingPort.setBasePrice({
      productId,
      productVariantId: command.variantId,
      currencyCode: command.currencyCode ?? existing?.currencyCode ?? 'USD',
      priceCents: command.priceCents ?? existing?.priceCents ?? 0,
      salePriceCents: command.salePriceCents !== undefined ? command.salePriceCents : (existing?.salePriceCents ?? null),
      compareAtPriceCents:
        command.compareAtPriceCents !== undefined ? command.compareAtPriceCents : (existing?.compareAtPriceCents ?? null),
      costPriceCents: command.costPriceCents !== undefined ? command.costPriceCents : (existing?.costPriceCents ?? null),
    });

    return { ...variant, priceCents: price.priceCents };
  }
}
