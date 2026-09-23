import { createOrganizationRepository, emitMock } from '../../tests/testUtils';
import { CreateOrganizationUseCase } from './CreateOrganization';
import { OrganizationEmailAlreadyExistsError } from '../../domain/errors/OrganizationErrors';

describe('CreateOrganizationUseCase', () => {
  it('should create the organization when the email is available', async () => {
    const repository = createOrganizationRepository();

    const result = await new CreateOrganizationUseCase(repository).execute({
      name: 'Acme Corp',
      email: 'info@acme.com',
      phone: '+1234567890',
    });

    expect(result.organizationId).toBe('org-1');
    expect(result.name).toBe('Acme Corp');
    expect(result.status).toBe('pending');
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('should emit organization.created when the organization is created', async () => {
    const repository = createOrganizationRepository();

    await new CreateOrganizationUseCase(repository).execute({ name: 'Acme Corp', email: 'info@acme.com' });

    expect(emitMock).toHaveBeenCalledWith(
      'organization.created',
      expect.objectContaining({ organizationId: 'org-1', name: 'Acme Corp', email: 'info@acme.com' }),
    );
  });

  it('should throw OrganizationEmailAlreadyExistsError when the email is taken', async () => {
    const repository = createOrganizationRepository();
    repository.findByEmail.mockResolvedValue({ organizationId: 'existing-org' });

    await expect(
      new CreateOrganizationUseCase(repository).execute({ name: 'New Corp', email: 'info@acme.com' }),
    ).rejects.toThrow(OrganizationEmailAlreadyExistsError);
    expect(repository.create).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should pass all input fields through to the repository', async () => {
    const repository = createOrganizationRepository();

    await new CreateOrganizationUseCase(repository).execute({
      name: 'Acme',
      email: 'test@test.com',
      phone: '123',
      businessType: 'retail',
      taxId: 'TAX123',
      website: 'acme.com',
      description: 'Test org',
      logo: 'logo.png',
      password: 'secret',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Acme',
        email: 'test@test.com',
        businessType: 'retail',
        taxId: 'TAX123',
        status: 'pending',
      }),
    );
  });
});
