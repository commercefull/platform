jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreateOrganizationUseCase } from './CreateOrganization';
import { OrganizationEmailAlreadyExistsError } from '../../domain/errors/OrganizationErrors';
import { eventBus } from '../../../../libs/events/eventBus';

describe('CreateOrganizationUseCase', () => {
  let useCase: CreateOrganizationUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        organizationId: 'org-1', name: 'Acme Corp', email: 'info@acme.com',
        status: 'pending', createdAt: new Date('2026-01-01'),
      }),
    };
    useCase = new CreateOrganizationUseCase(mockRepo as never);
    jest.mocked(eventBus.emit).mockClear();
  });

  it('should create an organization successfully (happy path)', async () => {
    const result = await useCase.execute({ name: 'Acme Corp', email: 'info@acme.com', phone: '+1234567890' });

    expect(result.organizationId).toBe('org-1');
    expect(result.name).toBe('Acme Corp');
    expect(result.status).toBe('pending');
    expect(eventBus.emit).toHaveBeenCalledWith('organization.created', expect.objectContaining({ organizationId: 'org-1' }));
  });

  it('should throw OrganizationEmailAlreadyExistsError when email is taken', async () => {
    mockRepo.findByEmail.mockResolvedValue({ organizationId: 'existing-org' });

    await expect(useCase.execute({ name: 'New Corp', email: 'info@acme.com' })).rejects.toThrow(OrganizationEmailAlreadyExistsError);
  });

  it('should pass all input fields to repository create', async () => {
    await useCase.execute({
      name: 'Acme', email: 'test@test.com', phone: '123', businessType: 'retail',
      taxId: 'TAX123', website: 'acme.com', description: 'Test org', logo: 'logo.png', password: 'secret',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Acme', email: 'test@test.com', phone: '123', businessType: 'retail',
      taxId: 'TAX123', website: 'acme.com', description: 'Test org', logo: 'logo.png', password: 'secret', status: 'pending',
    }));
  });
});
