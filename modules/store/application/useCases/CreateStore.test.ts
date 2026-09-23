/**
 * Unit Tests for CreateStore Use Case
 */

import {
  createStoreRepository,
  createSystemConfigPort,
  createOrganizationLookupPort,
  createStore,
} from '../../tests/testUtils';
import { CreateStoreUseCase, CreateStoreCommand } from './CreateStore';
import { StoreSlugAlreadyExistsError, StoreValidationError, StoreNotFoundError } from '../../domain/errors/StoreErrors';

describe('CreateStoreUseCase', () => {
  let useCase: CreateStoreUseCase;
  let storeRepository: ReturnType<typeof createStoreRepository>;
  let systemConfigPort: ReturnType<typeof createSystemConfigPort>;
  let organizationLookupPort: ReturnType<typeof createOrganizationLookupPort>;

  const storeData = {
    name: 'New Store',
    slug: 'new-store',
    storeType: 'organization_store' as const,
    organizationId: 'org-1',
  };

  beforeEach(() => {
    storeRepository = createStoreRepository();
    storeRepository.findBySlug.mockResolvedValue(null);
    storeRepository.findByUrl.mockResolvedValue(null);
    storeRepository.findById.mockResolvedValue(createStore());
    storeRepository.save.mockImplementation(async store => store);
    systemConfigPort = createSystemConfigPort();
    organizationLookupPort = createOrganizationLookupPort();
    useCase = new CreateStoreUseCase(storeRepository, systemConfigPort, organizationLookupPort);
  });

  it('should create and persist the store when the input is valid', async () => {
    const result = await useCase.execute(new CreateStoreCommand(storeData));

    expect(result.name).toBe('New Store');
    expect(storeRepository.save).toHaveBeenCalledWith(expect.objectContaining({ slug: 'new-store' }));
  });

  it('should throw StoreValidationError when the name is missing', async () => {
    await expect(useCase.execute(new CreateStoreCommand({ ...storeData, name: '' }))).rejects.toThrow(
      StoreValidationError,
    );
    expect(storeRepository.save).not.toHaveBeenCalled();
  });

  it('should throw StoreValidationError when the slug is missing', async () => {
    await expect(useCase.execute(new CreateStoreCommand({ ...storeData, slug: '' }))).rejects.toThrow(
      StoreValidationError,
    );
  });

  it('should throw StoreValidationError when no system configuration is active', async () => {
    systemConfigPort.findActive.mockResolvedValue(null);

    await expect(useCase.execute(new CreateStoreCommand(storeData))).rejects.toThrow(StoreValidationError);
    expect(storeRepository.save).not.toHaveBeenCalled();
  });

  it('should throw StoreSlugAlreadyExistsError when the slug is taken', async () => {
    storeRepository.findBySlug.mockResolvedValue(createStore({ slug: 'new-store' }));

    await expect(useCase.execute(new CreateStoreCommand(storeData))).rejects.toThrow(StoreSlugAlreadyExistsError);
    expect(storeRepository.save).not.toHaveBeenCalled();
  });

  it('should throw StoreValidationError when the storeUrl is taken', async () => {
    storeRepository.findByUrl.mockResolvedValue(createStore());

    await expect(useCase.execute(new CreateStoreCommand({ ...storeData, storeUrl: 'taken.example.com' }))).rejects.toThrow(
      StoreValidationError,
    );
  });

  it('should throw StoreValidationError when a merchant store has no organizationId', async () => {
    await expect(
      useCase.execute(new CreateStoreCommand({ ...storeData, storeType: 'merchant_store', organizationId: undefined })),
    ).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreValidationError when the organization does not exist', async () => {
    organizationLookupPort.findById.mockResolvedValue(null);

    await expect(useCase.execute(new CreateStoreCommand(storeData))).rejects.toThrow(StoreValidationError);
    expect(storeRepository.save).not.toHaveBeenCalled();
  });

  it('should throw StoreValidationError when a headquarters has a parent store', async () => {
    await expect(
      useCase.execute(new CreateStoreCommand({ ...storeData, isHeadquarters: true, parentStoreId: 'parent-1' })),
    ).rejects.toThrow(StoreValidationError);
  });

  it('should throw StoreNotFoundError when the parent store does not exist', async () => {
    storeRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new CreateStoreCommand({ ...storeData, parentStoreId: 'missing' }))).rejects.toThrow(
      StoreNotFoundError,
    );
  });
});
