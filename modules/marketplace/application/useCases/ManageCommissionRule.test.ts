import '../../tests/testUtils';
import { ManageCommissionRuleUseCase } from './ManageCommissionRule';
import { VendorNotFoundError, CommissionRuleNotFoundError } from '../../domain/errors/MarketplaceErrors';
import type {
  VendorRepository, CommissionRuleRepository,
} from '../../domain/repositories/MarketplaceRepository';
import { createCommissionRule, emitMock, lazyMock } from '../../tests/testUtils';

describe('ManageCommissionRuleUseCase', () => {
  let ruleRepo: jest.Mocked<CommissionRuleRepository>;
  let vendorRepo: jest.Mocked<VendorRepository>;
  let useCase: ManageCommissionRuleUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    ruleRepo = lazyMock<CommissionRuleRepository>();
    vendorRepo = lazyMock<VendorRepository>();
    useCase = new ManageCommissionRuleUseCase(ruleRepo, vendorRepo);
  });

  it('should create a rule and emit marketplace.commission.created', async () => {
    await useCase.create({
      organizationId: 'org-1', name: 'R', type: 'percentage', scope: 'global', rate: 15,
    });

    expect(ruleRepo.save).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('marketplace.commission.created', expect.objectContaining({ ruleId: expect.any(String) }));
  });

  it('should throw VendorNotFoundError when the rule targets a missing vendor', async () => {
    vendorRepo.findById.mockResolvedValue(null);

    await expect(useCase.create({
      organizationId: 'org-1', name: 'R', type: 'percentage', scope: 'vendor', rate: 10, vendorId: 'missing',
    })).rejects.toThrow(VendorNotFoundError);
  });

  it('should throw CommissionRuleNotFoundError when the rule does not exist', async () => {
    ruleRepo.findById.mockResolvedValue(null);

    await expect(useCase.get('missing')).rejects.toThrow(CommissionRuleNotFoundError);
  });

  it('should update the rate when the rule exists', async () => {
    ruleRepo.findById.mockResolvedValue(createCommissionRule({ rate: 10 }));

    const result = await useCase.updateRate('r-1', 25);

    expect(result.rate).toBe(25);
    expect(ruleRepo.save).toHaveBeenCalled();
  });
});

