import customerDataRepository from '../../infrastructure/repositories/CustomerDataRepository';

const storefrontWishlistRepo = customerDataRepository.wishlist;

export class ManageStorefrontWishlistUseCase {
  async findByCustomer(customerId: string) {
    return storefrontWishlistRepo.findByCustomer(customerId);
  }
  async findExisting(customerId: string, productId: string) {
    return storefrontWishlistRepo.findExisting(customerId, productId);
  }
  async create(customerId: string, productId: string) {
    return storefrontWishlistRepo.create(customerId, productId);
  }
  async remove(customerId: string, productId: string) {
    return storefrontWishlistRepo.remove(customerId, productId);
  }
}
