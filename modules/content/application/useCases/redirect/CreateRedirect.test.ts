jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreateRedirectUseCase, CreateRedirectCommand } from './CreateRedirect';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CreateRedirectUseCase', () => {
  let useCase: CreateRedirectUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      createRedirect: jest.fn().mockResolvedValue({
        contentRedirectId: 'r1', sourceUrl: '/old', targetUrl: '/new',
        statusCode: '301', isRegex: false, isActive: true, hits: 0, createdAt: new Date(),
      }),
    };
    useCase = new CreateRedirectUseCase(mockRepo as never);
  });

  it('should create a redirect successfully', async () => {
    const result = await useCase.execute(new CreateRedirectCommand('/old', '/new'));

    expect(result.id).toBe('r1');
    expect(eventBus.emit).toHaveBeenCalledWith('content.redirect.created', expect.objectContaining({ redirectId: 'r1' }));
  });

  it('should throw ContentValidationError when source or target missing', async () => {
    await expect(useCase.execute(new CreateRedirectCommand('', '/new'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new CreateRedirectCommand('/old', ''))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentValidationError when source equals target', async () => {
    await expect(useCase.execute(new CreateRedirectCommand('/same', '/same'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentValidationError for invalid regex', async () => {
    await expect(useCase.execute(new CreateRedirectCommand('[invalid', '/new', 301, true))).rejects.toThrow(ContentValidationError);
  });
});
