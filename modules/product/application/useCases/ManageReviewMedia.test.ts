

import { ManageReviewMediaUseCase } from './ManageReviewMedia';
import { createProductReview, createReviewMedia, lazyMock } from '../../tests/testUtils';

;

describe('ManageReviewMediaUseCase', () => {
  let useCase: ManageReviewMediaUseCase;
  let mockRepo1: jest.Mocked<ConstructorParameters<typeof ManageReviewMediaUseCase>[0]>;
  let mockRepo2: jest.Mocked<ConstructorParameters<typeof ManageReviewMediaUseCase>[1]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo1 = lazyMock<ConstructorParameters<typeof ManageReviewMediaUseCase>[0]>();
    mockRepo1.findByProductId.mockResolvedValue([createProductReview()]);
    mockRepo2 = lazyMock<ConstructorParameters<typeof ManageReviewMediaUseCase>[1]>();
    mockRepo2.findByReview.mockResolvedValue([createReviewMedia()]);
    mockRepo2.delete.mockResolvedValue(true);
    useCase = new ManageReviewMediaUseCase(mockRepo1, mockRepo2);
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
    expect(mockRepo2.delete).toHaveBeenCalledWith('m1');
  });
});
