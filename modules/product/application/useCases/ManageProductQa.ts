import productQaRepo from '../../infrastructure/repositories/productQaRepo';
import type { ProductQa, ProductQaStatus } from '../../infrastructure/repositories/productQaRepo';

export class ManageProductQaUseCase {
  async findByProduct(productId: string, status?: ProductQaStatus): Promise<ProductQa[]> {
    return productQaRepo.findByProduct(productId, status);
  }
  async updateStatus(qaId: string, status: ProductQaStatus): Promise<ProductQa | null> {
    return productQaRepo.updateStatus(qaId, status);
  }
}
