import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { Product } from '../../domain/entities/Product';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';

export class UpdateProductStatusUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async updateStatus(productId: string, status: ProductStatus): Promise<Product> {
    const product = await this.loadProduct(productId);
    product.updateStatus(status);
    await this.productRepository.save(product);
    return product;
  }

  async updateVisibility(productId: string, visibility: ProductVisibility): Promise<Product> {
    const product = await this.loadProduct(productId);
    product.updateVisibility(visibility);
    await this.productRepository.save(product);
    return product;
  }

  async publish(productId: string): Promise<Product> {
    const product = await this.loadProduct(productId);
    product.publish();
    await this.productRepository.save(product);
    return product;
  }

  async unpublish(productId: string): Promise<Product> {
    const product = await this.loadProduct(productId);
    product.unpublish();
    await this.productRepository.save(product);
    return product;
  }

  private async loadProduct(productId: string): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new ProductNotFoundError(productId);
    return product;
  }
}
