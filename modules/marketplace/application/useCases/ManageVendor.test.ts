import '../../tests/testUtils';
import { ManageVendorUseCase } from './ManageVendor';
import { VendorAlreadyExistsError, VendorNotFoundError } from '../../domain/errors/MarketplaceErrors';
import type { VendorRepository } from '../../domain/repositories/MarketplaceRepository';
import { createVendor, emitMock, lazyMock } from '../../tests/testUtils';

describe('ManageVendorUseCase', () => {
  let repo: jest.Mocked<VendorRepository>;
  let useCase: ManageVendorUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<VendorRepository>();
    useCase = new ManageVendorUseCase(repo);
  });

  it('should register a vendor and emit marketplace.vendor.registered when the email is unused', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await useCase.create({ organizationId: 'org-1', name: 'V', email: 'v@x.test' });

    expect(repo.save).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('marketplace.vendor.registered', expect.objectContaining({ name: 'V' }));
  });

  it('should throw VendorAlreadyExistsError when the email is taken', async () => {
    repo.findByEmail.mockResolvedValue(createVendor());

    await expect(useCase.create({ organizationId: 'org-1', name: 'V', email: 'v@x.test' })).rejects.toThrow(VendorAlreadyExistsError);
  });

  it('should throw VendorNotFoundError when the vendor does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.get('missing')).rejects.toThrow(VendorNotFoundError);
  });

  it('should approve a pending vendor and emit marketplace.vendor.approved', async () => {
    const vendor = createVendor();
    repo.findById.mockResolvedValue(vendor);

    const result = await useCase.approve('v-1');

    expect(result.isApproved).toBe(true);
    expect(emitMock).toHaveBeenCalledWith('marketplace.vendor.approved', expect.objectContaining({ vendorId: vendor.vendorId }));
  });
});

