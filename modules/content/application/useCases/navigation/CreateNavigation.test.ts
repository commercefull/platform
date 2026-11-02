import { lazyMock, createContentNavigation, emitMock } from '../../../tests/testUtils';
import { CreateNavigationUseCase, CreateNavigationCommand } from './CreateNavigation';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('CreateNavigationUseCase', () => {
  let useCase: CreateNavigationUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof CreateNavigationUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof CreateNavigationUseCase>[0]>();
    mockRepo.createNavigation.mockImplementation(async params => createContentNavigation({ ...params, contentNavigationId: 'n1' }));
    useCase = new CreateNavigationUseCase(mockRepo);
  });

  it('should create a navigation menu', async () => {
    const result = await useCase.execute(new CreateNavigationCommand({ name: 'Main Menu', slug: 'main-menu', location: 'header' }));

    expect(result.id).toBe('n1');
    expect(emitMock).toHaveBeenCalledWith('content.navigation.created', expect.objectContaining({ navigationId: 'n1' }));
  });

  it('should throw ContentValidationError when name or slug missing', async () => {
    await expect(useCase.execute(new CreateNavigationCommand({ name: '', slug: 'slug' }))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new CreateNavigationCommand({ name: 'Name', slug: '' }))).rejects.toThrow(ContentValidationError);
  });
});
