/**
 * Customer Credential Repository Interface
 * Password authentication, verification tokens, and password-reset tokens.
 * Shared profile reads/writes live on CustomerRepository.
 */

export interface CustomerAuthCredentials {
  email: string;
  password: string;
}

export interface CustomerAuthResult {
  customerId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface CustomerCredentialRepository {
  authenticate(credentials: CustomerAuthCredentials): Promise<CustomerAuthResult | null>;
  changePassword(customerId: string, newPassword: string): Promise<boolean>;
  createEmailVerificationToken(customerId: string): Promise<string>;
  verifyEmailVerificationToken(token: string): Promise<string | null>;
  createPasswordResetToken(customerId: string): Promise<string>;
  verifyPasswordResetToken(token: string): Promise<string | null>;
}
