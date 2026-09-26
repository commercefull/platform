/**
 * Manage SCIM Provisioning Use Case
 * SCIM 2.0 user provisioning lifecycle: provision, replace, patch,
 * and deprovision organization users.
 */

import { generateUUID } from '../../../../libs/uuid';
import { eventBus } from '../../../../libs/events/eventBus';
import type { ScimProvisioningRepository, ScimProvisioningRecord } from '../../domain/repositories/SsoProviderRepository';
import { ScimValidationError, ScimResourceNotFoundError, ScimConflictError } from '../../domain/errors/SsoErrors';
import type { CredentialSubject, CredentialSubjectPort } from '../ports/CredentialSubjectPort';

export interface ProvisionScimUserCommand {
  organizationId?: string;
  email?: string;
  givenName?: string;
  familyName?: string;
  displayName?: string;
  active?: boolean;
  externalId?: string;
}

export interface ScimPatchOperation {
  op: string;
  path?: string;
  value: unknown;
}

export interface ProvisionedUserResult {
  record: ScimProvisioningRecord;
  user: CredentialSubject;
  isNewUser: boolean;
}

export interface ReplacedUserResult {
  record: ScimProvisioningRecord;
  user: CredentialSubject;
  active: boolean;
}

export class ManageScimProvisioningUseCase {
  constructor(
    private readonly provisioningRepo: ScimProvisioningRepository,
    private readonly credentialPort: CredentialSubjectPort,
  ) {}

  async listUsers(organizationId: string): Promise<{ record: ScimProvisioningRecord; user: CredentialSubject }[]> {
    const records = await this.provisioningRepo.findByOrganizationId(organizationId);
    const results: { record: ScimProvisioningRecord; user: CredentialSubject }[] = [];
    for (const record of records) {
      const user = await this.credentialPort.findById(record.userId);
      if (user) {
        results.push({ record, user });
      }
    }
    return results;
  }

  async getUser(scimUserId: string): Promise<{ record: ScimProvisioningRecord; user: CredentialSubject }> {
    const record = await this.provisioningRepo.findByScimUserId(scimUserId);
    if (!record) {
      throw new ScimResourceNotFoundError('User', scimUserId);
    }
    const user = await this.credentialPort.findById(record.userId);
    if (!user) {
      throw new ScimResourceNotFoundError('User', scimUserId);
    }
    return { record, user };
  }

  async provisionUser(command: ProvisionScimUserCommand): Promise<ProvisionedUserResult> {
    const organizationId = command.organizationId || '';
    if (!organizationId) {
      throw new ScimValidationError('organizationId is required');
    }
    if (!command.email) {
      throw new ScimValidationError('At least one email is required');
    }
    const email = command.email;
    const active = command.active ?? true;

    // Check if user already exists
    const existing = await this.credentialPort.findByEmail(email);
    if (existing) {
      // Check if already provisioned
      const existingRecord = await this.provisioningRepo.findByUserId(existing.id);
      if (existingRecord) {
        throw new ScimConflictError(`User with email ${email} already provisioned`);
      }
    }

    // Create or find user
    let userId: string;
    let isNewUser = false;

    if (existing) {
      userId = existing.id;
    } else {
      const created = await this.credentialPort.createWithPassword({
        email,
        password: '',
        firstName: command.givenName || '',
        lastName: command.familyName || '',
        name: command.displayName,
        isActive: active,
        isVerified: true,
      });
      userId = created.id;
      isNewUser = true;
    }

    // Create provisioning record
    const scimUserId = generateUUID();
    const now = new Date();
    const record = await this.provisioningRepo.save({
      recordId: generateUUID(),
      organizationId,
      userId,
      userType: 'organization',
      scimUserId,
      externalId: command.externalId,
      source: 'scim',
      isActive: active,
      createdAt: now,
      updatedAt: now,
    });

    const user = await this.credentialPort.findById(userId);
    if (!user) {
      throw new ScimResourceNotFoundError('User', userId);
    }

    eventBus.emit('identity.scim.user_provisioned', {
      userId,
      organizationId,
      scimUserId,
      email,
      isNewUser,
      timestamp: now,
    });

    return { record, user, isNewUser };
  }

  async replaceUser(scimUserId: string, command: { active?: boolean }): Promise<ReplacedUserResult> {
    const record = await this.provisioningRepo.findByScimUserId(scimUserId);
    if (!record) {
      throw new ScimResourceNotFoundError('User', scimUserId);
    }

    const user = await this.credentialPort.findById(record.userId);
    if (!user) {
      throw new ScimResourceNotFoundError('User', scimUserId);
    }

    const active = command.active ?? true;
    if (!active && record.isActive) {
      await this.provisioningRepo.deactivate(record.recordId);
    }

    eventBus.emit('identity.scim.user_updated', {
      userId: record.userId,
      scimUserId,
      active,
      timestamp: new Date(),
    });

    const updatedRecord = await this.provisioningRepo.findByScimUserId(scimUserId);
    return { record: updatedRecord!, user, active };
  }

  async patchUser(scimUserId: string, operations: ScimPatchOperation[] | undefined): Promise<void> {
    const record = await this.provisioningRepo.findByScimUserId(scimUserId);
    if (!record) {
      throw new ScimResourceNotFoundError('User', scimUserId);
    }

    // SCIM PATCH operations
    if (operations) {
      for (const op of operations) {
        if (op.op.toLowerCase() === 'replace' && op.path === 'active') {
          const active = op.value as boolean;
          if (!active && record.isActive) {
            await this.provisioningRepo.deactivate(record.recordId);
          }
        }
      }
    }

    eventBus.emit('identity.scim.user_updated', {
      userId: record.userId,
      scimUserId,
      timestamp: new Date(),
    });
  }

  async deprovisionUser(scimUserId: string): Promise<void> {
    const record = await this.provisioningRepo.findByScimUserId(scimUserId);
    if (!record) {
      throw new ScimResourceNotFoundError('User', scimUserId);
    }

    await this.provisioningRepo.deactivate(record.recordId);

    eventBus.emit('identity.scim.user_deprovisioned', {
      userId: record.userId,
      scimUserId,
      organizationId: record.organizationId,
      timestamp: new Date(),
    });
  }
}
