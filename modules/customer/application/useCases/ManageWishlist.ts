import type { StorefrontWishlistRepository } from '../../domain/repositories/StorefrontWishlistRepository';

export class ManageWishlistUseCase {
  constructor(private readonly storefrontWishlistRepo: StorefrontWishlistRepository) {}

  async findByCustomer(customerId: string) {
    return this.storefrontWishlistRepo.findByCustomer(customerId);
  }
  async findExisting(customerId: string, productId: string) {
    return this.storefrontWishlistRepo.findExisting(customerId, productId);
  }
  async create(customerId: string, productId: string) {
    return this.storefrontWishlistRepo.create(customerId, productId);
  }
  async remove(customerId: string, productId: string) {
    return this.storefrontWishlistRepo.remove(customerId, productId);
  }
}
