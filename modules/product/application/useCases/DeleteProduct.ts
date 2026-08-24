import { ProductRepository } from '../../domain/repositories/ProductRepository';

export class DeleteProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(productId: string, permanent = false): Promise<void> {
    if (permanent) {
      await this.productRepository.hardDelete(productId);
    } else {
      await this.productRepository.delete(productId);
    }
  }
}
