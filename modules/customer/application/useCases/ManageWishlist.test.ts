import '../../tests/testUtils';
import { ManageWishlistUseCase } from './ManageWishlist';
import { createStorefrontWishlistRepository, createWishlistItem } from '../../tests/testUtils';

describe('ManageWishlistUseCase', () => {
  const wishlistRepository = createStorefrontWishlistRepository();
  const useCase = new ManageWishlistUseCase(wishlistRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the wishlist items for the customer', async () => {
    wishlistRepository.findByCustomer.mockResolvedValue([createWishlistItem()]);

    const result = await useCase.findByCustomer('cust-1');

    expect(result).toHaveLength(1);
    expect(wishlistRepository.findByCustomer).toHaveBeenCalledWith('cust-1');
  });

  it('should delegate wishlist item creation', async () => {
    wishlistRepository.create.mockResolvedValue(createWishlistItem());

    const result = await useCase.create('cust-1', 'prod-1');

    expect(result?.wishlistItemId).toBe('wish-1');
    expect(wishlistRepository.create).toHaveBeenCalledWith('cust-1', 'prod-1');
  });
});
