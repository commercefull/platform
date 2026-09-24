import '../../tests/testUtils';
import { ManageStorefrontWishlistUseCase } from './ManageStorefrontWishlist';
import { createStorefrontWishlistRepository, createWishlistItem } from '../../tests/testUtils';

describe('ManageStorefrontWishlistUseCase', () => {
  const wishlistRepository = createStorefrontWishlistRepository();
  const useCase = new ManageStorefrontWishlistUseCase(wishlistRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the wishlist items for the customer', async () => {
    wishlistRepository.findByCustomer.mockResolvedValue([createWishlistItem()]);

    const result = await useCase.findByCustomer('cust-1');

    expect(result).toHaveLength(1);
    expect(wishlistRepository.findByCustomer).toHaveBeenCalledWith('cust-1');
  });

  it('should return the existing wishlist item', async () => {
    wishlistRepository.findExisting.mockResolvedValue(createWishlistItem());

    const result = await useCase.findExisting('cust-1', 'prod-1');

    expect(result?.wishlistItemId).toBe('wish-1');
    expect(wishlistRepository.findExisting).toHaveBeenCalledWith('cust-1', 'prod-1');
  });

  it('should delegate wishlist item creation', async () => {
    wishlistRepository.create.mockResolvedValue(createWishlistItem());

    const result = await useCase.create('cust-1', 'prod-1');

    expect(result?.wishlistItemId).toBe('wish-1');
    expect(wishlistRepository.create).toHaveBeenCalledWith('cust-1', 'prod-1');
  });

  it('should delegate wishlist item removal', async () => {
    wishlistRepository.remove.mockResolvedValue(createWishlistItem());

    const result = await useCase.remove('cust-1', 'prod-1');

    expect(result?.wishlistItemId).toBe('wish-1');
    expect(wishlistRepository.remove).toHaveBeenCalledWith('cust-1', 'prod-1');
  });
});
