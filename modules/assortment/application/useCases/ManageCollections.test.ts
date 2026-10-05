import {
  createCollection,
  createCollectionRepository,
  createCollectionMapRepository,
  createMap,
  emitMock,
  COLLECTION_ID,
  PRODUCT_ID,
} from '../../tests/testUtils';
import { ManageCollectionsUseCase } from './ManageCollections';
import { Collection } from '../../domain/entities/Collection';
import {
  AssortmentEntryNotFoundError,
  CollectionNotFoundError,
  CollectionSlugAlreadyExistsError,
  CollectionValidationError,
} from '../../domain/errors/AssortmentErrors';

describe('ManageCollectionsUseCase', () => {
  describe('create', () => {
    it('should create a collection and emit collection.created', async () => {
      const collectionRepo = createCollectionRepository(null);
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());

      const result = await useCase.create({ name: 'Summer', slug: 'summer' });

      expect(result.name).toBe('Summer');
      expect(collectionRepo.create).toHaveBeenCalledWith(expect.any(Collection));
      expect(emitMock).toHaveBeenCalledWith('collection.created', expect.objectContaining({ assortmentCollectionId: 'test-uuid' }));
    });

    it('should throw when name or slug is missing', async () => {
      const useCase = new ManageCollectionsUseCase(createCollectionRepository(), createCollectionMapRepository());
      await expect(useCase.create({ slug: 'x' })).rejects.toThrow(CollectionValidationError);
      await expect(useCase.create({ name: 'x' })).rejects.toThrow(CollectionValidationError);
    });

    it('should throw when slug already exists', async () => {
      const collectionRepo = createCollectionRepository(createCollection());
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());
      await expect(useCase.create({ name: 'Dup', slug: 'test-collection' })).rejects.toThrow(CollectionSlugAlreadyExistsError);
    });

    it('should throw when automated collection has no conditions', async () => {
      const useCase = new ManageCollectionsUseCase(createCollectionRepository(null), createCollectionMapRepository());
      await expect(useCase.create({ name: 'Smart', slug: 'smart', isAutomated: true })).rejects.toThrow(CollectionValidationError);
    });

    it('should throw when conditions are invalid', async () => {
      const useCase = new ManageCollectionsUseCase(createCollectionRepository(null), createCollectionMapRepository());
      await expect(
        useCase.create({
          name: 'Smart',
          slug: 'smart',
          isAutomated: true,
          conditions: [{ field: 'query', operator: 'equals', value: 'x' }],
        }),
      ).rejects.toThrow(CollectionValidationError);
    });

    it('should add initial products when products are provided', async () => {
      const collectionRepo = createCollectionRepository(null);
      const mapRepo = createCollectionMapRepository();
      const useCase = new ManageCollectionsUseCase(collectionRepo, mapRepo);

      await useCase.create({
        name: 'Summer',
        slug: 'summer',
        products: [{ productId: PRODUCT_ID, position: 2 }],
      });

      expect(mapRepo.create).toHaveBeenCalledWith(expect.objectContaining({ productId: PRODUCT_ID }));
    });
  });

  describe('update', () => {
    it('should throw when collection does not exist', async () => {
      const useCase = new ManageCollectionsUseCase(createCollectionRepository(null), createCollectionMapRepository());
      await expect(useCase.update('missing', { name: 'x' })).rejects.toThrow(CollectionNotFoundError);
    });

    it('should update fields and emit collection.updated', async () => {
      const collectionRepo = createCollectionRepository(createCollection());
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());

      const result = await useCase.update(COLLECTION_ID, { name: 'Renamed', isFeatured: true });

      expect(result.name).toBe('Renamed');
      expect(result.isFeatured).toBe(true);
      expect(emitMock).toHaveBeenCalledWith('collection.updated', { assortmentCollectionId: COLLECTION_ID });
    });

    it('should check slug uniqueness when slug changes', async () => {
      const existing = createCollection();
      const collectionRepo = createCollectionRepository(existing);
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());

      await expect(useCase.update(COLLECTION_ID, { slug: 'test-collection' })).resolves.toBeTruthy();
      await expect(useCase.update(COLLECTION_ID, { slug: 'other-slug' })).rejects.toThrow(CollectionSlugAlreadyExistsError);
    });

    it('should remove map ids and products when requested', async () => {
      const collectionRepo = createCollectionRepository(createCollection());
      const mapRepo = createCollectionMapRepository([createMap()]);
      const useCase = new ManageCollectionsUseCase(collectionRepo, mapRepo);

      await useCase.update(COLLECTION_ID, { removeMapIds: ['m-1'], removeProductIds: ['p-2'] });

      expect(mapRepo.delete).toHaveBeenCalledWith('m-1');
      expect(mapRepo.deleteByProduct).toHaveBeenCalledWith(COLLECTION_ID, 'p-2');
    });
  });

  describe('delete', () => {
    it('should throw when collection does not exist', async () => {
      const collectionRepo = createCollectionRepository(null);
      collectionRepo.findById.mockResolvedValue(null);
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());
      await expect(useCase.delete('missing')).rejects.toThrow(CollectionNotFoundError);
    });

    it('should soft-delete and emit collection.deleted', async () => {
      const collectionRepo = createCollectionRepository(createCollection());
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());

      await useCase.delete(COLLECTION_ID);

      expect(collectionRepo.delete).toHaveBeenCalledWith(COLLECTION_ID);
      expect(emitMock).toHaveBeenCalledWith('collection.deleted', { assortmentCollectionId: COLLECTION_ID });
    });
  });

  describe('publications', () => {
    it('should list publications for an existing collection', async () => {
      const collectionRepo = createCollectionRepository(createCollection());
      collectionRepo.listPublications.mockResolvedValue([
        { assortmentCollectionPublicationId: 'pub-1', assortmentCollectionId: COLLECTION_ID, storeId: 's-1', sortOrder: 1 },
      ]);
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());

      const publications = await useCase.listPublications(COLLECTION_ID);

      expect(publications).toHaveLength(1);
      expect(collectionRepo.listPublications).toHaveBeenCalledWith(COLLECTION_ID);
    });

    it('should throw when listing publications for a missing collection', async () => {
      const collectionRepo = createCollectionRepository(null);
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());

      await expect(useCase.listPublications('missing')).rejects.toThrow(CollectionNotFoundError);
    });

    it('should upsert a publication scope with merchandising order', async () => {
      const collectionRepo = createCollectionRepository(createCollection());
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());

      await useCase.setPublication(COLLECTION_ID, { storeId: 's-1', channelId: 'ch-1', sortOrder: 3 });

      expect(collectionRepo.upsertPublication).toHaveBeenCalledWith({
        assortmentCollectionId: COLLECTION_ID,
        storeId: 's-1',
        channelId: 'ch-1',
        sortOrder: 3,
      });
    });

    it('should reject a negative merchandising order', async () => {
      const collectionRepo = createCollectionRepository(createCollection());
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());

      await expect(useCase.setPublication(COLLECTION_ID, { sortOrder: -1 })).rejects.toThrow(CollectionValidationError);
      expect(collectionRepo.upsertPublication).not.toHaveBeenCalled();
    });

    it('should throw when deleting a publication that does not exist', async () => {
      const collectionRepo = createCollectionRepository(createCollection());
      collectionRepo.deletePublication.mockResolvedValue(false);
      const useCase = new ManageCollectionsUseCase(collectionRepo, createCollectionMapRepository());

      await expect(useCase.deletePublication(COLLECTION_ID, 'pub-missing')).rejects.toThrow(AssortmentEntryNotFoundError);
    });
  });
});
