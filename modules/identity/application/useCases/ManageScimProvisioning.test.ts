import { ManageScimProvisioningUseCase } from './ManageScimProvisioning';
import { eventBus } from '../../../../libs/events/eventBus';
import { ScimValidationError, ScimResourceNotFoundError, ScimConflictError } from '../../domain/errors/SsoErrors';
import type { ScimProvisioningRepository, ScimProvisioningRecord } from '../../domain/repositories/SsoProviderRepository';
import type { CredentialSubject, CredentialSubjectPort } from '../ports/CredentialSubjectPort';
import { lazyMock } from '../../tests/testUtils';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

const emitMock = eventBus.emit as jest.Mock;

const makeUser = (overrides: Partial<CredentialSubject> = {}): CredentialSubject => ({
  id: 'user-1',
  email: 'scim@example.com',
  status: 'active',
  isActive: true,
  isVerified: true,
  ...overrides,
});

const makeRecord = (overrides: Partial<ScimProvisioningRecord> = {}): ScimProvisioningRecord => ({
  recordId: 'rec-1',
  organizationId: 'org-1',
  userId: 'user-1',
  userType: 'organization',
  scimUserId: 'scim-1',
  source: 'scim',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('ManageScimProvisioningUseCase', () => {
  let provisioningRepo: jest.Mocked<ScimProvisioningRepository>;
  let credentialPort: jest.Mocked<CredentialSubjectPort>;
  let useCase: ManageScimProvisioningUseCase;

  beforeEach(() => {
    provisioningRepo = lazyMock<ScimProvisioningRepository>();
    credentialPort = lazyMock<CredentialSubjectPort>();
    useCase = new ManageScimProvisioningUseCase(provisioningRepo, credentialPort);
    emitMock.mockClear();
  });

  describe('provisionUser', () => {
    it('should create a credential subject and provisioning record for a new email', async () => {
      credentialPort.findByEmail.mockResolvedValue(null);
      credentialPort.createWithPassword.mockResolvedValue(makeUser({ id: 'user-new' }));
      provisioningRepo.save.mockImplementation(async (r) => r);
      credentialPort.findById.mockResolvedValue(makeUser({ id: 'user-new' }));

      const result = await useCase.provisionUser({
        organizationId: 'org-1',
        email: 'scim@example.com',
        givenName: 'Scim',
        familyName: 'User',
      });

      expect(credentialPort.createWithPassword).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'scim@example.com', isVerified: true }),
      );
      expect(provisioningRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-new', organizationId: 'org-1', source: 'scim', isActive: true }),
      );
      expect(result.isNewUser).toBe(true);
      expect(emitMock).toHaveBeenCalledWith(
        'identity.scim.user_provisioned',
        expect.objectContaining({ userId: 'user-new', isNewUser: true }),
      );
    });

    it('should link an existing unprovisioned user', async () => {
      credentialPort.findByEmail.mockResolvedValue(makeUser());
      provisioningRepo.findByUserId.mockResolvedValue(null);
      provisioningRepo.save.mockImplementation(async (r) => r);
      credentialPort.findById.mockResolvedValue(makeUser());

      const result = await useCase.provisionUser({ organizationId: 'org-1', email: 'scim@example.com' });

      expect(credentialPort.createWithPassword).not.toHaveBeenCalled();
      expect(result.isNewUser).toBe(false);
    });

    it('should throw ScimConflictError when the user is already provisioned', async () => {
      credentialPort.findByEmail.mockResolvedValue(makeUser());
      provisioningRepo.findByUserId.mockResolvedValue(makeRecord());

      await expect(
        useCase.provisionUser({ organizationId: 'org-1', email: 'scim@example.com' }),
      ).rejects.toBeInstanceOf(ScimConflictError);
      expect(provisioningRepo.save).not.toHaveBeenCalled();
    });

    it('should reject when organizationId or email is missing', async () => {
      await expect(useCase.provisionUser({ email: 'a@b.c' })).rejects.toBeInstanceOf(ScimValidationError);
      await expect(useCase.provisionUser({ organizationId: 'org-1' })).rejects.toBeInstanceOf(
        ScimValidationError,
      );
    });
  });

  describe('replaceUser', () => {
    it('should deactivate the record when active becomes false', async () => {
      const record = makeRecord();
      provisioningRepo.findByScimUserId.mockResolvedValueOnce(record).mockResolvedValueOnce({
        ...record,
        isActive: false,
      });
      credentialPort.findById.mockResolvedValue(makeUser());

      const result = await useCase.replaceUser('scim-1', { active: false });

      expect(provisioningRepo.deactivate).toHaveBeenCalledWith('rec-1');
      expect(result.active).toBe(false);
      expect(emitMock).toHaveBeenCalledWith(
        'identity.scim.user_updated',
        expect.objectContaining({ scimUserId: 'scim-1', active: false }),
      );
    });

    it('should not deactivate when already inactive', async () => {
      provisioningRepo.findByScimUserId.mockResolvedValue(makeRecord({ isActive: false }));
      credentialPort.findById.mockResolvedValue(makeUser());

      await useCase.replaceUser('scim-1', { active: false });

      expect(provisioningRepo.deactivate).not.toHaveBeenCalled();
    });

    it('should throw ScimResourceNotFoundError for unknown records or users', async () => {
      provisioningRepo.findByScimUserId.mockResolvedValue(null);
      await expect(useCase.replaceUser('nope', { active: true })).rejects.toBeInstanceOf(
        ScimResourceNotFoundError,
      );

      provisioningRepo.findByScimUserId.mockResolvedValue(makeRecord());
      credentialPort.findById.mockResolvedValue(null);
      await expect(useCase.replaceUser('scim-1', { active: true })).rejects.toBeInstanceOf(
        ScimResourceNotFoundError,
      );
    });
  });

  describe('patchUser', () => {
    it('should deactivate on a replace-active-false operation', async () => {
      provisioningRepo.findByScimUserId.mockResolvedValue(makeRecord());

      await useCase.patchUser('scim-1', [{ op: 'replace', path: 'active', value: false }]);

      expect(provisioningRepo.deactivate).toHaveBeenCalledWith('rec-1');
      expect(emitMock).toHaveBeenCalledWith(
        'identity.scim.user_updated',
        expect.objectContaining({ scimUserId: 'scim-1' }),
      );
    });

    it('should emit without deactivating for unrelated operations', async () => {
      provisioningRepo.findByScimUserId.mockResolvedValue(makeRecord());

      await useCase.patchUser('scim-1', [{ op: 'replace', path: 'displayName', value: 'X' }]);

      expect(provisioningRepo.deactivate).not.toHaveBeenCalled();
      expect(emitMock).toHaveBeenCalledWith('identity.scim.user_updated', expect.anything());
    });

    it('should throw ScimResourceNotFoundError for an unknown user', async () => {
      provisioningRepo.findByScimUserId.mockResolvedValue(null);
      await expect(useCase.patchUser('nope', undefined)).rejects.toBeInstanceOf(
        ScimResourceNotFoundError,
      );
    });
  });

  describe('deprovisionUser', () => {
    it('should deactivate and emit deprovisioned', async () => {
      provisioningRepo.findByScimUserId.mockResolvedValue(makeRecord());

      await useCase.deprovisionUser('scim-1');

      expect(provisioningRepo.deactivate).toHaveBeenCalledWith('rec-1');
      expect(emitMock).toHaveBeenCalledWith(
        'identity.scim.user_deprovisioned',
        expect.objectContaining({ userId: 'user-1', scimUserId: 'scim-1', organizationId: 'org-1' }),
      );
    });

    it('should throw ScimResourceNotFoundError for an unknown user', async () => {
      provisioningRepo.findByScimUserId.mockResolvedValue(null);
      await expect(useCase.deprovisionUser('nope')).rejects.toBeInstanceOf(ScimResourceNotFoundError);
      expect(provisioningRepo.deactivate).not.toHaveBeenCalled();
    });
  });
});
