import productCollectionRepo from '../../infrastructure/repositories/productCollectionRepo';
import type { ProductCollection, ProductCollectionCreateParams, ProductCollectionUpdateParams } from '../../infrastructure/repositories/productCollectionRepo';

export class ManageProductCollectionsUseCase {
  async findAll(): Promise<ProductCollection[]> {
    return productCollectionRepo.findAll();
  }
  async findById(id: string): Promise<ProductCollection | null> {
    return productCollectionRepo.findById(id);
  }
  async create(params: ProductCollectionCreateParams): Promise<ProductCollection> {
    return productCollectionRepo.create(params);
  }
  async update(id: string, params: ProductCollectionUpdateParams): Promise<ProductCollection | null> {
    return productCollectionRepo.update(id, params);
  }
  async softDelete(id: string): Promise<boolean> {
    return productCollectionRepo.softDelete(id);
  }
}
