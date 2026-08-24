jest.mock('../../infrastructure/repositories/productReviewRepo', () => ({
  __esModule: true,
  default: {
    findByProductId: jest.fn().mockResolvedValue([{ reviewId: 'r1' }]),
  },
}));

jest.mock('../../infrastructure/repositories/productReviewMediaRepo', () => ({
  __esModule: true,
  default: {
    findByReview: jest.fn().mockResolvedValue([{ mediaId: 'm1', url: 'https://example.com/img.jpg' }]),
    delete: jest.fn().mockResolvedValue(true),
  },
}));

import { ManageReviewMediaUseCase } from './ManageReviewMedia';
import productReviewMediaRepo from '../../infrastructure/repositories/productReviewMediaRepo';

const mockMediaRepo = productReviewMediaRepo as unknown as Record<string, jest.Mock>;

describe('ManageReviewMediaUseCase', () => {
  let useCase: ManageReviewMediaUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageReviewMediaUseCase();
  });

  it('should find reviews by product', async () => {
    const result = await useCase.findReviewsByProduct('p1');
    expect(result).toHaveLength(1);
  });

  it('should find media by review', async () => {
    const result = await useCase.findMediaByReview('r1');
    expect(result).toHaveLength(1);
  });

  it('should delete media', async () => {
    const result = await useCase.deleteMedia('m1');
    expect(result).toBe(true);
    expect(mockMediaRepo.delete).toHaveBeenCalledWith('m1');
  });
});
