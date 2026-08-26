import type { ProductQa, ProductQaStatus, ProductQaPort } from '../../domain/repositories/ProductCatalogPorts';

export class ManageProductQaUseCase {
  constructor(private readonly productQaRepo: ProductQaPort) {}

  async findByProduct(productId: string, status?: ProductQaStatus): Promise<ProductQa[]> {
    return this.productQaRepo.findByProduct(productId, status);
  }
  async updateStatus(qaId: string, status: ProductQaStatus): Promise<ProductQa | null> {
    return this.productQaRepo.updateStatus(qaId, status);
  }
}
