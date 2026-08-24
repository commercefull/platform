import { StoreLookupAdapter } from './StoreLookupAdapter';
import { StoreRepository } from '../../../store/domain/repositories/StoreRepository';
import { Store } from '../../../store/domain/entities/Store';

describe('StoreLookupAdapter (product)', () => {
  let adapter: StoreLookupAdapter;
  let mockStoreRepo: jest.Mocked<Pick<StoreRepository, 'findById'>>;

  beforeEach(() => {
    mockStoreRepo = {
      findById: jest.fn(),
    };
    adapter = new StoreLookupAdapter(mockStoreRepo as never as StoreRepository);
  });

  it('should return StoreSummary when store exists', async () => {
    const mockStore = {
      storeId: 'store-abc',
      organizationId: 'org-xyz',
    } as Store;
    mockStoreRepo.findById.mockResolvedValue(mockStore);

    const result = await adapter.findById('store-abc');

    expect(result).toEqual({ storeId: 'store-abc', organizationId: 'org-xyz' });
  });

  it('should return null when store does not exist', async () => {
    mockStoreRepo.findById.mockResolvedValue(null);

    const result = await adapter.findById('nonexistent');

    expect(result).toBeNull();
  });
});
