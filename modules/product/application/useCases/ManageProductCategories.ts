import type { ProductCategoryRow, ProductCategoryCreateParams, ProductCategoryUpdateParams, ProductCategoryPort } from '../../domain/repositories/ProductCatalogPorts';

export class ManageProductCategoriesUseCase {
  constructor(private readonly productCategoryRepo: ProductCategoryPort) {}

  async findAll(): Promise<ProductCategoryRow[]> {
    return this.productCategoryRepo.findAll();
  }
  async findById(id: string): Promise<ProductCategoryRow | null> {
    return this.productCategoryRepo.findById(id);
  }
  async create(params: ProductCategoryCreateParams): Promise<ProductCategoryRow> {
    return this.productCategoryRepo.create(params);
  }
  async update(id: string, params: ProductCategoryUpdateParams): Promise<ProductCategoryRow | null> {
    return this.productCategoryRepo.update(id, params);
  }
  async softDelete(id: string): Promise<boolean> {
    return this.productCategoryRepo.softDelete(id);
  }
}
