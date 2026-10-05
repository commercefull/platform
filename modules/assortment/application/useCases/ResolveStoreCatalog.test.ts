import {
  createStoreAssortment,
  createStoreAssortmentRepository,
  createStoreLookupPort,
  createCatalogPort,
  createCollectionRepository,
  createCollectionMapRepository,
  createEntry,
  productRef,
  STORE_ID,
} from '../../tests/testUtils';
import { ResolveStoreCatalogUseCase, ResolveStoreCatalogCommand } from './ResolveStoreCatalog';
import { ResolveCollectionProductsUseCase } from './ResolveCollectionProducts';
import { StoreAssortmentNotFoundError } from '../../domain/errors/AssortmentErrors';

function makeResolver(maps = [] as never[]) {
  return new ResolveCollectionProductsUseCase(createCollectionRepository(), createCollectionMapRepository(maps), createCatalogPort());
}

describe('ResolveStoreCatalogUseCase', () => {
  it('should throw when store does not exist', async () => {
    const useCase = new ResolveStoreCatalogUseCase(
      createStoreAssortmentRepository(),
      makeResolver(),
      createCatalogPort(),
      createStoreLookupPort(false),
    );
    await expect(useCase.execute(new ResolveStoreCatalogCommand(STORE_ID))).rejects.toThrow(StoreAssortmentNotFoundError);
  });

  it('should return full catalog when no assortment row exists', async () => {
    const catalog = createCatalogPort([productRef('p-1'), productRef('p-2')]);
    const useCase = new ResolveStoreCatalogUseCase(createStoreAssortmentRepository(), makeResolver(), catalog, createStoreLookupPort());

    const result = await useCase.execute(new ResolveStoreCatalogCommand(STORE_ID));

    expect(result.mode).toBe('all');
    expect(result.products).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should exclude blocked products in all mode', async () => {
    const entries = [createEntry({ targetId: 'p-2', effect: 'exclude' })];
    const catalog = createCatalogPort([productRef('p-1'), productRef('p-2')]);
    const useCase = new ResolveStoreCatalogUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'exclude'), entries),
      makeResolver(),
      catalog,
      createStoreLookupPort(),
    );

    const result = await useCase.execute(new ResolveStoreCatalogCommand(STORE_ID));

    expect(result.products.map(p => p.productId)).toEqual(['p-1']);
    expect(result.total).toBe(1);
  });

  it('should hide isHidden product entries from the catalog', async () => {
    const entries = [createEntry({ targetId: 'p-1', effect: 'include', isHidden: true })];
    const catalog = createCatalogPort([productRef('p-1'), productRef('p-2')]);
    const useCase = new ResolveStoreCatalogUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'all'), entries),
      makeResolver(),
      catalog,
      createStoreLookupPort(),
    );

    const result = await useCase.execute(new ResolveStoreCatalogCommand(STORE_ID));

    expect(result.products.map(p => p.productId)).toEqual(['p-2']);
  });

  it('should return only included products in include mode', async () => {
    const entries = [
      createEntry({ targetId: 'p-1', effect: 'include' }),
      createEntry({ targetId: 'p-2', effect: 'include' }),
      createEntry({ targetId: 'p-2', effect: 'exclude', assortmentStoreEntryId: 'e2' }),
    ];
    const catalog = createCatalogPort([productRef('p-1'), productRef('p-2'), productRef('p-3')]);
    const useCase = new ResolveStoreCatalogUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'include'), entries),
      makeResolver(),
      catalog,
      createStoreLookupPort(),
    );

    const result = await useCase.execute(new ResolveStoreCatalogCommand(STORE_ID));

    expect(result.mode).toBe('include');
    expect(result.products.map(p => p.productId)).toEqual(['p-1']);
    expect(result.total).toBe(1);
  });

  it('should expand category entries through the catalog when including', async () => {
    const entries = [createEntry({ targetType: 'category', targetId: 'cat-1', effect: 'include' })];
    const catalog = createCatalogPort([productRef('p-5')]);
    const useCase = new ResolveStoreCatalogUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'include'), entries),
      makeResolver(),
      catalog,
      createStoreLookupPort(),
    );

    const result = await useCase.execute(new ResolveStoreCatalogCommand(STORE_ID));

    expect(catalog.searchProducts).toHaveBeenCalledWith({ categoryId: 'cat-1' }, 1000, 0);
    expect(result.products.map(p => p.productId)).toEqual(['p-5']);
  });

  it('should apply channel-scoped exclude entries only when resolving that channel', async () => {
    const entries = [
      createEntry({ targetId: 'p-2', effect: 'exclude', channelId: 'ch-agentic' }),
      createEntry({ targetId: 'p-3', effect: 'exclude', assortmentStoreEntryId: 'e2' }),
    ];
    const catalog = createCatalogPort([productRef('p-1'), productRef('p-2'), productRef('p-3')]);
    const useCase = new ResolveStoreCatalogUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'exclude'), entries),
      makeResolver(),
      catalog,
      createStoreLookupPort(),
    );

    // Unscoped resolution: only the store-wide exclude applies.
    const web = await useCase.execute(new ResolveStoreCatalogCommand(STORE_ID));
    expect(web.products.map(p => p.productId)).toEqual(['p-1', 'p-2']);

    // Channel resolution: both the store-wide and channel-scoped excludes apply.
    const channel = await useCase.execute(new ResolveStoreCatalogCommand(STORE_ID, 100, 0, 'ch-agentic'));
    expect(channel.products.map(p => p.productId)).toEqual(['p-1']);
  });

  it('should apply channel-scoped include entries only when resolving that channel', async () => {
    const entries = [
      createEntry({ targetId: 'p-1', effect: 'include' }),
      createEntry({ targetId: 'p-2', effect: 'include', channelId: 'ch-agentic', assortmentStoreEntryId: 'e2' }),
    ];
    const catalog = createCatalogPort([productRef('p-1'), productRef('p-2')]);
    const useCase = new ResolveStoreCatalogUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'include'), entries),
      makeResolver(),
      catalog,
      createStoreLookupPort(),
    );

    const web = await useCase.execute(new ResolveStoreCatalogCommand(STORE_ID));
    expect(web.products.map(p => p.productId)).toEqual(['p-1']);

    const channel = await useCase.execute(new ResolveStoreCatalogCommand(STORE_ID, 100, 0, 'ch-agentic'));
    expect(channel.products.map(p => p.productId).sort()).toEqual(['p-1', 'p-2']);
  });

  describe('resolveAssortmentFilter', () => {
    it('should return null when the assortment does not constrain the catalog', async () => {
      const useCase = new ResolveStoreCatalogUseCase(
        createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'all')),
        makeResolver(),
        createCatalogPort(),
        createStoreLookupPort(),
      );

      expect(await useCase.resolveAssortmentFilter(STORE_ID)).toBeNull();
      expect(await useCase.resolveAssortmentFilter(STORE_ID, 'ch-1')).toBeNull();
    });

    it('should return excludeProductIds for exclude/hidden entries', async () => {
      const entries = [
        createEntry({ targetId: 'p-1', effect: 'exclude' }),
        createEntry({ targetId: 'p-2', effect: 'include', isHidden: true, assortmentStoreEntryId: 'e2' }),
      ];
      const useCase = new ResolveStoreCatalogUseCase(
        createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'all'), entries),
        makeResolver(),
        createCatalogPort(),
        createStoreLookupPort(),
      );

      const filter = await useCase.resolveAssortmentFilter(STORE_ID);
      expect(filter?.excludeProductIds?.sort()).toEqual(['p-1', 'p-2']);
      expect(filter?.includeProductIds).toBeUndefined();
    });

    it('should return includeProductIds for include mode with excludes applied', async () => {
      const entries = [
        createEntry({ targetId: 'p-1', effect: 'include' }),
        createEntry({ targetId: 'p-2', effect: 'include', assortmentStoreEntryId: 'e2' }),
        createEntry({ targetId: 'p-2', effect: 'exclude', assortmentStoreEntryId: 'e3' }),
      ];
      const useCase = new ResolveStoreCatalogUseCase(
        createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'include'), entries),
        makeResolver(),
        createCatalogPort(),
        createStoreLookupPort(),
      );

      const filter = await useCase.resolveAssortmentFilter(STORE_ID);
      expect(filter).toEqual({ includeProductIds: ['p-1'] });
    });

    it('should scope the filter by channel', async () => {
      const entries = [
        createEntry({ targetId: 'p-1', effect: 'include' }),
        createEntry({ targetId: 'p-2', effect: 'include', channelId: 'ch-agentic', assortmentStoreEntryId: 'e2' }),
      ];
      const useCase = new ResolveStoreCatalogUseCase(
        createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'include'), entries),
        makeResolver(),
        createCatalogPort(),
        createStoreLookupPort(),
      );

      expect(await useCase.resolveAssortmentFilter(STORE_ID)).toEqual({ includeProductIds: ['p-1'] });
      expect(await useCase.resolveAssortmentFilter(STORE_ID, 'ch-agentic')).toEqual({
        includeProductIds: expect.arrayContaining(['p-1', 'p-2']),
      });
      expect(await useCase.resolveAssortmentFilter(STORE_ID, 'ch-other')).toEqual({ includeProductIds: ['p-1'] });
    });
  });
});
