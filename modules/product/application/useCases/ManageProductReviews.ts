import type { ProductReview, ProductReviewCreateParams, ProductReviewUpdateParams, ReviewStatus, ReviewFilters, ProductReviewPort } from '../../domain/repositories/ProductCatalogPorts';

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
  async getProductStatistics(productId: string) {
    return this.productReviewRepo.getProductStatistics(productId);
  }
  async findByCustomerAndProduct(customerId: string, productId: string): Promise<ProductReview | null> {
    return this.productReviewRepo.findByCustomerAndProduct(customerId, productId);
  }
  async checkCustomerPurchase(customerId: string, productId: string): Promise<boolean> {
    return this.productReviewRepo.checkCustomerPurchase(customerId, productId);
  }
}
