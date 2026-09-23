import '../../tests/testUtils';
import { ManageCompanyUseCase } from './ManageCompany';
import {
  CompanyAlreadyExistsError, CompanyNotFoundError, CompanyStatusError, CreditLimitExceededError,
} from '../../domain/errors/B2BErrors';
import type { CompanyRepository } from '../../domain/repositories/B2BRepository';
import { createCompany, emitMock, lazyMock } from '../../tests/testUtils';

describe('ManageCompanyUseCase', () => {
  let repo: jest.Mocked<CompanyRepository>;
  let useCase: ManageCompanyUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<CompanyRepository>();
    useCase = new ManageCompanyUseCase(repo);
  });

  it('should create a company and emit company.registered when the name is unique', async () => {
    repo.findByName.mockResolvedValue(null);

    const result = await useCase.create({ organizationId: 'org-1', name: 'Acme' });

    expect(result.status).toBe('pending');
    expect(repo.save).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('company.registered', expect.objectContaining({ name: 'Acme' }));
  });

  it('should throw CompanyAlreadyExistsError when the name is taken', async () => {
    repo.findByName.mockResolvedValue(createCompany());

    await expect(useCase.create({ organizationId: 'org-1', name: 'Acme' })).rejects.toThrow(CompanyAlreadyExistsError);
  });

  it('should approve a pending company and emit company.approved', async () => {
    repo.findById.mockResolvedValue(createCompany());

    const result = await useCase.approve('co-1');

    expect(result.status).toBe('approved');
    expect(emitMock).toHaveBeenCalledWith('company.approved', expect.objectContaining({ companyId: result.companyId }));
  });

  it('should throw CompanyStatusError when approving a non-pending company', async () => {
    const company = createCompany();
    company.approve();
    repo.findById.mockResolvedValue(company);

    await expect(useCase.approve('co-1')).rejects.toThrow(CompanyStatusError);
  });

  it('should throw CompanyNotFoundError when the company does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.get('missing')).rejects.toThrow(CompanyNotFoundError);
  });

  it('should throw CreditLimitExceededError when the amount exceeds available credit', async () => {
    const company = createCompany({ creditLimit: 100 });
    repo.findById.mockResolvedValue(company);

    await expect(useCase.checkCredit('co-1', 200)).rejects.toThrow(CreditLimitExceededError);
  });

  it('should pass the credit check when the amount fits within the limit', async () => {
    repo.findById.mockResolvedValue(createCompany({ creditLimit: 100 }));

    await expect(useCase.checkCredit('co-1', 50)).resolves.toBe(true);
  });
});
