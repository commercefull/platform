import '../../tests/testUtils';
import { ManagePayoutUseCase } from './ManagePayout';
import { VendorStatusError, PayoutNotFoundError } from '../../domain/errors/MarketplaceErrors';
import type {
  VendorRepository, VendorPayoutRepository,
} from '../../domain/repositories/MarketplaceRepository';
import { createPayout, createVendor, emitMock, lazyMock } from '../../tests/testUtils';

describe('ManagePayoutUseCase', () => {
  let payoutRepo: jest.Mocked<VendorPayoutRepository>;
  let vendorRepo: jest.Mocked<VendorRepository>;
  let useCase: ManagePayoutUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    payoutRepo = lazyMock<VendorPayoutRepository>();
    vendorRepo = lazyMock<VendorRepository>();
    payoutRepo.findById.mockResolvedValue(createPayout());
    useCase = new ManagePayoutUseCase(payoutRepo, vendorRepo);
  });

  it('should create a payout and emit marketplace.payout.created for an approved vendor', async () => {
    const vendor = createVendor();
    vendor.approve();
    vendorRepo.findById.mockResolvedValue(vendor);

    await useCase.create({
      vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
      periodStart: new Date(), periodEnd: new Date(),
    });

    expect(payoutRepo.save).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('marketplace.payout.created', expect.any(Object));
  });

  it('should throw VendorStatusError when creating a payout for a non-approved vendor', async () => {
    vendorRepo.findById.mockResolvedValue(createVendor());

    await expect(useCase.create({
      vendorId: 'v-1', organizationId: 'org-1', method: 'bank_transfer',
      periodStart: new Date(), periodEnd: new Date(),
    })).rejects.toThrow(VendorStatusError);
  });

  it('should throw PayoutNotFoundError when the payout does not exist', async () => {
    payoutRepo.findById.mockResolvedValue(null);

    await expect(useCase.get('missing')).rejects.toThrow(PayoutNotFoundError);
  });

  it('should emit marketplace.payout.completed when completing a payout', async () => {
    const payout = createPayout();
    payout.startProcessing();
    payoutRepo.findById.mockResolvedValue(payout);

    await useCase.complete('p-1', 'txn-1');

    expect(emitMock).toHaveBeenCalledWith('marketplace.payout.completed', expect.objectContaining({ payoutId: payout.payoutId }));
  });

  it('should emit marketplace.payout.failed when a payout fails', async () => {
    await useCase.fail('p-1', 'bank error');

    expect(emitMock).toHaveBeenCalledWith('marketplace.payout.failed', expect.objectContaining({ reason: 'bank error' }));
  });
});
