import { OrganizationCredentialSubjectAdapter } from './OrganizationCredentialSubjectAdapter';
import type organizationRepo from '../../../organization/infrastructure/repositories/organizationRepo';

type OrgRepo = typeof organizationRepo;
type RepoOrg = NonNullable<Awaited<ReturnType<OrgRepo['findById']>>>;

describe('OrganizationCredentialSubjectAdapter', () => {
  let adapter: OrganizationCredentialSubjectAdapter;
  let mockOrgRepo: jest.Mocked<Pick<OrgRepo, 'authenticate' | 'findById' | 'findByEmail' | 'createWithPassword' | 'changePassword' | 'createPasswordResetToken' | 'verifyPasswordResetToken'>>;

  beforeEach(() => {
    mockOrgRepo = {
      authenticate: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      createWithPassword: jest.fn(),
      changePassword: jest.fn(),
      createPasswordResetToken: jest.fn(),
      verifyPasswordResetToken: jest.fn(),
    };
    adapter = new OrganizationCredentialSubjectAdapter(mockOrgRepo as unknown as OrgRepo);
  });

  it('implements CredentialSubjectPort', () => {
    expect(typeof adapter.authenticate).toBe('function');
    expect(typeof adapter.findById).toBe('function');
    expect(typeof adapter.findByEmail).toBe('function');
    expect(typeof adapter.createWithPassword).toBe('function');
    expect(typeof adapter.updateLoginTimestamp).toBe('function');
    expect(typeof adapter.changePassword).toBe('function');
    expect(typeof adapter.createPasswordResetToken).toBe('function');
    expect(typeof adapter.verifyPasswordResetToken).toBe('function');
  });

  it('should authenticate and map to CredentialSubject', async () => {
    mockOrgRepo.authenticate.mockResolvedValue({
      organizationId: 'org-1',
      email: 'org@test.com',
      name: 'Test Org',
      status: 'active',
  } as unknown as RepoOrg);

    const result = await adapter.authenticate('org@test.com', 'password');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('org-1');
    expect(result!.email).toBe('org@test.com');
    expect(result!.name).toBe('Test Org');
    expect(result!.status).toBe('active');
    expect(result!.isActive).toBe(true);
  });

  it('should return null when authentication fails', async () => {
    mockOrgRepo.authenticate.mockResolvedValue(null);

    const result = await adapter.authenticate('org@test.com', 'wrong');

    expect(result).toBeNull();
  });

  it('should find by id and map to CredentialSubject', async () => {
    mockOrgRepo.findById.mockResolvedValue({
      organizationId: 'org-1',
      email: 'org@test.com',
      name: 'Test Org',
      status: 'active',
  } as unknown as RepoOrg);

    const result = await adapter.findById('org-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('org-1');
    expect(result!.status).toBe('active');
    expect(result!.isActive).toBe(true);
    expect(result!.lastLoginAt).toBeNull();
  });

  it('should return null when id not found', async () => {
    mockOrgRepo.findById.mockResolvedValue(null);

    const result = await adapter.findById('nonexistent');

    expect(result).toBeNull();
  });

  it('should find by email and map to CredentialSubject', async () => {
    mockOrgRepo.findByEmail.mockResolvedValue({
      organizationId: 'org-1',
      email: 'org@test.com',
      name: 'Test Org',
      status: 'pending',
  } as unknown as RepoOrg);

    const result = await adapter.findByEmail('org@test.com');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('org-1');
    expect(result!.status).toBe('pending');
    expect(result!.isActive).toBe(false);
  });

  it('should create with password and map to CredentialSubject', async () => {
    mockOrgRepo.createWithPassword.mockResolvedValue({
      organizationId: 'org-new',
      email: 'new@test.com',
      name: 'New Org',
      status: 'pending',
  } as unknown as RepoOrg);

    const result = await adapter.createWithPassword({
      email: 'new@test.com',
      password: 'password123',
      name: 'New Org',
    });

    expect(result.id).toBe('org-new');
    expect(result.email).toBe('new@test.com');
    expect(result.status).toBe('pending');
  });

  it('should derive name from firstName/lastName when name not provided', async () => {
    mockOrgRepo.createWithPassword.mockResolvedValue({
      organizationId: 'org-new',
      email: 'new@test.com',
      name: 'Jane Smith',
      status: 'pending',
  } as unknown as RepoOrg);

    await adapter.createWithPassword({
      email: 'new@test.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
    });

    expect(mockOrgRepo.createWithPassword).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane Smith' }));
  });

  it('should derive name from email when no name parts provided', async () => {
    mockOrgRepo.createWithPassword.mockResolvedValue({
      organizationId: 'org-new',
      email: 'user@test.com',
      name: 'user',
      status: 'pending',
  } as unknown as RepoOrg);

    await adapter.createWithPassword({
      email: 'user@test.com',
      password: 'password123',
    });

    expect(mockOrgRepo.createWithPassword).toHaveBeenCalledWith(expect.objectContaining({ name: 'user' }));
  });

  it('should no-op updateLoginTimestamp (orgs do not track login timestamps)', async () => {
    await adapter.updateLoginTimestamp('org-1');
    // Should not throw, should not call repo
    Object.values(mockOrgRepo).forEach(fn => expect(fn).not.toHaveBeenCalled());
  });

  it('should delegate changePassword', async () => {
    mockOrgRepo.changePassword.mockResolvedValue(true);

    await adapter.changePassword('org-1', 'newpass');

    expect(mockOrgRepo.changePassword).toHaveBeenCalledWith('org-1', 'newpass');
  });

  it('should delegate createPasswordResetToken', async () => {
    mockOrgRepo.createPasswordResetToken.mockResolvedValue('reset-token-456');

    const result = await adapter.createPasswordResetToken('org-1');

    expect(result).toBe('reset-token-456');
  });

  it('should delegate verifyPasswordResetToken', async () => {
    mockOrgRepo.verifyPasswordResetToken.mockResolvedValue('org-1');

    const result = await adapter.verifyPasswordResetToken('token');

    expect(result).toBe('org-1');
  });

  it('should return null for invalid reset token', async () => {
    mockOrgRepo.verifyPasswordResetToken.mockResolvedValue(null);

    const result = await adapter.verifyPasswordResetToken('invalid');

    expect(result).toBeNull();
  });
});
