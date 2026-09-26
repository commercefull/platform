/**
 * Configure Variant Use Case
 * Resolves the variant of a product matching a full set of option values
 */

import type { CatalogVariantOption, CatalogVariantRecord, CatalogVariantWritePort } from '../ports/CatalogVariantPort';
import { ProductVariantNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';

// ============================================================================
// Use Case
// ============================================================================

export class ConfigureVariantUseCase {
  constructor(private readonly variantRepo: Pick<CatalogVariantWritePort, 'findByProductId'>) {}

  async execute(productId: string, options: CatalogVariantOption[]): Promise<CatalogVariantRecord> {
    if (!options || !Array.isArray(options) || options.length === 0) {
      throw new ProductValidationError('options array is required');
    }

    const variants = await this.variantRepo.findByProductId(productId);
    const match = variants.find(v =>
      options.every(reqOpt => v.options.some(vOpt => vOpt.name === reqOpt.name && vOpt.value === reqOpt.value)),
    );

    if (!match) {
      throw new ProductVariantNotFoundError('No matching variant found for the given options');
    }

    return match;
  }
}
