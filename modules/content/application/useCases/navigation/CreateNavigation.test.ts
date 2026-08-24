jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreateNavigationUseCase, CreateNavigationCommand } from './CreateNavigation';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CreateNavigationUseCase', () => {
  let useCase: CreateNavigationUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      createNavigation: jest.fn().mockResolvedValue({
        contentNavigationId: 'n1', name: 'Main Menu', slug: 'main-menu',
        description: null, location: 'header', isActive: true, createdAt: new Date(),
      }),
    };
    useCase = new CreateNavigationUseCase(mockRepo as never);
  });

  it('should create a navigation menu', async () => {
    const result = await useCase.execute(new CreateNavigationCommand('Main Menu', 'main-menu', undefined, 'header'));

    expect(result.id).toBe('n1');
    expect(eventBus.emit).toHaveBeenCalledWith('content.navigation.created', expect.objectContaining({ navigationId: 'n1' }));
  });

  it('should throw ContentValidationError when name or slug missing', async () => {
    await expect(useCase.execute(new CreateNavigationCommand('', 'slug'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new CreateNavigationCommand('Name', ''))).rejects.toThrow(ContentValidationError);
  });
});
