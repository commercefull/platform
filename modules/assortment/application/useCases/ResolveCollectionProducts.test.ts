import {
  createCollection,
  createCollectionRepository,
  createCollectionMapRepository,
  createCatalogPort,
  createMap,
  productRef,
  COLLECTION_ID,
} from '../../tests/testUtils';
import { ResolveCollectionProductsUseCase, ResolveCollectionProductsCommand } from './ResolveCollectionProducts';
import { CollectionNotFoundError } from '../../domain/errors/AssortmentErrors';

describe('ResolveCollectionProductsUseCase', () => {
  it('should throw when collection does not exist', async () => {
    const useCase = new ResolveCollectionProductsUseCase(
      createCollectionRepository(null),
      createCollectionMapRepository(),
      createCatalogPort(),
    );
    await expect(useCase.execute(new ResolveCollectionProductsCommand('missing'))).rejects.toThrow(CollectionNotFoundError);
  });

  it('should resolve manual collection products in map position order', async () => {
    const maps = [
      createMap({ assortmentCollectionMapId: 'm2', productId: 'p-2', position: 2 }),
      createMap({ assortmentCollectionMapId: 'm1', productId: 'p-1', position: 1 }),
    ];
    const mapRepo = createCollectionMapRepository(maps);
    // Repo returns position-ordered rows; simulate by sorting as the impl does
    mapRepo.findByCollection.mockResolvedValue([...maps].sort((a, b) => a.position - b.position));
    const catalog = createCatalogPort([productRef('p-1'), productRef('p-2')]);
    const useCase = new ResolveCollectionProductsUseCase(createCollectionRepository(createCollection()), mapRepo, catalog);

    const result = await useCase.execute(new ResolveCollectionProductsCommand(COLLECTION_ID));

    expect(result.products.map(p => p.productId)).toEqual(['p-1', 'p-2']);
    expect(result.total).toBe(2);
    expect(catalog.findProductsByIds).toHaveBeenCalledWith(['p-1', 'p-2']);
  });

  it('should query catalog with rule filters when collection is automated', async () => {
    const collection = createCollection({
      isAutomated: true,
      conditions: [{ field: 'isFeatured', operator: 'equals', value: true }],
      sortOrder: 'price_asc',
    });
    const catalog = createCatalogPort([productRef('p-9')]);
    const useCase = new ResolveCollectionProductsUseCase(createCollectionRepository(collection), createCollectionMapRepository(), catalog);

    const result = await useCase.execute(new ResolveCollectionProductsCommand(COLLECTION_ID, 10, 0));

    expect(catalog.searchProducts).toHaveBeenCalledWith({ isFeatured: true, sortOrder: 'price_asc' }, 10, 0);
    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should sort manual results when sortOrder is set', async () => {
    const maps = [
      createMap({ assortmentCollectionMapId: 'm1', productId: 'p-expensive', position: 1 }),
      createMap({ assortmentCollectionMapId: 'm2', productId: 'p-cheap', position: 2 }),
    ];
    const collection = createCollection({ sortOrder: 'price_asc' });
    const catalog = createCatalogPort([
      productRef('p-expensive', { effectivePriceCents: 9000 }),
      productRef('p-cheap', { effectivePriceCents: 500 }),
    ]);
    const useCase = new ResolveCollectionProductsUseCase(
      createCollectionRepository(collection),
      createCollectionMapRepository(maps),
      catalog,
    );

    const result = await useCase.execute(new ResolveCollectionProductsCommand(COLLECTION_ID));

    expect(result.products[0].productId).toBe('p-cheap');
  });

  it('should intersect manual collections with the sellable constraint before pagination', async () => {
    const maps = [
      createMap({ assortmentCollectionMapId: 'm1', productId: 'p-1', position: 1 }),
      createMap({ assortmentCollectionMapId: 'm2', productId: 'p-2', position: 2 }),
      createMap({ assortmentCollectionMapId: 'm3', productId: 'p-3', position: 3 }),
    ];
    const mapRepo = createCollectionMapRepository(maps);
    mapRepo.findByCollection.mockResolvedValue([...maps].sort((a, b) => a.position - b.position));
    const catalog = createCatalogPort([productRef('p-1'), productRef('p-2'), productRef('p-3')]);
    const useCase = new ResolveCollectionProductsUseCase(createCollectionRepository(createCollection()), mapRepo, catalog);

    const result = await useCase.execute(new ResolveCollectionProductsCommand(COLLECTION_ID, 100, 0, { excludeProductIds: ['p-2'] }));

    expect(catalog.findProductsByIds).toHaveBeenCalledWith(['p-1', 'p-3']);
    expect(result.products.map(p => p.productId)).toEqual(['p-1', 'p-3']);
    expect(result.total).toBe(2);
  });

  it('should constrain manual collections to the sellable include list', async () => {
    const maps = [
      createMap({ assortmentCollectionMapId: 'm1', productId: 'p-1', position: 1 }),
      createMap({ assortmentCollectionMapId: 'm2', productId: 'p-2', position: 2 }),
    ];
    const catalog = createCatalogPort([productRef('p-1'), productRef('p-2')]);
    const useCase = new ResolveCollectionProductsUseCase(
      createCollectionRepository(createCollection()),
      createCollectionMapRepository(maps),
      catalog,
    );

    const result = await useCase.execute(new ResolveCollectionProductsCommand(COLLECTION_ID, 100, 0, { includeProductIds: ['p-1'] }));

    expect(result.products.map(p => p.productId)).toEqual(['p-1']);
    expect(result.total).toBe(1);
  });

  it('should pass the sellable constraint to the catalog for automated collections', async () => {
    const collection = createCollection({
      isAutomated: true,
      conditions: [{ field: 'isFeatured', operator: 'equals', value: true }],
    });
    const catalog = createCatalogPort([productRef('p-1')]);
    const useCase = new ResolveCollectionProductsUseCase(createCollectionRepository(collection), createCollectionMapRepository(), catalog);

    await useCase.execute(
      new ResolveCollectionProductsCommand(COLLECTION_ID, 10, 0, {
        includeProductIds: ['p-1', 'p-2'],
        excludeProductIds: ['p-9'],
      }),
    );

    expect(catalog.searchProducts).toHaveBeenCalledWith(
      { isFeatured: true, sortOrder: 'newest', productIds: ['p-1', 'p-2'], excludeProductIds: ['p-9'] },
      10,
      0,
    );
  });

  it('should return an empty page when the sellable include list is empty for automated collections', async () => {
    const collection = createCollection({ isAutomated: true, conditions: [] });
    const catalog = createCatalogPort([productRef('p-1')]);
    const useCase = new ResolveCollectionProductsUseCase(createCollectionRepository(collection), createCollectionMapRepository(), catalog);

    const result = await useCase.execute(new ResolveCollectionProductsCommand(COLLECTION_ID, 10, 0, { includeProductIds: [] }));

    expect(catalog.searchProducts).not.toHaveBeenCalled();
    expect(result.products).toEqual([]);
    expect(result.total).toBe(0);
  });
});
