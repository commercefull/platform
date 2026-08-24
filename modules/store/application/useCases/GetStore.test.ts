/**
 * Unit Tests for GetStore Use Case
 */

import { GetStoreUseCase, GetStoreQuery } from './GetStore';
import { StoreValidationError } from '../../domain/errors/StoreErrors';
import { Store } from '../../domain/entities/Store';

describe('GetStoreUseCase', () => {
  let useCase: GetStoreUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByUrl: jest.fn(),
    };
    useCase = new GetStoreUseCase(mockRepo as never as ConstructorParameters<typeof GetStoreUseCase>[0]);
  });

  function createStore(): Store {
    return Store.create({
      storeId: 'store-1',
      name: 'Test Store',
      storeType: 'organization_store',
      organizationId: 'org-1',
    });
  }

  it('should find store by ID', async () => {
    mockRepo.findById.mockResolvedValue(createStore());

    const result = await useCase.execute(new GetStoreQuery('store-1'));

    expect(result.store).not.toBeNull();
    expect(result.store!.storeId).toBe('store-1');
    expect(result.store!.name).toBe('Test Store');
    expect(mockRepo.findById).toHaveBeenCalledWith('store-1');
  });

  it('should find store by slug', async () => {
    mockRepo.findBySlug.mockResolvedValue(createStore());

    const result = await useCase.execute(new GetStoreQuery(undefined, 'test-store'));

    expect(result.store).not.toBeNull();
    expect(mockRepo.findBySlug).toHaveBeenCalledWith('test-store');
  });

  it('should find store by URL', async () => {
    mockRepo.findByUrl.mockResolvedValue(createStore());

    const result = await useCase.execute(new GetStoreQuery(undefined, undefined, 'https://example.com'));

    expect(result.store).not.toBeNull();
    expect(mockRepo.findByUrl).toHaveBeenCalledWith('https://example.com');
  });

  it('should return null when store not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute(new GetStoreQuery('store-x'));

    expect(result.store).toBeNull();
  });

  it('should throw StoreValidationError when no identifier provided', async () => {
    await expect(useCase.execute(new GetStoreQuery())).rejects.toThrow(StoreValidationError);
  });

  it('should map store properties to response', async () => {
    mockRepo.findById.mockResolvedValue(createStore());

    const result = await useCase.execute(new GetStoreQuery('store-1'));

    expect(result.store!.slug).toBe('test-store');
    expect(result.store!.isActive).toBe(true);
    expect(result.store!.defaultCurrency).toBe('USD');
    expect(result.store!.createdAt).toBeDefined();
    expect(result.store!.updatedAt).toBeDefined();
  });
});
