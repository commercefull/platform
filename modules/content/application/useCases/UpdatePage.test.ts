import { lazyMock, createContentPage, emitMock } from '../../tests/testUtils';
import { UpdatePageUseCase, UpdatePageCommand } from './UpdatePage';
import { ContentPageNotFoundError, ContentValidationError } from '../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('UpdatePageUseCase', () => {
  let useCase: UpdatePageUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof UpdatePageUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof UpdatePageUseCase>[0]>();
    mockRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'p1', title: 'Old', slug: 'old' }));
    mockRepo.updatePage.mockResolvedValue(createContentPage({ contentPageId: 'p1', title: 'New', slug: 'new', status: 'published' }));
    useCase = new UpdatePageUseCase(mockRepo);
  });

  it('should update a page successfully', async () => {
    const result = await useCase.execute(new UpdatePageCommand('p1', 'New', 'new', undefined, 'published'));

    expect(result.title).toBe('New');
    expect(result.status).toBe('published');
    expect(emitMock).toHaveBeenCalledWith('content.page.updated', expect.objectContaining({ pageId: 'p1' }));
  });

  it('should throw ContentValidationError when pageId is empty', async () => {
    await expect(useCase.execute(new UpdatePageCommand(''))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when page does not exist', async () => {
    mockRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdatePageCommand('missing'))).rejects.toThrow(ContentPageNotFoundError);
  });
});
