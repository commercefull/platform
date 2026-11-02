import { lazyMock, createContentPage, createContentBlock, createContentBlockType, emitMock } from '../../../tests/testUtils';
import { AddBlockToPageUseCase, AddBlockToPageCommand } from './AddBlockToPage';
import { ContentPageNotFoundError, ContentTypeNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('AddBlockToPageUseCase', () => {
  let useCase: AddBlockToPageUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof AddBlockToPageUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof AddBlockToPageUseCase>[0]>();
    mockRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'p1' }));
    mockRepo.findBlockTypeById.mockResolvedValue(createContentBlockType({ contentBlockTypeId: 'bt-1' }));
    mockRepo.findBlocksByPageId.mockResolvedValue([]);
    mockRepo.createBlock.mockImplementation(async params => createContentBlock({ ...params, contentBlockId: 'b1' }));
    useCase = new AddBlockToPageUseCase(mockRepo);
  });

  it('should add a block to a page', async () => {
    const result = await useCase.execute(
      new AddBlockToPageCommand({ contentPageId: 'p1', blockTypeId: 'bt-1', title: 'Hero', content: { text: 'Hello' } }),
    );

    expect(result.contentBlockId).toBe('b1');
    expect(emitMock).toHaveBeenCalledWith('content.block.created', expect.objectContaining({ blockId: 'b1' }));
  });

  it('should auto-assign sort order when not provided', async () => {
    mockRepo.findBlocksByPageId.mockResolvedValue([
      createContentBlock({ contentBlockId: 'b1' }),
      createContentBlock({ contentBlockId: 'b2' }),
    ]);
    mockRepo.createBlock.mockResolvedValue(createContentBlock({ contentBlockId: 'b3', title: 'Third', sortOrder: 2 }));

    const result = await useCase.execute(
      new AddBlockToPageCommand({ contentPageId: 'p1', blockTypeId: 'bt-1', title: 'Third', content: {} }),
    );

    expect(result.sortOrder).toBe(2);
  });

  it('should throw ContentValidationError when required fields missing', async () => {
    await expect(
      useCase.execute(new AddBlockToPageCommand({ contentPageId: '', blockTypeId: 'bt-1', title: 'Title', content: {} })),
    ).rejects.toThrow(ContentValidationError);
    await expect(
      useCase.execute(new AddBlockToPageCommand({ contentPageId: 'p1', blockTypeId: '', title: 'Title', content: {} })),
    ).rejects.toThrow(ContentValidationError);
    await expect(
      useCase.execute(new AddBlockToPageCommand({ contentPageId: 'p1', blockTypeId: 'bt-1', title: '', content: {} })),
    ).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when page does not exist', async () => {
    mockRepo.findPageById.mockResolvedValue(null);

    await expect(
      useCase.execute(new AddBlockToPageCommand({ contentPageId: 'missing', blockTypeId: 'bt-1', title: 'Title', content: {} })),
    ).rejects.toThrow(ContentPageNotFoundError);
  });

  it('should throw ContentTypeNotFoundError when block type does not exist', async () => {
    mockRepo.findBlockTypeById.mockResolvedValue(null);

    await expect(
      useCase.execute(new AddBlockToPageCommand({ contentPageId: 'p1', blockTypeId: 'missing', title: 'Title', content: {} })),
    ).rejects.toThrow(ContentTypeNotFoundError);
  });
});
