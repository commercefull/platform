import type { DynamicAttributePort } from '../../domain/repositories/ProductCatalogPorts';

export class GetProductAttributesUseCase {
  constructor(private readonly dynamicAttributeRepo: DynamicAttributePort) {}

  async getProductAttributes(productId: string) {
    return this.dynamicAttributeRepo.getProductAttributes(productId);
  }
  async findAllAttributes() {
    return this.dynamicAttributeRepo.findAllAttributes();
  }
}
