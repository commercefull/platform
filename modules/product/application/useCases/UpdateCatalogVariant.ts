/**
 * Update Catalog Variant Use Case
 * Updates an options-based variant row and, when price fields are given,
 * writes the variant-level base price to the pricing-owned store.
 */

import type { CatalogVariantUpdateParams, CatalogVariantWritePort } from '../ports/CatalogVariantPort';
import type { ProductPricingPort } from '../ports/ProductPricingPort';
import type { CatalogVariantWithPrice } from './CreateCatalogVariant';
export interface UpdateCatalogVariantCommandProps {
  productId: string;
  variantId: string;
  variantFields: CatalogVariantUpdateParams;
  priceCents?: number;
  salePriceCents?: number;
  compareAtPriceCents?: number;
  costPriceCents?: number;
  currencyCode?: string;
}

// ============================================================================
// Command
// ============================================================================

export class UpdateCatalogVariantCommand {
  public readonly productId: string;
  public readonly variantId: string;
  public readonly variantFields: CatalogVariantUpdateParams;
  public readonly priceCents?: number;
  public readonly salePriceCents?: number;
  public readonly compareAtPriceCents?: number;
  public readonly costPriceCents?: number;
  public readonly currencyCode?: string;

  constructor(props: UpdateCatalogVariantCommandProps) {
    this.productId = props.productId;
    this.variantId = props.variantId;
    this.variantFields = props.variantFields;
    this.priceCents = props.priceCents;
    this.salePriceCents = props.salePriceCents;
    this.compareAtPriceCents = props.compareAtPriceCents;
    this.costPriceCents = props.costPriceCents;
    this.currencyCode = props.currencyCode;
  }
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

    if (!this.hasPriceInput(command)) {
      return { ...variant };
    }

    const existing = await this.pricingPort.getBasePrice(productId, command.variantId);
    const price = await this.pricingPort.setBasePrice(this.buildPriceParams(command, productId, existing));

    return { ...variant, priceCents: price.priceCents };
  }

  private hasPriceInput(command: UpdateCatalogVariantCommand): boolean {
    return (
      command.priceCents !== undefined ||
      command.salePriceCents !== undefined ||
      command.compareAtPriceCents !== undefined ||
      command.costPriceCents !== undefined
    );
  }

  private buildPriceParams(
    command: UpdateCatalogVariantCommand,
    productId: string,
    existing: Awaited<ReturnType<ProductPricingPort['getBasePrice']>>,
  ): Parameters<ProductPricingPort['setBasePrice']>[0] {
    const fallback = <T>(commandValue: T | undefined, existingValue: T | null | undefined): T | null =>
      commandValue !== undefined ? commandValue : (existingValue ?? null);
    return {
      productId,
      productVariantId: command.variantId,
      currencyCode: command.currencyCode ?? existing?.currencyCode ?? 'USD',
      priceCents: command.priceCents ?? existing?.priceCents ?? 0,
      salePriceCents: fallback(command.salePriceCents, existing?.salePriceCents),
      compareAtPriceCents: fallback(command.compareAtPriceCents, existing?.compareAtPriceCents),
      costPriceCents: fallback(command.costPriceCents, existing?.costPriceCents),
    };
  }
}
