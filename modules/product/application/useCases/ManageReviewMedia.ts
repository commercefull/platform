import type {
  ProductReview,
  ProductReviewMedia,
  ProductReviewPort,
  ProductReviewMediaPort,
} from '../../domain/repositories/ProductCatalogPorts';

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

  /** All reviews for a product with their attached media. */
  async findMediaByProduct(productId: string): Promise<Array<{ review: ProductReview; media: ProductReviewMedia[] }>> {
    const reviews = await this.productReviewRepo.findByProductId(productId);
    return Promise.all(
      reviews.map(async review => ({
        review,
        media: await this.productReviewMediaRepo.findByReview(review.productReviewId),
      })),
    );
  }
  async deleteMedia(mediaId: string): Promise<boolean> {
    return this.productReviewMediaRepo.delete(mediaId);
  }
}
