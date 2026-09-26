import type { PromotionRepository } from '../../domain/repositories/PromotionRepository';

export class ManagePromotionsUseCase {
  constructor(private readonly promotionRepo: PromotionRepository) {}

  async findById(id: string) {
    return this.promotionRepo.findById(id);
  }
  async getWithDetails(id: string) {
    return this.promotionRepo.getWithDetails(id);
  }
  async findAll(filters?: Parameters<PromotionRepository['findAll']>[0], pagination?: Parameters<PromotionRepository['findAll']>[1]) {
    return this.promotionRepo.findAll(filters, pagination);
  }
  async findActive(scope?: Parameters<PromotionRepository['findActive']>[0], organizationId?: string) {
    return this.promotionRepo.findActive(scope, organizationId);
  }
  async create(input: Parameters<PromotionRepository['create']>[0]) {
    return this.promotionRepo.create(input);
  }
  async update(id: string, input: Parameters<PromotionRepository['update']>[1]) {
    return this.promotionRepo.update(id, input);
  }
  async delete(id: string) {
    return this.promotionRepo.delete(id);
  }
  async isValidForOrder(promotionId: string, orderTotalCents: number, customerId?: string) {
    return this.promotionRepo.isValidForOrder(promotionId, orderTotalCents, customerId);
  }
}

