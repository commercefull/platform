jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ReorderPageBlocksUseCase, ReorderPageBlocksCommand } from './ReorderPageBlocks';
import { ContentBlockNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

describe('ReorderPageBlocksUseCase', () => {
  let useCase: ReorderPageBlocksUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findPageById: jest.fn().mockResolvedValue({ contentPageId: 'p1' }),
      findBlocksByPageId: jest.fn().mockResolvedValue([{ contentBlockId: 'b1' }, { contentBlockId: 'b2' }]),
      reorderBlocks: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ReorderPageBlocksUseCase(mockRepo as never);
  });

  it('should reorder blocks successfully', async () => {
    const result = await useCase.execute(new ReorderPageBlocksCommand('p1', [{ id: 'b1', order: 1 }, { id: 'b2', order: 0 }]));

    expect(result.blocksReordered).toBe(2);
    expect(mockRepo.reorderBlocks).toHaveBeenCalled();
  });

  it('should throw ContentValidationError when pageId is empty', async () => {
    await expect(useCase.execute(new ReorderPageBlocksCommand('', [{ id: 'b1', order: 0 }]))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentValidationError when blockOrders is empty', async () => {
    await expect(useCase.execute(new ReorderPageBlocksCommand('p1', []))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentBlockNotFoundError when block does not belong to page', async () => {
    await expect(useCase.execute(new ReorderPageBlocksCommand('p1', [{ id: 'bX', order: 0 }]))).rejects.toThrow(ContentBlockNotFoundError);
  });
});
