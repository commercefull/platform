/**
 * Update Variant Inventory Policy Use Case
 * Changes a variant's inventory policy (tracked | unlimited | backorderable)
 * through the domain variant aggregate.
 */

import { ProductVariant, type InventoryPolicy } from '../../domain/entities/ProductVariant';
import type { ProductVariantPort } from '../../domain/repositories/ProductCatalogPorts';
import { ProductVariantNotFoundError } from '../../domain/errors/ProductErrors';

export class UpdateVariantInventoryPolicyCommand {
  constructor(
    public readonly variantId: string,
    public readonly inventoryPolicy: InventoryPolicy,
  ) {}
}

export class UpdateVariantInventoryPolicyUseCase {
  constructor(private readonly variantRepository: ProductVariantPort) {}

  async execute(command: UpdateVariantInventoryPolicyCommand): Promise<ProductVariant> {
    const variant = (await this.variantRepository.findById(command.variantId)) as ProductVariant | null;
    if (!variant) {
      throw new ProductVariantNotFoundError(command.variantId);
    }
    variant.setInventoryPolicy(command.inventoryPolicy);
    return (await this.variantRepository.save(variant)) as ProductVariant;
  }
}
