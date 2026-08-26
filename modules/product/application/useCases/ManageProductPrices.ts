import type { ProductPrice, ProductPriceCreateParams, ProductPriceUpdateParams, ProductPricePort } from '../../domain/repositories/ProductCatalogPorts';

export class ManageProductPricesUseCase {
  constructor(private readonly productPriceRepo: ProductPricePort) {}

  async findByProduct(productId: string): Promise<ProductPrice[]> {
    return this.productPriceRepo.findByProduct(productId);
  }
  async create(params: ProductPriceCreateParams): Promise<ProductPrice> {
    return this.productPriceRepo.create(params);
  }
  async update(id: string, params: ProductPriceUpdateParams): Promise<ProductPrice | null> {
    return this.productPriceRepo.update(id, params);
  }
}
