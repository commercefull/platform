import { DynamicAttributeRepository } from '../../infrastructure/repositories/DynamicAttributeRepository';

export class GetProductAttributesUseCase {
  private readonly dynamicAttributeRepo = new DynamicAttributeRepository();

  async getProductAttributes(productId: string) {
    return this.dynamicAttributeRepo.getProductAttributes(productId);
  }
  async findAllAttributes() {
    return this.dynamicAttributeRepo.findAllAttributes();
  }
}
