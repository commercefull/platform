import { GetNavigationWithItemsUseCase, GetNavigationWithItemsQuery } from './GetNavigationWithItems';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';
import { lazyMock, createContentNavigation, createContentNavigationItem } from '../../../tests/testUtils';

describe('GetNavigationWithItemsUseCase', () => {
  let useCase: GetNavigationWithItemsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof GetNavigationWithItemsUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof GetNavigationWithItemsUseCase>[0]>();
    mockRepo.findNavigationById.mockResolvedValue(null);
    mockRepo.findNavigationBySlug.mockResolvedValue(null);
    mockRepo.findNavigationByLocation.mockResolvedValue(null);
    mockRepo.findAllNavigationItems.mockResolvedValue([]);
    useCase = new GetNavigationWithItemsUseCase(mockRepo);
  });

  it('should get navigation by ID with items as tree', async () => {
    mockRepo.findNavigationById.mockResolvedValue(
      createContentNavigation({ contentNavigationId: 'n1', name: 'Main', slug: 'main', location: 'header' }),
    );
    mockRepo.findAllNavigationItems.mockResolvedValue([
      createContentNavigationItem({
        contentNavigationItemId: 'ni1',
        parentId: null,
        title: 'Home',
        url: '/',
        isActive: true,
        sortOrder: 0,
      }),
      createContentNavigationItem({
        contentNavigationItemId: 'ni2',
        parentId: 'ni1',
        title: 'About',
        url: '/about',
        isActive: true,
        sortOrder: 0,
      }),
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
    mockRepo.findNavigationById.mockResolvedValue(createContentNavigation({ contentNavigationId: 'n1', name: 'Main', slug: 'main' }));
    mockRepo.findAllNavigationItems.mockResolvedValue([
      createContentNavigationItem({
        contentNavigationItemId: 'ni1',
        parentId: null,
        title: 'Active',
        url: '/',
        isActive: true,
        sortOrder: 0,
      }),
      createContentNavigationItem({
        contentNavigationItemId: 'ni2',
        parentId: null,
        title: 'Inactive',
        url: '/hidden',
        isActive: false,
        sortOrder: 1,
      }),
    ]);

    const result = await useCase.execute(new GetNavigationWithItemsQuery('n1'));

    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].title).toBe('Active');
  });

  it('should drop items whose conditions do not match the context', async () => {
    mockRepo.findNavigationById.mockResolvedValue(createContentNavigation({ contentNavigationId: 'n1', name: 'Main', slug: 'main' }));
    mockRepo.findAllNavigationItems.mockResolvedValue([
      createContentNavigationItem({
        contentNavigationItemId: 'ni1',
        parentId: null,
        title: 'Global',
        url: '/',
        isActive: true,
        sortOrder: 0,
      }),
      createContentNavigationItem({
        contentNavigationItemId: 'ni2',
        parentId: null,
        title: 'EU Only',
        url: '/eu',
        isActive: true,
        sortOrder: 1,
        conditions: { channelIds: ['ch-eu'] },
      }),
    ]);

    const matching = await useCase.execute(new GetNavigationWithItemsQuery('n1', undefined, undefined, false, { channelId: 'ch-eu' }));
    expect(matching!.items.map(i => i.title)).toEqual(['Global', 'EU Only']);

    const notMatching = await useCase.execute(new GetNavigationWithItemsQuery('n1', undefined, undefined, false, { channelId: 'ch-us' }));
    expect(notMatching!.items.map(i => i.title)).toEqual(['Global']);
  });

  it('should hide children when a scoped-out parent is filtered', async () => {
    mockRepo.findNavigationById.mockResolvedValue(createContentNavigation({ contentNavigationId: 'n1', name: 'Main', slug: 'main' }));
    mockRepo.findAllNavigationItems.mockResolvedValue([
      createContentNavigationItem({
        contentNavigationItemId: 'ni1',
        parentId: null,
        title: 'DE Menu',
        url: '/de',
        isActive: true,
        sortOrder: 0,
        conditions: { locales: ['de-DE'] },
      }),
      createContentNavigationItem({
        contentNavigationItemId: 'ni2',
        parentId: 'ni1',
        title: 'DE Child',
        url: '/de/kind',
        isActive: true,
        sortOrder: 0,
      }),
    ]);

    const result = await useCase.execute(new GetNavigationWithItemsQuery('n1', undefined, undefined, false, { locale: 'fr-FR' }));

    expect(result!.items).toHaveLength(0);
  });
});
