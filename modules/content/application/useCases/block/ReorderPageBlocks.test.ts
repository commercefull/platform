import { ReorderPageBlocksUseCase, ReorderPageBlocksCommand } from './ReorderPageBlocks';
import { ContentBlockNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { lazyMock, createContentPage, createContentBlock } from '../../../tests/testUtils';

describe('ReorderPageBlocksUseCase', () => {
  let useCase: ReorderPageBlocksUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ReorderPageBlocksUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof ReorderPageBlocksUseCase>[0]>();
    mockRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'p1' }));
    mockRepo.findBlocksByPageId.mockResolvedValue([createContentBlock({ contentBlockId: 'b1' }), createContentBlock({ contentBlockId: 'b2' })]);
    mockRepo.reorderBlocks.mockResolvedValue(true);
    useCase = new ReorderPageBlocksUseCase(mockRepo);
  });

  it('should reorder blocks successfully', async () => {
    const result = await useCase.execute(
      new ReorderPageBlocksCommand('p1', [
        { id: 'b1', order: 1 },
        { id: 'b2', order: 0 },
      ]),
    );

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
