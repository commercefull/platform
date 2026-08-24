import { GetNavigationWithItemsUseCase, GetNavigationWithItemsQuery } from './GetNavigationWithItems';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';

describe('GetNavigationWithItemsUseCase', () => {
  let useCase: GetNavigationWithItemsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findNavigationById: jest.fn().mockResolvedValue(null),
      findNavigationBySlug: jest.fn().mockResolvedValue(null),
      findNavigationByLocation: jest.fn().mockResolvedValue(null),
      findAllNavigationItems: jest.fn().mockResolvedValue([]),
    };
    useCase = new GetNavigationWithItemsUseCase(mockRepo as never);
  });

  it('should get navigation by ID with items as tree', async () => {
    mockRepo.findNavigationById.mockResolvedValue({
      contentNavigationId: 'n1', name: 'Main', slug: 'main', description: null, location: 'header', isActive: true,
    });
    mockRepo.findAllNavigationItems.mockResolvedValue([
      { contentNavigationItemId: 'ni1', navigationId: 'n1', parentId: null, title: 'Home', type: 'url', url: '/', contentPageId: null, targetSlug: null, icon: null, cssClasses: null, openInNewTab: false, isActive: true, sortOrder: 0 },
      { contentNavigationItemId: 'ni2', navigationId: 'n1', parentId: 'ni1', title: 'About', type: 'url', url: '/about', contentPageId: null, targetSlug: null, icon: null, cssClasses: null, openInNewTab: false, isActive: true, sortOrder: 0 },
    ]);

    const result = await useCase.execute(new GetNavigationWithItemsQuery('n1'));

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Main');
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].title).toBe('Home');
    expect(result!.items[0].children).toHaveLength(1);
    expect(result!.items[0].children[0].title).toBe('About');
  });

  it('should return null when navigation not found', async () => {
    const result = await useCase.execute(new GetNavigationWithItemsQuery('missing'));

    expect(result).toBeNull();
  });

  it('should throw ContentValidationError when no identifier provided', async () => {
    await expect(useCase.execute(new GetNavigationWithItemsQuery())).rejects.toThrow(ContentValidationError);
  });

  it('should filter inactive items by default', async () => {
    mockRepo.findNavigationById.mockResolvedValue({
      contentNavigationId: 'n1', name: 'Main', slug: 'main', description: null, location: null, isActive: true,
    });
    mockRepo.findAllNavigationItems.mockResolvedValue([
      { contentNavigationItemId: 'ni1', navigationId: 'n1', parentId: null, title: 'Active', type: 'url', url: '/', contentPageId: null, targetSlug: null, icon: null, cssClasses: null, openInNewTab: false, isActive: true, sortOrder: 0 },
      { contentNavigationItemId: 'ni2', navigationId: 'n1', parentId: null, title: 'Inactive', type: 'url', url: '/hidden', contentPageId: null, targetSlug: null, icon: null, cssClasses: null, openInNewTab: false, isActive: false, sortOrder: 1 },
    ]);

    const result = await useCase.execute(new GetNavigationWithItemsQuery('n1'));

    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].title).toBe('Active');
  });
});
