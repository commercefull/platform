/**
 * Create Catalog Variant Use Case
 * Creates an options-based variant row and, when price fields are given,
 * writes the variant-level base price to the pricing-owned store.
 */

import type { CatalogVariantRecord, CatalogVariantCreateParams, CatalogVariantWritePort } from '../ports/CatalogVariantPort';
import type { ProductPricingPort } from '../ports/ProductPricingPort';
export interface CreateCatalogVariantCommandProps {
  productId: string;
  variantFields: CatalogVariantCreateParams;
  priceCents?: number;
  salePriceCents?: number;
  compareAtPriceCents?: number;
  costPriceCents?: number;
  currencyCode?: string;
}

// ============================================================================
// Command
// ============================================================================

export class CreateCatalogVariantCommand {
  public readonly productId: string;
  public readonly variantFields: CatalogVariantCreateParams;
  public readonly priceCents?: number;
  public readonly salePriceCents?: number;
  public readonly compareAtPriceCents?: number;
  public readonly costPriceCents?: number;
  public readonly currencyCode?: string;

  constructor(props: CreateCatalogVariantCommandProps) {
    this.productId = props.productId;
    this.variantFields = props.variantFields;
    this.priceCents = props.priceCents;
    this.salePriceCents = props.salePriceCents;
    this.compareAtPriceCents = props.compareAtPriceCents;
    this.costPriceCents = props.costPriceCents;
    this.currencyCode = props.currencyCode;
  }
}

export type CatalogVariantWithPrice = CatalogVariantRecord & { priceCents?: number };

// ============================================================================
// Use Case
// ============================================================================

export class CreateCatalogVariantUseCase {
  constructor(
    private readonly variantRepo: CatalogVariantWritePort,
    private readonly pricingPort: ProductPricingPort,
  ) {}

  async execute(command: CreateCatalogVariantCommand): Promise<CatalogVariantWithPrice> {
    const variant = await this.variantRepo.create(command.variantFields);

    const hasPriceInput =
      command.priceCents !== undefined || command.salePriceCents !== undefined || command.compareAtPriceCents !== undefined;
    if (!hasPriceInput) {
      return { ...variant };
    }

    const existing = await this.pricingPort.getBasePrice(command.productId, variant.id);
    const price = await this.pricingPort.setBasePrice({
      productId: command.productId,
      productVariantId: variant.id,
      currencyCode: command.currencyCode ?? existing?.currencyCode ?? 'USD',
      priceCents: command.priceCents ?? existing?.priceCents ?? 0,
      salePriceCents: command.salePriceCents ?? existing?.salePriceCents ?? null,
      compareAtPriceCents: command.compareAtPriceCents ?? existing?.compareAtPriceCents ?? null,
      costPriceCents: command.costPriceCents ?? existing?.costPriceCents ?? null,
    });

    return { ...variant, priceCents: price.priceCents };
  }
}
