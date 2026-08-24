jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { SchedulePageUseCase, SchedulePageCommand } from './SchedulePage';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('SchedulePageUseCase', () => {
  let useCase: SchedulePageUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findPageById: jest.fn().mockResolvedValue({ contentPageId: 'p1', title: 'Post', slug: 'post', status: 'draft' }),
      updatePage: jest.fn().mockResolvedValue({ contentPageId: 'p1', title: 'Post', slug: 'post', status: 'scheduled', scheduledAt: new Date(Date.now() + 86400000) }),
    };
    useCase = new SchedulePageUseCase(mockRepo as never);
  });

  it('should schedule a page for future publication', async () => {
    const result = await useCase.execute(new SchedulePageCommand('p1', new Date(Date.now() + 86400000)));

    expect(result.status).toBe('scheduled');
    expect(eventBus.emit).toHaveBeenCalled();
  });

  it('should throw ContentValidationError when scheduled date is in the past', async () => {
    await expect(useCase.execute(new SchedulePageCommand('p1', new Date(Date.now() - 86400000)))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentValidationError when page is already published', async () => {
    mockRepo.findPageById.mockResolvedValue({ contentPageId: 'p1', status: 'published' });

    await expect(useCase.execute(new SchedulePageCommand('p1', new Date(Date.now() + 86400000)))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when page does not exist', async () => {
    mockRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new SchedulePageCommand('missing', new Date(Date.now() + 86400000)))).rejects.toThrow(ContentPageNotFoundError);
  });
});
