import type { GiftCardRepository } from '../../domain/repositories/GiftCardRepository';

export class ManageGiftCardsUseCase {
  constructor(private readonly giftCardRepo: GiftCardRepository) {}

  async getGiftCard(id: string) {
    return this.giftCardRepo.getGiftCard(id);
  }
  async getGiftCardByCode(code: string) {
    return this.giftCardRepo.getGiftCardByCode(code);
  }
  async getGiftCards(...args: Parameters<GiftCardRepository['getGiftCards']>) {
    return this.giftCardRepo.getGiftCards(...args);
  }
  async createGiftCard(giftCard: Parameters<GiftCardRepository['createGiftCard']>[0]) {
    return this.giftCardRepo.createGiftCard(giftCard);
  }
  async activateGiftCard(id: string) {
    return this.giftCardRepo.activateGiftCard(id);
  }
  async assignGiftCard(...args: Parameters<GiftCardRepository['assignGiftCard']>) {
    return this.giftCardRepo.assignGiftCard(...args);
  }
  async reloadGiftCard(...args: Parameters<GiftCardRepository['reloadGiftCard']>) {
    return this.giftCardRepo.reloadGiftCard(...args);
  }
  async refundToGiftCard(...args: Parameters<GiftCardRepository['refundToGiftCard']>) {
    return this.giftCardRepo.refundToGiftCard(...args);
  }
  async cancelGiftCard(id: string) {
    return this.giftCardRepo.cancelGiftCard(id);
  }
  async getTransactions(giftCardId: string) {
    return this.giftCardRepo.getTransactions(giftCardId);
  }
}
