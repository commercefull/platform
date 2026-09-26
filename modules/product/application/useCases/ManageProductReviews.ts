import type {
  ProductReview,
  ProductReviewCreateParams,
  ProductReviewUpdateParams,
  ReviewRating,
  ReviewStatus,
  ReviewFilters,
  ProductReviewPort,
} from '../../domain/repositories/ProductCatalogPorts';
import { ProductValidationError } from '../../domain/errors/ProductErrors';

export class ManageProductReviewsUseCase {
  constructor(private readonly productReviewRepo: ProductReviewPort) {}

  async findById(id: string): Promise<ProductReview | null> {
    return this.productReviewRepo.findById(id);
  }
  async findByProductId(productId: string, status?: ReviewStatus, limit?: number, offset?: number): Promise<ProductReview[]> {
    return this.productReviewRepo.findByProductId(productId, status, limit, offset);
  }
  async findByCustomerId(customerId: string, limit?: number, offset?: number): Promise<ProductReview[]> {
    return this.productReviewRepo.findByCustomerId(customerId, limit, offset);
  }
  async findWithFilters(filters: ReviewFilters, limit?: number, offset?: number): Promise<ProductReview[]> {
    return this.productReviewRepo.findWithFilters(filters, limit, offset);
  }
  async findPending(limit?: number, offset?: number): Promise<ProductReview[]> {
    return this.productReviewRepo.findPending(limit, offset);
  }
  async create(params: ProductReviewCreateParams): Promise<ProductReview> {
    return this.productReviewRepo.create(params);
  }
  async submitReview(input: {
    productId: string;
    customerId?: string;
    rating?: number;
    title?: string;
    content?: string;
    reviewerName?: string;
    reviewerEmail?: string;
  }): Promise<ProductReview> {
    if (!input.rating || input.rating < 1 || input.rating > 5) {
      throw new ProductValidationError('Rating must be between 1 and 5');
    }
    if (!input.reviewerName?.trim()) {
      throw new ProductValidationError('Reviewer name is required');
    }
    return this.productReviewRepo.create({
      productId: input.productId,
      customerId: input.customerId,
      rating: input.rating as ReviewRating,
      title: input.title,
      content: input.content,
      reviewerName: input.reviewerName,
      reviewerEmail: input.reviewerEmail,
      isVerifiedPurchase: !!input.customerId,
      status: 'pending',
    });
  }
  async getApprovedReviewsWithStats(productId: string, limit?: number, offset?: number) {
    const reviews = await this.productReviewRepo.findByProductId(productId, 'approved', limit, offset);
    const stats = await this.productReviewRepo.getProductStatistics(productId);
    return {
      reviews,
      averageRating: stats.averageRating,
      ratingDistribution: stats.distribution,
      totalCount: stats.totalReviews,
    };
  }
  async update(id: string, params: ProductReviewUpdateParams): Promise<ProductReview | null> {
    return this.productReviewRepo.update(id, params);
  }
  async updateStatus(id: string, status: ReviewStatus): Promise<ProductReview | null> {
    return this.productReviewRepo.updateStatus(id, status);
  }
  async approve(id: string): Promise<ProductReview | null> {
    return this.productReviewRepo.approve(id);
  }
  async reject(id: string): Promise<ProductReview | null> {
    return this.productReviewRepo.reject(id);
  }
  async highlight(id: string, highlighted?: boolean): Promise<ProductReview | null> {
    return this.productReviewRepo.highlight(id, highlighted);
  }
  async addAdminResponse(id: string, response: string): Promise<ProductReview | null> {
    return this.productReviewRepo.addAdminResponse(id, response);
  }
  async incrementHelpful(id: string): Promise<ProductReview | null> {
    return this.productReviewRepo.incrementHelpful(id);
  }
  async incrementReport(id: string): Promise<ProductReview | null> {
    return this.productReviewRepo.incrementReport(id);
  }
  async getProductStatistics(productId: string) {
    return this.productReviewRepo.getProductStatistics(productId);
  }
  async findByCustomerAndProduct(customerId: string, productId: string): Promise<ProductReview | null> {
    return this.productReviewRepo.findByCustomerAndProduct(customerId, productId);
  }
  async checkCustomerPurchase(customerId: string, productId: string): Promise<boolean> {
    return this.productReviewRepo.checkCustomerPurchase(customerId, productId);
  }
  async delete(id: string): Promise<unknown> {
    return this.productReviewRepo.delete(id);
  }
}
