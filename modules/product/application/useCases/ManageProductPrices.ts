import productPriceRepo from '../../infrastructure/repositories/productPriceRepo';
import type { ProductPrice, ProductPriceCreateParams, ProductPriceUpdateParams } from '../../infrastructure/repositories/productPriceRepo';

export class ManageProductPricesUseCase {
  async findByProduct(productId: string): Promise<ProductPrice[]> {
    return productPriceRepo.findByProduct(productId);
  }
  async create(params: ProductPriceCreateParams): Promise<ProductPrice> {
    return productPriceRepo.create(params);
  }
  async update(id: string, params: ProductPriceUpdateParams): Promise<ProductPrice | null> {
    return productPriceRepo.update(id, params);
  }
}
