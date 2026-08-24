import productCategoryRepo from '../../infrastructure/repositories/productCategoryRepo';
import type { ProductCategory, ProductCategoryCreateParams, ProductCategoryUpdateParams } from '../../infrastructure/repositories/productCategoryRepo';

export class ManageProductCategoriesUseCase {
  async findAll(): Promise<ProductCategory[]> {
    return productCategoryRepo.findAll();
  }
  async findById(id: string): Promise<ProductCategory | null> {
    return productCategoryRepo.findById(id);
  }
  async create(params: ProductCategoryCreateParams): Promise<ProductCategory> {
    return productCategoryRepo.create(params);
  }
  async update(id: string, params: ProductCategoryUpdateParams): Promise<ProductCategory | null> {
    return productCategoryRepo.update(id, params);
  }
  async softDelete(id: string): Promise<boolean> {
    return productCategoryRepo.softDelete(id);
  }
}
