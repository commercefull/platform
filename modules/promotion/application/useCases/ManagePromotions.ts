import promotionRuleRepository from '../../infrastructure/repositories/PromotionRuleRepository';
import couponDiscountRepository from '../../infrastructure/repositories/CouponDiscountRepository';
import * as giftCardRepo from '../../infrastructure/repositories/GiftCardRepository';

const promotionRepo = promotionRuleRepository.promotions;
const couponRepo = couponDiscountRepository.coupons;

export class ManagePromotionsUseCase {
  async findById(id: string) {
    return promotionRepo.findById(id);
  }
  async findAll(filters?: Parameters<typeof promotionRepo.findAll>[0], pagination?: Parameters<typeof promotionRepo.findAll>[1]) {
    return promotionRepo.findAll(filters, pagination);
  }
  async findActive(scope?: Parameters<typeof promotionRepo.findActive>[0], organizationId?: string) {
    return promotionRepo.findActive(scope, organizationId);
  }
  async create(input: Parameters<typeof promotionRepo.create>[0]) {
    return promotionRepo.create(input);
  }
  async update(id: string, input: Parameters<typeof promotionRepo.update>[1]) {
    return promotionRepo.update(id, input);
  }
  async delete(id: string) {
    return promotionRepo.delete(id);
  }
}

export class ManageCouponsUseCase {
  async findById(id: string) {
    return couponRepo.findById(id);
  }
  async findByCode(code: string, organizationId?: string) {
    return couponRepo.findByCode(code, organizationId);
  }
  async findAll(...args: Parameters<typeof couponRepo.findAll>) {
    return couponRepo.findAll(...args);
  }
  async findActiveCoupons(...args: Parameters<typeof couponRepo.findActiveCoupons>) {
    return couponRepo.findActiveCoupons(...args);
  }
  async create(input: Parameters<typeof couponRepo.create>[0]) {
    return couponRepo.create(input);
  }
  async update(id: string, input: Parameters<typeof couponRepo.update>[1]) {
    return couponRepo.update(id, input);
  }
  async delete(id: string) {
    return couponRepo.delete(id);
  }
  async getUsage(couponId: string) {
    return couponRepo.getUsage(couponId);
  }
  async validate(...args: Parameters<typeof couponRepo.validate>) {
    return couponRepo.validate(...args);
  }
  calculateDiscount(...args: Parameters<typeof couponRepo.calculateDiscount>) {
    return couponRepo.calculateDiscount(...args);
  }
}

export class ManageGiftCardsUseCase {
  async getGiftCard(id: string) {
    return giftCardRepo.getGiftCard(id);
  }
  async getGiftCardByCode(code: string) {
    return giftCardRepo.getGiftCardByCode(code);
  }
  async getGiftCards(...args: Parameters<typeof giftCardRepo.getGiftCards>) {
    return giftCardRepo.getGiftCards(...args);
  }
  async createGiftCard(giftCard: Parameters<typeof giftCardRepo.createGiftCard>[0]) {
    return giftCardRepo.createGiftCard(giftCard);
  }
  async activateGiftCard(id: string) {
    return giftCardRepo.activateGiftCard(id);
  }
  async assignGiftCard(...args: Parameters<typeof giftCardRepo.assignGiftCard>) {
    return giftCardRepo.assignGiftCard(...args);
  }
  async reloadGiftCard(...args: Parameters<typeof giftCardRepo.reloadGiftCard>) {
    return giftCardRepo.reloadGiftCard(...args);
  }
  async refundToGiftCard(...args: Parameters<typeof giftCardRepo.refundToGiftCard>) {
    return giftCardRepo.refundToGiftCard(...args);
  }
  async cancelGiftCard(id: string) {
    return giftCardRepo.cancelGiftCard(id);
  }
  async getTransactions(giftCardId: string) {
    return giftCardRepo.getTransactions(giftCardId);
  }
}
