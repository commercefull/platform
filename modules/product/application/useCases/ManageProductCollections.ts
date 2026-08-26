import type { ProductCollection, ProductCollectionCreateParams, ProductCollectionUpdateParams, ProductCollectionPort } from '../../domain/repositories/ProductCatalogPorts';

export class ManageProductCollectionsUseCase {
  constructor(private readonly productCollectionRepo: ProductCollectionPort) {}

  async findAll(): Promise<ProductCollection[]> {
    return this.productCollectionRepo.findAll();
  }
  async findById(id: string): Promise<ProductCollection | null> {
    return this.productCollectionRepo.findById(id);
  }
  async create(params: ProductCollectionCreateParams): Promise<ProductCollection> {
    return this.productCollectionRepo.create(params);
  }
  async update(id: string, params: ProductCollectionUpdateParams): Promise<ProductCollection | null> {
    return this.productCollectionRepo.update(id, params);
  }
  async softDelete(id: string): Promise<boolean> {
    return this.productCollectionRepo.softDelete(id);
  }
}
