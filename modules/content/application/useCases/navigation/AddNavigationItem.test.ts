jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { AddNavigationItemUseCase, AddNavigationItemCommand } from './AddNavigationItem';
import { NavigationMenuNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('AddNavigationItemUseCase', () => {
  let useCase: AddNavigationItemUseCase;
  let mockNavRepo: Record<string, jest.Mock>;
  let mockContentRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockNavRepo = {
      findNavigationById: jest.fn().mockResolvedValue({ contentNavigationId: 'n1' }),
      findNavigationItemById: jest.fn().mockResolvedValue(null),
      createNavigationItem: jest.fn().mockResolvedValue({
        contentNavigationItemId: 'ni1', navigationId: 'n1', parentId: null,
        title: 'Home', type: 'url', url: '/', contentPageId: null,
        isActive: true, sortOrder: 0, depth: 0,
      }),
    };
    mockContentRepo = { findPageById: jest.fn().mockResolvedValue(null) };
    useCase = new AddNavigationItemUseCase(mockNavRepo as never, mockContentRepo as never);
  });

  it('should add a navigation item', async () => {
    const result = await useCase.execute(new AddNavigationItemCommand('n1', 'Home', 'url', undefined, '/'));

    expect(result.id).toBe('ni1');
    expect(eventBus.emit).toHaveBeenCalledWith('content.navigation.item_added', expect.objectContaining({ itemId: 'ni1' }));
  });

  it('should throw ContentValidationError when required fields missing', async () => {
    await expect(useCase.execute(new AddNavigationItemCommand('', 'Home', 'url'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new AddNavigationItemCommand('n1', '', 'url'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw NavigationMenuNotFoundError when navigation does not exist', async () => {
    mockNavRepo.findNavigationById.mockResolvedValue(null);

    await expect(useCase.execute(new AddNavigationItemCommand('missing', 'Home', 'url', undefined, '/'))).rejects.toThrow(NavigationMenuNotFoundError);
  });

  it('should throw ContentValidationError when URL type has no url', async () => {
    await expect(useCase.execute(new AddNavigationItemCommand('n1', 'Home', 'url'))).rejects.toThrow(ContentValidationError);
  });

  it('should set depth based on parent item', async () => {
    mockNavRepo.findNavigationItemById.mockResolvedValue({ contentNavigationItemId: 'parent', depth: 1 });
    mockNavRepo.createNavigationItem.mockResolvedValue({
      contentNavigationItemId: 'ni2', navigationId: 'n1', parentId: 'parent',
      title: 'Sub', type: 'url', url: '/sub', contentPageId: null,
      isActive: true, sortOrder: 0, depth: 2,
    });

    const result = await useCase.execute(new AddNavigationItemCommand('n1', 'Sub', 'url', 'parent', '/sub'));

    expect(result.depth).toBe(2);
  });
});
