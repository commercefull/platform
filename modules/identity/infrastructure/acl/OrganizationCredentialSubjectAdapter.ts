/**
 * OrganizationCredentialSubjectAdapter
 *
 * ACL adapter implementing identity's CredentialSubjectPort.
 * Translates organization's OrganizationRepo into identity's CredentialSubject vocabulary.
 *
 * Only this adapter may import from organization's infrastructure.
 */

import { CredentialSubjectPort, CredentialSubject, CreateCredentialSubjectData } from '../../application/ports/CredentialSubjectPort';
import organizationRepo from '../../../organization/infrastructure/repositories/organizationRepo';

export class OrganizationCredentialSubjectAdapter implements CredentialSubjectPort {
  private readonly repo: typeof organizationRepo;

  constructor(repo?: typeof organizationRepo) {
    this.repo = repo ?? organizationRepo;
  }

  async authenticate(email: string, password: string): Promise<CredentialSubject | null> {
    const result = await this.repo.authenticate({ email, password });
    if (!result) return null;
    return {
      id: result.organizationId,
      email: result.email,
      name: result.name,
      status: result.status,
      isActive: result.status === 'active',
      isVerified: false,
    };
  }

  async findById(id: string): Promise<CredentialSubject | null> {
    const org = await this.repo.findById(id);
    if (!org) return null;
    return {
      id: org.organizationId,
      email: org.email,
      name: org.name,
      status: org.status ?? 'pending',
      isActive: org.status === 'active',
      isVerified: false,
      lastLoginAt: null,
    };
  }

  async findByEmail(email: string): Promise<CredentialSubject | null> {
    const org = await this.repo.findByEmail(email);
    if (!org) return null;
    return {
      id: org.organizationId,
      email: org.email,
      name: org.name,
      status: org.status ?? 'pending',
      isActive: org.status === 'active',
      isVerified: false,
      lastLoginAt: null,
    };
  }

  async createWithPassword(data: CreateCredentialSubjectData): Promise<CredentialSubject> {
    const org = await this.repo.createWithPassword({
      name: data.name ?? (`${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || data.email.split('@')[0]),
      email: data.email,
      phone: data.phone,
      password: data.password,
      status: data.status ?? 'pending',
    });
    return {
      id: org.organizationId,
      email: org.email,
      name: org.name,
      status: org.status ?? 'pending',
      isActive: org.status === 'active',
      isVerified: false,
    };
  }

  async updateLoginTimestamp(_id: string): Promise<void> {
    // Organization repo does not track login timestamps
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    await this.repo.changePassword(id, newPassword);
  }

  async createPasswordResetToken(id: string): Promise<string> {
    return this.repo.createPasswordResetToken(id);
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    return this.repo.verifyPasswordResetToken(token);
  }
}
