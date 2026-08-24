import productReviewRepo from '../../infrastructure/repositories/productReviewRepo';
import productReviewMediaRepo from '../../infrastructure/repositories/productReviewMediaRepo';
import type { ProductReview } from '../../infrastructure/repositories/productReviewRepo';
import type { ProductReviewMedia } from '../../infrastructure/repositories/productReviewMediaRepo';

export class ManageReviewMediaUseCase {
  async findReviewsByProduct(productId: string): Promise<ProductReview[]> {
    return productReviewRepo.findByProductId(productId);
  }
  async findMediaByReview(reviewId: string): Promise<ProductReviewMedia[]> {
    return productReviewMediaRepo.findByReview(reviewId);
  }
  async deleteMedia(mediaId: string): Promise<boolean> {
    return productReviewMediaRepo.delete(mediaId);
  }
}
