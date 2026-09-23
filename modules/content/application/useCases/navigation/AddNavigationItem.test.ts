import { lazyMock, createContentNavigation, createContentNavigationItem, emitMock } from '../../../tests/testUtils';
import { AddNavigationItemUseCase, AddNavigationItemCommand } from './AddNavigationItem';
import { NavigationMenuNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('AddNavigationItemUseCase', () => {
  let useCase: AddNavigationItemUseCase;
  let mockNavRepo: jest.Mocked<ConstructorParameters<typeof AddNavigationItemUseCase>[0]>;
  let mockContentRepo: jest.Mocked<ConstructorParameters<typeof AddNavigationItemUseCase>[1]>;

  beforeEach(() => {
    mockNavRepo = lazyMock<ConstructorParameters<typeof AddNavigationItemUseCase>[0]>();
    mockNavRepo.findNavigationById.mockResolvedValue(createContentNavigation({ contentNavigationId: 'n1' }));
    mockNavRepo.createNavigationItem.mockImplementation(async (params) =>
      createContentNavigationItem({ ...params, contentNavigationItemId: 'ni1' }),
    );
    mockContentRepo = lazyMock<ConstructorParameters<typeof AddNavigationItemUseCase>[1]>();
    mockContentRepo.findPageById.mockResolvedValue(null);
    useCase = new AddNavigationItemUseCase(mockNavRepo, mockContentRepo);
  });

  it('should add a navigation item', async () => {
    const result = await useCase.execute(new AddNavigationItemCommand('n1', 'Home', 'url', undefined, '/'));

    expect(result.id).toBe('ni1');
    expect(emitMock).toHaveBeenCalledWith('content.navigation.item_added', expect.objectContaining({ itemId: 'ni1' }));
  });

  it('should throw ContentValidationError when required fields missing', async () => {
    await expect(useCase.execute(new AddNavigationItemCommand('', 'Home', 'url'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new AddNavigationItemCommand('n1', '', 'url'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw NavigationMenuNotFoundError when navigation does not exist', async () => {
    mockNavRepo.findNavigationById.mockResolvedValue(null);

    await expect(useCase.execute(new AddNavigationItemCommand('missing', 'Home', 'url', undefined, '/'))).rejects.toThrow(
      NavigationMenuNotFoundError,
    );
  });

  it('should throw ContentValidationError when URL type has no url', async () => {
    await expect(useCase.execute(new AddNavigationItemCommand('n1', 'Home', 'url'))).rejects.toThrow(ContentValidationError);
  });

  it('should set depth based on parent item', async () => {
    mockNavRepo.findNavigationItemById.mockResolvedValue(createContentNavigationItem({ contentNavigationItemId: 'parent', depth: 1 }));
    mockNavRepo.createNavigationItem.mockResolvedValue(
      createContentNavigationItem({ contentNavigationItemId: 'ni2', parentId: 'parent', title: 'Sub', url: '/sub', depth: 2 }),
    );

    const result = await useCase.execute(new AddNavigationItemCommand('n1', 'Sub', 'url', 'parent', '/sub'));

    expect(result.depth).toBe(2);
  });
});
