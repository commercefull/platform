jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { AddBlockToPageUseCase, AddBlockToPageCommand } from './AddBlockToPage';
import { ContentPageNotFoundError, ContentTypeNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('AddBlockToPageUseCase', () => {
  let useCase: AddBlockToPageUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findPageById: jest.fn().mockResolvedValue({ contentPageId: 'p1' }),
      findBlockTypeById: jest.fn().mockResolvedValue({ contentBlockTypeId: 'bt-1', name: 'Text', slug: 'text' }),
      findBlocksByPageId: jest.fn().mockResolvedValue([]),
      createBlock: jest.fn().mockResolvedValue({
        contentBlockId: 'b1', contentPageId: 'p1', blockTypeId: 'bt-1', title: 'Hero',
        sortOrder: 0, content: { text: 'Hello' }, isVisible: true, createdAt: new Date(),
      }),
    };
    useCase = new AddBlockToPageUseCase(mockRepo as never);
  });

  it('should add a block to a page', async () => {
    const result = await useCase.execute(new AddBlockToPageCommand('p1', 'bt-1', 'Hero', { text: 'Hello' }));

    expect(result.contentBlockId).toBe('b1');
    expect(eventBus.emit).toHaveBeenCalledWith('content.block.created', expect.objectContaining({ blockId: 'b1' }));
  });

  it('should auto-assign sort order when not provided', async () => {
    mockRepo.findBlocksByPageId.mockResolvedValue([{ contentBlockId: 'b1' }, { contentBlockId: 'b2' }]);
    mockRepo.createBlock.mockResolvedValue({
      contentBlockId: 'b3', contentPageId: 'p1', blockTypeId: 'bt-1', title: 'Third',
      sortOrder: 2, content: {}, isVisible: true, createdAt: new Date(),
    });

    const result = await useCase.execute(new AddBlockToPageCommand('p1', 'bt-1', 'Third', {}));

    expect(result.sortOrder).toBe(2);
  });

  it('should throw ContentValidationError when required fields missing', async () => {
    await expect(useCase.execute(new AddBlockToPageCommand('', 'bt-1', 'Title', {}))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new AddBlockToPageCommand('p1', '', 'Title', {}))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new AddBlockToPageCommand('p1', 'bt-1', '', {}))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when page does not exist', async () => {
    mockRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new AddBlockToPageCommand('missing', 'bt-1', 'Title', {}))).rejects.toThrow(ContentPageNotFoundError);
  });

  it('should throw ContentTypeNotFoundError when block type does not exist', async () => {
    mockRepo.findBlockTypeById.mockResolvedValue(null);

    await expect(useCase.execute(new AddBlockToPageCommand('p1', 'missing', 'Title', {}))).rejects.toThrow(ContentTypeNotFoundError);
  });
});
