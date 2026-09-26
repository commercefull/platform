import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';

export class DeleteProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(productId: string, permanent = false): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new ProductNotFoundError(productId);

    if (permanent) {
      await this.productRepository.hardDelete(productId);
    } else {
      await this.productRepository.delete(productId);
    }
  }
}
