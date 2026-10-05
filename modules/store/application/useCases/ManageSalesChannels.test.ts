import { createSalesChannel, createSalesChannelRepository, createStore, createStoreRepository } from '../../tests/testUtils';
import { StoreValidationError } from '../../domain/errors/StoreErrors';
import { ManageSalesChannelsUseCase } from './ManageSalesChannels';

describe('ManageSalesChannelsUseCase', () => {
  let salesChannelRepository: ReturnType<typeof createSalesChannelRepository>;
  let storeRepository: ReturnType<typeof createStoreRepository>;
  let useCase: ManageSalesChannelsUseCase;

  beforeEach(() => {
    salesChannelRepository = createSalesChannelRepository();
    storeRepository = createStoreRepository();
    useCase = new ManageSalesChannelsUseCase(salesChannelRepository, storeRepository);
  });

  it('should create a channel when its organization code is unique', async () => {
    salesChannelRepository.findByCode.mockResolvedValue(null);
    salesChannelRepository.save.mockImplementation(async channel => channel);

    const channel = await useCase.create({ organizationId: 'org-1', code: 'website', name: 'Website', type: 'web' });

    expect(channel.organizationId).toBe('org-1');
    expect(salesChannelRepository.save).toHaveBeenCalledWith(channel);
  });

  it('should reject a duplicate channel code within an organization', async () => {
    salesChannelRepository.findByCode.mockResolvedValue(createSalesChannel());

    await expect(useCase.create({ organizationId: 'org-1', code: 'website', name: 'Website', type: 'web' })).rejects.toThrow(
      StoreValidationError,
    );
    expect(salesChannelRepository.save).not.toHaveBeenCalled();
  });

  it('should assign an organization channel to a store owned by that organization', async () => {
    storeRepository.findById.mockResolvedValue(createStore());
    salesChannelRepository.findById.mockResolvedValue(createSalesChannel());
    salesChannelRepository.findAssignment.mockResolvedValue(null);
    salesChannelRepository.assign.mockResolvedValue({
      storeSalesChannelId: 'assignment-1',
      storeId: 'store-1',
      salesChannelId: 'channel-1',
      isDefault: true,
      isActive: true,
      settings: {},
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

    const assignment = await useCase.assignToStore({
      organizationId: 'org-1',
      storeId: 'store-1',
      salesChannelId: 'channel-1',
      isDefault: true,
    });

    expect(assignment.isDefault).toBe(true);
    expect(salesChannelRepository.assign).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 'store-1', salesChannelId: 'channel-1', isDefault: true }),
    );
  });

  it('should reject assignment when the channel and store belong to different organizations', async () => {
    storeRepository.findById.mockResolvedValue(createStore({ organizationId: 'org-2' }));
    salesChannelRepository.findById.mockResolvedValue(createSalesChannel({ organizationId: 'org-1' }));

    await expect(useCase.assignToStore({ organizationId: 'org-1', storeId: 'store-1', salesChannelId: 'channel-1' })).rejects.toThrow(
      StoreValidationError,
    );
    expect(salesChannelRepository.assign).not.toHaveBeenCalled();
  });

  it('should reject duplicate store channel assignments', async () => {
    storeRepository.findById.mockResolvedValue(createStore());
    salesChannelRepository.findById.mockResolvedValue(createSalesChannel());
    salesChannelRepository.findAssignment.mockResolvedValue({
      storeSalesChannelId: 'assignment-1',
      storeId: 'store-1',
      salesChannelId: 'channel-1',
      isDefault: false,
      isActive: true,
      settings: {},
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

    await expect(useCase.assignToStore({ organizationId: 'org-1', storeId: 'store-1', salesChannelId: 'channel-1' })).rejects.toThrow(
      StoreValidationError,
    );
    expect(salesChannelRepository.assign).not.toHaveBeenCalled();
  });

  describe('assertStoreChannelAccess', () => {
    const activeAssignment = {
      storeSalesChannelId: 'assignment-1',
      storeId: 'store-1',
      salesChannelId: 'channel-1',
      isDefault: false,
      isActive: true,
      settings: {},
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };

    it('should pass when store and channel are owned by the organization and assigned', async () => {
      storeRepository.findById.mockResolvedValue(createStore());
      salesChannelRepository.findById.mockResolvedValue(createSalesChannel());
      salesChannelRepository.findAssignment.mockResolvedValue(activeAssignment);

      await expect(
        useCase.assertStoreChannelAccess({ organizationId: 'org-1', storeId: 'store-1', channelId: 'channel-1' }),
      ).resolves.toBeUndefined();
    });

    it('should reject a store owned by another organization', async () => {
      storeRepository.findById.mockResolvedValue(createStore({ organizationId: 'org-2' }));

      await expect(useCase.assertStoreChannelAccess({ organizationId: 'org-1', storeId: 'store-1' })).rejects.toThrow(
        'Store does not belong to this organization',
      );
    });

    it('should reject a channel owned by another organization', async () => {
      salesChannelRepository.findById.mockResolvedValue(createSalesChannel({ organizationId: 'org-2' }));

      await expect(useCase.assertStoreChannelAccess({ organizationId: 'org-1', channelId: 'channel-1' })).rejects.toThrow(
        'Sales channel does not belong to this organization',
      );
    });

    it('should reject when the channel is not assigned to the store', async () => {
      storeRepository.findById.mockResolvedValue(createStore());
      salesChannelRepository.findById.mockResolvedValue(createSalesChannel());
      salesChannelRepository.findAssignment.mockResolvedValue(null);

      await expect(
        useCase.assertStoreChannelAccess({ organizationId: 'org-1', storeId: 'store-1', channelId: 'channel-1' }),
      ).rejects.toThrow('Sales channel is not assigned to this store');
    });

    it('should validate without organization context for customer-facing callers', async () => {
      storeRepository.findById.mockResolvedValue(createStore());
      salesChannelRepository.findById.mockResolvedValue(createSalesChannel({ organizationId: 'org-9' }));
      salesChannelRepository.findAssignment.mockResolvedValue(activeAssignment);

      await expect(useCase.assertStoreChannelAccess({ storeId: 'store-1', channelId: 'channel-1' })).resolves.toBeUndefined();
    });

    it('should reject an inactive store even without organization context', async () => {
      storeRepository.findById.mockResolvedValue(createStore({ isActive: false }));

      await expect(useCase.assertStoreChannelAccess({ storeId: 'store-1' })).rejects.toThrow('Store is not active');
    });
  });
});
