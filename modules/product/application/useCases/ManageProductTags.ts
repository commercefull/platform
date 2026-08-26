import type { ProductTag, ProductTagCreateParams, ProductTagPort } from '../../domain/repositories/ProductCatalogPorts';

export class ManageProductTagsUseCase {
  constructor(private readonly productTagRepo: ProductTagPort) {}

  async findAll(): Promise<ProductTag[]> {
    return this.productTagRepo.findAll();
  }
  async create(params: ProductTagCreateParams): Promise<ProductTag> {
    return this.productTagRepo.create(params);
  }
  async softDelete(id: string): Promise<boolean> {
    return this.productTagRepo.softDelete(id);
  }
}
