/**
 * Unit Tests for CreateStore Use Case
 */

import { CreateStoreUseCase, CreateStoreCommand } from './CreateStore';
import { StoreSlugAlreadyExistsError, StoreValidationError, StoreNotFoundError } from '../../domain/errors/StoreErrors';

describe('CreateStoreUseCase', () => {
  let useCase: CreateStoreUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockSystemConfig: Record<string, jest.Mock>;
  let mockOrgLookup: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findBySlug: jest.fn().mockResolvedValue(null),
      findByUrl: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (s: unknown) => s),
      findById: jest.fn(),
    };
    mockSystemConfig = {
      findActive: jest.fn().mockResolvedValue({ marketplaceMode: 'single' }),
    };
    mockOrgLookup = {
      findById: jest.fn().mockResolvedValue({ organizationId: 'org-1', name: 'Test Org' }),
    };
    useCase = new CreateStoreUseCase(
      mockRepo as never as ConstructorParameters<typeof CreateStoreUseCase>[0],
      mockSystemConfig as never as ConstructorParameters<typeof CreateStoreUseCase>[1],
      mockOrgLookup as never as ConstructorParameters<typeof CreateStoreUseCase>[2],
    );
  });

  function createStoreData(overrides?: Record<string, unknown>) {
    return {
      name: 'New Store',
      slug: 'new-store',
      storeType: 'organization_store' as const,
      organizationId: 'org-1',
      ...overrides,
    };
  }

  it('should create a store successfully', async () => {
    const result = await useCase.execute(new CreateStoreCommand(createStoreData()));

    expect(result.storeId).toBeDefined();
    expect(typeof result.storeId).toBe('string');
    expect(result.name).toBe('New Store');
    expect(result.slug).toBe('new-store');
    expect(result.storeType).toBe('organization_store');
    expect(result.isActive).toBe(true);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw StoreValidationError when name is missing', async () => {
    await expect(
      useCase.execute(new CreateStoreCommand(createStoreData({ name: '' }))),
    ).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreValidationError when slug is missing', async () => {
    await expect(
      useCase.execute(new CreateStoreCommand(createStoreData({ slug: '' }))),
    ).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreValidationError when system config not found', async () => {
    mockSystemConfig.findActive.mockResolvedValue(null);

    await expect(
      useCase.execute(new CreateStoreCommand(createStoreData())),
    ).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreSlugAlreadyExistsError when slug is taken', async () => {
    mockRepo.findBySlug.mockResolvedValue({ storeId: 'existing-1' });

    await expect(
      useCase.execute(new CreateStoreCommand(createStoreData())),
    ).rejects.toThrow(StoreSlugAlreadyExistsError);
  });

  it('should throw StoreValidationError when storeUrl is taken', async () => {
    mockRepo.findByUrl.mockResolvedValue({ storeId: 'existing-1' });

    await expect(
      useCase.execute(new CreateStoreCommand(createStoreData({ storeUrl: 'https://example.com' }))),
    ).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreValidationError when merchant_store has no organizationId', async () => {
    await expect(
      useCase.execute(
        new CreateStoreCommand(createStoreData({ storeType: 'merchant_store', organizationId: undefined })),
      ),
    ).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreValidationError when organization not found', async () => {
    mockOrgLookup.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(new CreateStoreCommand(createStoreData())),
    ).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreValidationError when headquarters has parent store', async () => {
    await expect(
      useCase.execute(
        new CreateStoreCommand(createStoreData({ isHeadquarters: true, parentStoreId: 'parent-1' })),
      ),
    ).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreNotFoundError when parent store does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(
        new CreateStoreCommand(createStoreData({ parentStoreId: 'parent-x' })),
      ),
    ).rejects.toThrow(StoreNotFoundError);
  });
});
