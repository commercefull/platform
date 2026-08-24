import { StoreLookupAdapter } from './StoreLookupAdapter';
import { StoreRepository } from '../../../store/domain/repositories/StoreRepository';
import { Store } from '../../../store/domain/entities/Store';

describe('StoreLookupAdapter', () => {
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
      storeId: 'store-123',
      organizationId: 'org-456',
    } as Store;
    mockStoreRepo.findById.mockResolvedValue(mockStore);

    const result = await adapter.findById('store-123');

    expect(result).toEqual({ storeId: 'store-123', organizationId: 'org-456' });
    expect(mockStoreRepo.findById).toHaveBeenCalledWith('store-123');
  });

  it('should return null when store does not exist', async () => {
    mockStoreRepo.findById.mockResolvedValue(null);

    const result = await adapter.findById('nonexistent');

    expect(result).toBeNull();
  });

  it('should return StoreSummary with undefined organizationId when store has none', async () => {
    const mockStore = {
      storeId: 'store-789',
      organizationId: undefined,
    } as Store;
    mockStoreRepo.findById.mockResolvedValue(mockStore);

    const result = await adapter.findById('store-789');

    expect(result).toEqual({ storeId: 'store-789', organizationId: undefined });
  });
});
