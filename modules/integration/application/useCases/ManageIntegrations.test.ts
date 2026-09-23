import '../../tests/testUtils';
import { ManageIntegrationsUseCase } from './ManageIntegrations';
import { CredentialNotFoundError, IntegrationNotFoundError } from '../../domain/errors/IntegrationErrors';
import type {
  IntegrationRepository, IntegrationCredentialRepository,
} from '../../domain/repositories/IntegrationRepository';
import { createIntegration, lazyMock } from '../../tests/testUtils';

describe('ManageIntegrationsUseCase', () => {
  let integrationRepo: jest.Mocked<IntegrationRepository>;
  let credentialRepo: jest.Mocked<IntegrationCredentialRepository>;
  let useCase: ManageIntegrationsUseCase;

  beforeEach(() => {
    integrationRepo = lazyMock<IntegrationRepository>();
    credentialRepo = lazyMock<IntegrationCredentialRepository>();
    integrationRepo.create.mockImplementation(async i => i);
    integrationRepo.update.mockImplementation(async i => i);
    credentialRepo.create.mockImplementation(async c => c);
    credentialRepo.update.mockImplementation(async c => c);
    useCase = new ManageIntegrationsUseCase(integrationRepo, credentialRepo);
  });

  it('should create an integration in pending status', async () => {
    const result = await useCase.createIntegration({ organizationId: 'org-1', name: 'ERP', provider: 'custom' });

    expect(result.status).toBe('pending');
    expect(integrationRepo.create).toHaveBeenCalled();
  });

  it('should activate an integration when it exists', async () => {
    integrationRepo.findById.mockResolvedValue(createIntegration());

    const result = await useCase.activateIntegration('int-1');

    expect(result.status).toBe('active');
    expect(integrationRepo.update).toHaveBeenCalled();
  });

  it('should throw IntegrationNotFoundError when the integration does not exist', async () => {
    integrationRepo.findById.mockResolvedValue(null);

    await expect(useCase.getIntegration('missing')).rejects.toThrow(IntegrationNotFoundError);
  });

  it('should add an encrypted credential', async () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = 'a'.repeat(64);

    const result = await useCase.addCredential({
      integrationId: 'int-1', type: 'api_key', label: 'Key', credentials: { key: 'secret' },
    });

    expect(result.encryptedData).not.toBe('secret');
    expect(credentialRepo.create).toHaveBeenCalled();
  });

  it('should decrypt a credential back to its original payload', async () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = 'a'.repeat(64);
    const added = await useCase.addCredential({
      integrationId: 'int-1', type: 'api_key', label: 'Key', credentials: { key: 'secret' },
    });
    credentialRepo.findById.mockResolvedValue(added);

    const decrypted = await useCase.getDecryptedCredential('cred-1');

    expect(decrypted).toEqual({ key: 'secret' });
  });

  it('should throw CredentialNotFoundError when the credential does not exist', async () => {
    credentialRepo.findById.mockResolvedValue(null);

    await expect(useCase.getDecryptedCredential('missing')).rejects.toThrow(CredentialNotFoundError);
  });

  it('should return null when the integration has no active credentials', async () => {
    credentialRepo.findActiveByIntegration.mockResolvedValue([]);

    await expect(useCase.getDecryptedCredentialsByIntegration('int-1')).resolves.toBeNull();
  });
});

