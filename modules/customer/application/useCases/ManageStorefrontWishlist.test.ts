jest.mock('../../infrastructure/repositories/CustomerDataRepository', () => ({
  __esModule: true,
  default: {
    wishlist: {
      findByCustomer: jest.fn().mockResolvedValue([{ productId: 'p1', productName: 'Widget' }]),
      findExisting: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ wishlistId: 'w1' }),
      remove: jest.fn().mockResolvedValue(undefined),
    },
    addresses: {},
    customers: {},
  },
}));

import { ManageStorefrontWishlistUseCase } from './ManageStorefrontWishlist';
import customerDataRepository from '../../infrastructure/repositories/CustomerDataRepository';

const mockRepo = customerDataRepository as unknown as { wishlist: Record<string, jest.Mock> };

describe('ManageStorefrontWishlistUseCase', () => {
  let useCase: ManageStorefrontWishlistUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageStorefrontWishlistUseCase();
  });

  it('should find by customer', async () => {
    const result = await useCase.findByCustomer('c1');
    expect(result).toHaveLength(1);
  });

  it('should find existing', async () => {
    await useCase.findExisting('c1', 'p1');
    expect(mockRepo.wishlist.findExisting).toHaveBeenCalledWith('c1', 'p1');
  });

  it('should create wishlist item', async () => {
    await useCase.create('c1', 'p1');
    expect(mockRepo.wishlist.create).toHaveBeenCalledWith('c1', 'p1');
  });

  it('should remove wishlist item', async () => {
    await useCase.remove('c1', 'p1');
    expect(mockRepo.wishlist.remove).toHaveBeenCalledWith('c1', 'p1');
  });
});
