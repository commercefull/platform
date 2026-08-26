import type { ProductReview, ProductReviewMedia, ProductReviewPort, ProductReviewMediaPort } from '../../domain/repositories/ProductCatalogPorts';

export class ManageReviewMediaUseCase {
  constructor(
    private readonly productReviewRepo: ProductReviewPort,
    private readonly productReviewMediaRepo: ProductReviewMediaPort,
  ) {}

  async findReviewsByProduct(productId: string): Promise<ProductReview[]> {
    return this.productReviewRepo.findByProductId(productId);
  }
  async findMediaByReview(reviewId: string): Promise<ProductReviewMedia[]> {
    return this.productReviewMediaRepo.findByReview(reviewId);
  }
  async deleteMedia(mediaId: string): Promise<boolean> {
    return this.productReviewMediaRepo.delete(mediaId);
  }
}
