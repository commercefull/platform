import { ProductReviewRepo } from '../../infrastructure/repositories/productReviewRepo';

const productReviewRepo = new ProductReviewRepo();

export class ManageProductReviewsUseCase {
  async findById(id: string) {
    return productReviewRepo.findById(id);
  }
  async findByProductId(productId: string, status?: Parameters<typeof productReviewRepo.findByProductId>[1], limit?: number, offset?: number) {
    return productReviewRepo.findByProductId(productId, status, limit, offset);
  }
  async findByCustomerId(customerId: string, limit?: number, offset?: number) {
    return productReviewRepo.findByCustomerId(customerId, limit, offset);
  }
  async findWithFilters(filters: Parameters<typeof productReviewRepo.findWithFilters>[0], limit?: number, offset?: number) {
    return productReviewRepo.findWithFilters(filters, limit, offset);
  }
  async findPending(limit?: number, offset?: number) {
    return productReviewRepo.findPending(limit, offset);
  }
  async create(params: Parameters<typeof productReviewRepo.create>[0]) {
    return productReviewRepo.create(params);
  }
  async update(id: string, params: Parameters<typeof productReviewRepo.update>[1]) {
    return productReviewRepo.update(id, params);
  }
  async updateStatus(id: string, status: Parameters<typeof productReviewRepo.updateStatus>[1]) {
    return productReviewRepo.updateStatus(id, status);
  }
  async approve(id: string) {
    return productReviewRepo.approve(id);
  }
  async reject(id: string) {
    return productReviewRepo.reject(id);
  }
  async highlight(id: string, highlighted?: boolean) {
    return productReviewRepo.highlight(id, highlighted);
  }
  async addAdminResponse(id: string, response: string) {
    return productReviewRepo.addAdminResponse(id, response);
  }
  async incrementHelpful(id: string) {
    return productReviewRepo.incrementHelpful(id);
  }
  async getProductStatistics(productId: string) {
    return productReviewRepo.getProductStatistics(productId);
  }
  async findByCustomerAndProduct(customerId: string, productId: string) {
    return productReviewRepo.findByCustomerAndProduct(customerId, productId);
  }
  async checkCustomerPurchase(customerId: string, productId: string) {
    return productReviewRepo.checkCustomerPurchase(customerId, productId);
  }
}
