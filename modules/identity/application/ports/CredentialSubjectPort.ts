/**
 * CredentialSubjectPort
 *
 * ACL port owned by identity. Abstracts credential subject operations
 * (authenticate, find, create, password management) so identity never
 * imports from customer or organization infrastructure directly.
 *
 * One port, two adapters: CustomerCredentialSubjectAdapter, OrganizationCredentialSubjectAdapter.
 */

export interface CredentialSubject {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date | null;
}

export interface CreateCredentialSubjectData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  isActive?: boolean;
  isVerified?: boolean;
  status?: string;
}

export interface CredentialSubjectPort {
  authenticate(email: string, password: string): Promise<CredentialSubject | null>;
  findById(id: string): Promise<CredentialSubject | null>;
  findByEmail(email: string): Promise<CredentialSubject | null>;
  createWithPassword(data: CreateCredentialSubjectData): Promise<CredentialSubject>;
  updateLoginTimestamp(id: string): Promise<void>;
  changePassword(id: string, newPassword: string): Promise<void>;
  createPasswordResetToken(id: string): Promise<string>;
  verifyPasswordResetToken(token: string): Promise<string | null>;
}
