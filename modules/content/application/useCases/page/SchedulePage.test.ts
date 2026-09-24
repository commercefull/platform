import { lazyMock, createContentPage, emitMock } from '../../../tests/testUtils';
import { SchedulePageUseCase, SchedulePageCommand } from './SchedulePage';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('SchedulePageUseCase', () => {
  let useCase: SchedulePageUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof SchedulePageUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof SchedulePageUseCase>[0]>();
    mockRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'p1', title: 'Post', slug: 'post' }));
    mockRepo.updatePage.mockResolvedValue(
      createContentPage({ contentPageId: 'p1', title: 'Post', slug: 'post', status: 'scheduled', scheduledAt: new Date(Date.now() + 86400000) }),
    );
    useCase = new SchedulePageUseCase(mockRepo);
  });

  it('should schedule a page for future publication', async () => {
    const result = await useCase.execute(new SchedulePageCommand('p1', new Date(Date.now() + 86400000)));

    expect(result.status).toBe('scheduled');
    expect(emitMock).toHaveBeenCalled();
  });

  it('should throw ContentValidationError when scheduled date is in the past', async () => {
    await expect(useCase.execute(new SchedulePageCommand('p1', new Date(Date.now() - 86400000)))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentValidationError when page is already published', async () => {
    mockRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'p1', status: 'published' }));

    await expect(useCase.execute(new SchedulePageCommand('p1', new Date(Date.now() + 86400000)))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when page does not exist', async () => {
    mockRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new SchedulePageCommand('missing', new Date(Date.now() + 86400000)))).rejects.toThrow(
      ContentPageNotFoundError,
    );
  });
});
