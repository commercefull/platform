import type { ProductReviewPort } from '../../domain/repositories/ProductCatalogPorts';

export class GetReviewStatsUseCase {
  constructor(private readonly productReviewRepo: ProductReviewPort) {}

  async execute(productId: string) {
    return this.productReviewRepo.getProductStatistics(productId);
  }
}
