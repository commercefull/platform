import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';

export class UpdateProductStatusUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async updateStatus(productId: string, status: ProductStatus): Promise<ProductStatus> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new ProductNotFoundError(productId);
    product.updateStatus(status);
    await this.productRepository.save(product);
    return product.status;
  }

  async publish(productId: string): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new ProductNotFoundError(productId);
    product.publish();
    await this.productRepository.save(product);
  }

  async unpublish(productId: string): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new ProductNotFoundError(productId);
    product.unpublish();
    await this.productRepository.save(product);
  }
}
