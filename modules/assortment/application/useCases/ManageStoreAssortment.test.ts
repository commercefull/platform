import {
  createStoreAssortment,
  createStoreAssortmentRepository,
  createStoreLookupPort,
  createEntry,
  emitMock,
  STORE_ID,
  PRODUCT_ID,
} from '../../tests/testUtils';
import { ManageStoreAssortmentUseCase } from './ManageStoreAssortment';
import {
  AssortmentEntryNotFoundError,
  CollectionValidationError,
  StoreAssortmentNotFoundError,
} from '../../domain/errors/AssortmentErrors';

describe('ManageStoreAssortmentUseCase', () => {
  describe('getConfig', () => {
    it('should default to mode all when no assortment row exists', async () => {
      const useCase = new ManageStoreAssortmentUseCase(createStoreAssortmentRepository(), createStoreLookupPort());
      const config = await useCase.getConfig(STORE_ID);
      expect(config.assortment.mode).toBe('all');
      expect(config.entries).toEqual([]);
    });
  });

  describe('setMode', () => {
    it('should throw when store does not exist', async () => {
      const useCase = new ManageStoreAssortmentUseCase(createStoreAssortmentRepository(), createStoreLookupPort(false));
      await expect(useCase.setMode(STORE_ID, 'include')).rejects.toThrow(StoreAssortmentNotFoundError);
    });

    it('should create a new assortment row when none exists', async () => {
      const repo = createStoreAssortmentRepository();
      const useCase = new ManageStoreAssortmentUseCase(repo, createStoreLookupPort());

      const result = await useCase.setMode(STORE_ID, 'include');

      expect(result.mode).toBe('include');
      expect(repo.upsert).toHaveBeenCalled();
      expect(emitMock).toHaveBeenCalledWith('assortment.updated', { storeId: STORE_ID, mode: 'include' });
    });

    it('should update mode on an existing assortment', async () => {
      const repo = createStoreAssortmentRepository(createStoreAssortment(STORE_ID, 'all'));
      const useCase = new ManageStoreAssortmentUseCase(repo, createStoreLookupPort());
      const result = await useCase.setMode(STORE_ID, 'exclude');
      expect(result.mode).toBe('exclude');
    });

    it('should throw when mode is invalid', async () => {
      const useCase = new ManageStoreAssortmentUseCase(createStoreAssortmentRepository(), createStoreLookupPort());
      await expect(useCase.setMode(STORE_ID, 'bogus' as never)).rejects.toThrow(CollectionValidationError);
    });
  });

  describe('addEntry', () => {
    it('should create an entry and emit assortment.updated', async () => {
      const repo = createStoreAssortmentRepository();
      const useCase = new ManageStoreAssortmentUseCase(repo, createStoreLookupPort());

      const entry = await useCase.addEntry(STORE_ID, {
        targetType: 'product',
        targetId: PRODUCT_ID,
        effect: 'exclude',
      });

      expect(entry.effect).toBe('exclude');
      expect(repo.createEntry).toHaveBeenCalled();
      expect(emitMock).toHaveBeenCalledWith('assortment.updated', expect.objectContaining({ storeId: STORE_ID }));
    });

    it('should throw when targetType is invalid', async () => {
      const useCase = new ManageStoreAssortmentUseCase(createStoreAssortmentRepository(), createStoreLookupPort());
      await expect(useCase.addEntry(STORE_ID, { targetType: 'bogus' as never, targetId: 'x', effect: 'include' })).rejects.toThrow(
        CollectionValidationError,
      );
    });

    it('should throw when store does not exist', async () => {
      const useCase = new ManageStoreAssortmentUseCase(createStoreAssortmentRepository(), createStoreLookupPort(false));
      await expect(useCase.addEntry(STORE_ID, { targetType: 'product', targetId: PRODUCT_ID, effect: 'include' })).rejects.toThrow(
        StoreAssortmentNotFoundError,
      );
    });
  });

  describe('removeEntry', () => {
    it('should remove an entry', async () => {
      const repo = createStoreAssortmentRepository(createStoreAssortment(), [createEntry()]);
      const useCase = new ManageStoreAssortmentUseCase(repo, createStoreLookupPort());
      await useCase.removeEntry('entry-1');
      expect(repo.deleteEntry).toHaveBeenCalledWith('entry-1');
    });

    it('should throw when entry does not exist', async () => {
      const repo = createStoreAssortmentRepository();
      repo.deleteEntry.mockResolvedValue(false);
      const useCase = new ManageStoreAssortmentUseCase(repo, createStoreLookupPort());
      await expect(useCase.removeEntry('missing')).rejects.toThrow(AssortmentEntryNotFoundError);
    });
  });
});
