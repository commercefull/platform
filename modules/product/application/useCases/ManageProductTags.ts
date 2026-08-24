import productTagRepo from '../../infrastructure/repositories/productTagRepo';
import type { ProductTag, ProductTagCreateParams } from '../../infrastructure/repositories/productTagRepo';

export class ManageProductTagsUseCase {
  async findAll(): Promise<ProductTag[]> {
    return productTagRepo.findAll();
  }
  async create(params: ProductTagCreateParams): Promise<ProductTag> {
    return productTagRepo.create(params);
  }
  async softDelete(id: string): Promise<boolean> {
    return productTagRepo.softDelete(id);
  }
}
