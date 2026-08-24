import productReviewRepo from '../../infrastructure/repositories/productReviewRepo';

export class GetReviewStatsUseCase {
  async execute(productId: string) {
    return productReviewRepo.getProductStatistics(productId);
  }
}
