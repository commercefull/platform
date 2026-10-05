import { StoreLookupAdapter } from './StoreLookupAdapter';
import type { GetStoreUseCase } from '../../../store/application/useCases/GetStore';

describe('StoreLookupAdapter', () => {
  it('should return true when the store exists', async () => {
    const getStore = {
      execute: jest.fn().mockResolvedValue({ store: { storeId: 's-1' } }),
    } as unknown as Pick<GetStoreUseCase, 'execute'>;
    const adapter = new StoreLookupAdapter(getStore);

    expect(await adapter.storeExists('s-1')).toBe(true);
    expect(getStore.execute).toHaveBeenCalledWith({ storeId: 's-1' });
  });

  it('should return false when the store does not exist', async () => {
    const getStore = {
      execute: jest.fn().mockResolvedValue({ store: null }),
    } as unknown as Pick<GetStoreUseCase, 'execute'>;
    const adapter = new StoreLookupAdapter(getStore);

    expect(await adapter.storeExists('missing')).toBe(false);
  });
});
