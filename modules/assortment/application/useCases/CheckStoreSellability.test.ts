import {
  createStoreAssortment,
  createStoreAssortmentRepository,
  createCatalogPort,
  createCollectionRepository,
  createCollectionMapRepository,
  createEntry,
  productRef,
  STORE_ID,
} from '../../tests/testUtils';
import { CheckStoreSellabilityUseCase, CheckStoreSellabilityCommand } from './CheckStoreSellability';
import { ResolveCollectionProductsUseCase } from './ResolveCollectionProducts';

function makeResolver() {
  return new ResolveCollectionProductsUseCase(createCollectionRepository(), createCollectionMapRepository(), createCatalogPort());
}

describe('CheckStoreSellabilityUseCase', () => {
  it('should return true when the store has no assortment row', async () => {
    const useCase = new CheckStoreSellabilityUseCase(createStoreAssortmentRepository(), makeResolver(), createCatalogPort());

    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-1'))).resolves.toBe(true);
  });

  it('should return true in all mode when the product is not excluded or hidden', async () => {
    const useCase = new CheckStoreSellabilityUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'all'), [createEntry({ targetId: 'p-2', effect: 'exclude' })]),
      makeResolver(),
      createCatalogPort(),
    );

    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-1'))).resolves.toBe(true);
  });

  it('should return false when the product is excluded or hidden', async () => {
    const entries = [
      createEntry({ targetId: 'p-1', effect: 'exclude' }),
      createEntry({ targetId: 'p-2', effect: 'include', isHidden: true, assortmentStoreEntryId: 'e2' }),
    ];
    const useCase = new CheckStoreSellabilityUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'all'), entries),
      makeResolver(),
      createCatalogPort(),
    );

    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-1'))).resolves.toBe(false);
    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-2'))).resolves.toBe(false);
  });

  it('should apply channel-scoped entries only for that channel', async () => {
    const entries = [createEntry({ targetId: 'p-1', effect: 'exclude', channelId: 'ch-agentic' })];
    const useCase = new CheckStoreSellabilityUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'exclude'), entries),
      makeResolver(),
      createCatalogPort(),
    );

    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-1', 'ch-agentic'))).resolves.toBe(false);
    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-1', 'ch-web'))).resolves.toBe(true);
    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-1'))).resolves.toBe(true);
  });

  it('should return true in include mode only when the product is included', async () => {
    const entries = [createEntry({ targetId: 'p-1', effect: 'include' })];
    const useCase = new CheckStoreSellabilityUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'include'), entries),
      makeResolver(),
      createCatalogPort([productRef('p-1')]),
    );

    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-1'))).resolves.toBe(true);
    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-9'))).resolves.toBe(false);
  });

  it('should let channel-scoped includes sell on that channel in include mode', async () => {
    const entries = [
      createEntry({ targetId: 'p-1', effect: 'include' }),
      createEntry({ targetId: 'p-2', effect: 'include', channelId: 'ch-agentic', assortmentStoreEntryId: 'e2' }),
    ];
    const useCase = new CheckStoreSellabilityUseCase(
      createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'include'), entries),
      makeResolver(),
      createCatalogPort(),
    );

    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-2', 'ch-agentic'))).resolves.toBe(true);
    await expect(useCase.execute(new CheckStoreSellabilityCommand(STORE_ID, 'p-2'))).resolves.toBe(false);
  });
});
