jest.mock('../../infrastructure/repositories/BasketRepository', () => ({
  __esModule: true,
  default: {
    findAbandonedBaskets: jest.fn().mockResolvedValue([{ basketId: 'b1' }]),
    findExpiredBaskets: jest.fn().mockResolvedValue([{ basketId: 'b2' }]),
    findById: jest.fn().mockResolvedValue({ basketId: 'b3' }),
    delete: jest.fn().mockResolvedValue(true),
  },
}));

import { ManageAdminBasketUseCase } from './ManageAdminBasket';
import basketRepo from '../../infrastructure/repositories/BasketRepository';

const mockRepo = basketRepo as unknown as Record<string, jest.Mock>;

describe('ManageAdminBasketUseCase', () => {
  let useCase: ManageAdminBasketUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageAdminBasketUseCase(basketRepo);
  });

  it('should find abandoned baskets', async () => {
    const result = await useCase.findAbandonedBaskets(7);

    expect(result).toHaveLength(1);
    expect(mockRepo.findAbandonedBaskets).toHaveBeenCalledWith(7);
  });

  it('should find expired baskets', async () => {
    const result = await useCase.findExpiredBaskets();

    expect(result).toHaveLength(1);
    expect(mockRepo.findExpiredBaskets).toHaveBeenCalled();
  });

  it('should find basket by ID', async () => {
    const result = await useCase.findById('b3');

    expect(result).toEqual({ basketId: 'b3' });
    expect(mockRepo.findById).toHaveBeenCalledWith('b3');
  });

  it('should delete a basket', async () => {
    await useCase.delete('b3');

    expect(mockRepo.delete).toHaveBeenCalledWith('b3');
  });
});
