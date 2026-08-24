jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { DuplicatePageUseCase, DuplicatePageCommand } from './DuplicatePage';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('DuplicatePageUseCase', () => {
  let useCase: DuplicatePageUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findPageById: jest.fn().mockResolvedValue({
        contentPageId: 'p1', title: 'Original', slug: 'original', contentTypeId: 'ct-1',
        templateId: null, visibility: 'public', summary: null, featuredImage: null,
        metaTitle: null, metaDescription: null, metaKeywords: null, customFields: null,
      }),
      createPage: jest.fn().mockResolvedValue({ contentPageId: 'p2', title: 'Copy', slug: 'copy', contentTypeId: 'ct-1', status: 'draft', createdAt: new Date() }),
      findBlocksByPageId: jest.fn().mockResolvedValue([]),
      createBlock: jest.fn().mockResolvedValue({}),
    };
    useCase = new DuplicatePageUseCase(mockRepo as never);
  });

  it('should duplicate a page with its blocks', async () => {
    mockRepo.findBlocksByPageId.mockResolvedValue([
      { contentBlockId: 'b1', blockTypeId: 'bt-1', title: 'Block 1', sortOrder: 0, content: {}, isVisible: true },
    ]);

    const result = await useCase.execute(new DuplicatePageCommand('p1', 'Copy', 'copy'));

    expect(result.contentPageId).toBe('p2');
    expect(result.blocksCopied).toBe(1);
    expect(eventBus.emit).toHaveBeenCalled();
  });

  it('should throw ContentValidationError when required fields missing', async () => {
    await expect(useCase.execute(new DuplicatePageCommand('', 'Copy', 'copy'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new DuplicatePageCommand('p1', '', 'copy'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when original does not exist', async () => {
    mockRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new DuplicatePageCommand('missing', 'Copy', 'copy'))).rejects.toThrow(ContentPageNotFoundError);
  });
});
