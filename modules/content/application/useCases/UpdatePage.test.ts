jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { UpdatePageUseCase, UpdatePageCommand } from './UpdatePage';
import { ContentPageNotFoundError, ContentValidationError } from '../../domain/errors/ContentErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('UpdatePageUseCase', () => {
  let useCase: UpdatePageUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findPageById: jest.fn().mockResolvedValue({
        contentPageId: 'p1', title: 'Old', slug: 'old', status: 'draft', contentTypeId: 'ct-1',
        templateId: null, visibility: 'public', summary: null, metaTitle: null, metaDescription: null,
        publishedAt: null, scheduledAt: null, isHomePage: false, createdAt: new Date(), updatedAt: new Date(),
      }),
      updatePage: jest.fn().mockResolvedValue({ contentPageId: 'p1', title: 'New', slug: 'new', status: 'published', updatedAt: new Date() }),
    };
    useCase = new UpdatePageUseCase(mockRepo as never);
  });

  it('should update a page successfully', async () => {
    const result = await useCase.execute(new UpdatePageCommand('p1', 'New', 'new', undefined, 'published'));

    expect(result.title).toBe('New');
    expect(result.status).toBe('published');
    expect(eventBus.emit).toHaveBeenCalledWith('content.page.updated', expect.objectContaining({ pageId: 'p1' }));
  });

  it('should throw ContentValidationError when pageId is empty', async () => {
    await expect(useCase.execute(new UpdatePageCommand(''))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when page does not exist', async () => {
    mockRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdatePageCommand('missing'))).rejects.toThrow(ContentPageNotFoundError);
  });
});
