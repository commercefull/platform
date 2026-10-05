import {
  createCollection,
  createCollectionRepository,
  createCollectionMapRepository,
  createCatalogPort,
  createMap,
  productRef,
  COLLECTION_ID,
} from '../../tests/testUtils';
import { BrowseCollectionsUseCase } from './BrowseCollections';
import { ResolveCollectionProductsUseCase } from './ResolveCollectionProducts';
import { CollectionNotFoundError } from '../../domain/errors/AssortmentErrors';

function makeResolver(collectionRepo = createCollectionRepository(), catalog = createCatalogPort()) {
  return new ResolveCollectionProductsUseCase(collectionRepo, createCollectionMapRepository(), catalog);
}

describe('BrowseCollectionsUseCase', () => {
  it('should list only published collections', async () => {
    const published = createCollection();
    const unpublished = createCollection({ isActive: false, assortmentCollectionId: 'c-2' });
    const collectionRepo = createCollectionRepository();
    collectionRepo.findAll.mockResolvedValue([published, unpublished]);

    const useCase = new BrowseCollectionsUseCase(collectionRepo, makeResolver());
    const result = await useCase.list();

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('test-collection');
  });

  it('should throw when slug does not exist', async () => {
    const collectionRepo = createCollectionRepository(null);
    collectionRepo.findBySlug.mockResolvedValue(null);
    const useCase = new BrowseCollectionsUseCase(collectionRepo, makeResolver());
    await expect(useCase.getBySlug('missing')).rejects.toThrow(CollectionNotFoundError);
  });

  it('should throw when collection is not published', async () => {
    const collectionRepo = createCollectionRepository();
    collectionRepo.findBySlug.mockResolvedValue(createCollection({ isActive: false }));
    const useCase = new BrowseCollectionsUseCase(collectionRepo, makeResolver());
    await expect(useCase.getBySlug('test-collection')).rejects.toThrow(CollectionNotFoundError);
  });

  it('should return collection page with resolved products', async () => {
    const collectionRepo = createCollectionRepository(createCollection());
    const resolver = new ResolveCollectionProductsUseCase(
      collectionRepo,
      createCollectionMapRepository([createMap({ productId: 'p-1' })]),
      createCatalogPort([productRef('p-1')]),
    );
    const useCase = new BrowseCollectionsUseCase(collectionRepo, resolver);

    const page = await useCase.getBySlug('test-collection');

    expect(page.collection.assortmentCollectionId).toBe(COLLECTION_ID);
    expect(page.products).toHaveLength(1);
    expect(page.total).toBe(1);
  });

  describe('store/channel scoping', () => {
    it('should list only collections visible in the request scope, ordered by scope sortOrder', async () => {
      const a = createCollection({ assortmentCollectionId: 'c-a', slug: 'a' });
      const b = createCollection({ assortmentCollectionId: 'c-b', slug: 'b' });
      const collectionRepo = createCollectionRepository();
      collectionRepo.findAll.mockResolvedValue([a, b]);
      collectionRepo.resolveVisibleCollections.mockResolvedValue([
        { assortmentCollectionId: 'c-b', sortOrder: 1 },
        { assortmentCollectionId: 'c-a', sortOrder: 2 },
      ]);
      const useCase = new BrowseCollectionsUseCase(collectionRepo, makeResolver());

      const result = await useCase.list('org-1', { storeId: 's-1', channelId: 'ch-1' });

      expect(collectionRepo.resolveVisibleCollections).toHaveBeenCalledWith({ storeId: 's-1', channelId: 'ch-1' });
      expect(result.map(c => c.assortmentCollectionId)).toEqual(['c-b', 'c-a']);
    });

    it('should exclude collections not visible in the request scope', async () => {
      const a = createCollection({ assortmentCollectionId: 'c-a' });
      const hidden = createCollection({ assortmentCollectionId: 'c-hidden', slug: 'hidden' });
      const collectionRepo = createCollectionRepository();
      collectionRepo.findAll.mockResolvedValue([a, hidden]);
      collectionRepo.resolveVisibleCollections.mockResolvedValue([{ assortmentCollectionId: 'c-a' }]);
      const useCase = new BrowseCollectionsUseCase(collectionRepo, makeResolver());

      const result = await useCase.list('org-1', { storeId: 's-1' });

      expect(result).toHaveLength(1);
      expect(result[0].assortmentCollectionId).toBe('c-a');
    });

    it('should return all published collections when no scope is given', async () => {
      const collectionRepo = createCollectionRepository(createCollection());
      const useCase = new BrowseCollectionsUseCase(collectionRepo, makeResolver());

      await useCase.list();

      expect(collectionRepo.resolveVisibleCollections).not.toHaveBeenCalled();
    });

    it('should throw when the collection is not visible in the request scope', async () => {
      const collectionRepo = createCollectionRepository(createCollection());
      collectionRepo.resolveVisibleCollections.mockResolvedValue([]);
      const useCase = new BrowseCollectionsUseCase(collectionRepo, makeResolver());

      await expect(useCase.getBySlug('test-collection', 50, 0, undefined, { storeId: 's-1', channelId: 'ch-1' })).rejects.toThrow(
        CollectionNotFoundError,
      );
    });
  });
});
