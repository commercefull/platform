/**
 * ResetCustomerPassword Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import { logger } from '../../../../../libs/logger';
import { EmailRequiredOnlyError, TokenRequiredError, PasswordTooShortError, InvalidOrExpiredTokenError, TokenAlreadyUsedError, TokenExpiredError } from '../../../domain/errors/IdentityErrors';

export interface RequestPasswordResetInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface RequestPasswordResetOutput {
  success: boolean;
  message: string;
}

export interface ResetPasswordOutput {
  success: boolean;
  message: string;
}

export interface CustomerRecord {
  customerId: string;
  email: string;
  firstName?: string;
}

export interface PasswordResetRecord {
  customerId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}

export interface CustomerRepository {
  findByEmail(email: string): Promise<CustomerRecord | null>;
  updatePassword(customerId: string, passwordHash: string): Promise<void>;
}

export interface PasswordResetRepository {
  create(data: { customerId: string; token: string; expiresAt: Date; used: boolean }): Promise<void>;
  findByToken(token: string): Promise<PasswordResetRecord | null>;
  markAsUsed(token: string): Promise<void>;
}

export interface AuthService {
  generateResetToken(): Promise<string>;
  hashPassword(password: string): Promise<string>;
}

export interface EmailService {
  sendPasswordResetEmail(params: { to: string; token: string; firstName?: string }): Promise<void>;
}

export class ResetCustomerPasswordUseCase {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly passwordResetRepo: PasswordResetRepository,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  async requestReset(input: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
    if (!input.email) {
      throw new EmailRequiredOnlyError();
    }

    // Find customer
    const customer = await this.customerRepo.findByEmail(input.email);

    // Don't reveal if email exists - always return success
    if (!customer) {
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent',
      };
    }

    // Generate reset token
    const token = await this.authService.generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await this.passwordResetRepo.create({
      customerId: customer.customerId,
      token,
      expiresAt,
      used: false,
    });

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail({
        to: input.email,
        token,
        firstName: customer.firstName,
      });
    } catch (err) {
      logger.warn('Failed to send password reset email', { error: err });
    }

    // Emit event
    eventBus.emit('customer.password_reset_requested', {
      customerId: customer.customerId,
      email: input.email,
    });

    return {
      success: true,
      message: 'If the email exists, a reset link has been sent',
    };
  }

  async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    if (!input.token || !input.newPassword) {
      throw new TokenRequiredError();
    }

    // Validate password strength
    if (input.newPassword.length < 8) {
      throw new PasswordTooShortError();
    }

    // Find and validate reset token
    const resetRecord = await this.passwordResetRepo.findByToken(input.token);
    if (!resetRecord) {
      throw new InvalidOrExpiredTokenError();
    }

    if (resetRecord.used) {
      throw new TokenAlreadyUsedError();
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      throw new TokenExpiredError();
    }

    // Hash new password
    const passwordHash = await this.authService.hashPassword(input.newPassword);

    // Update password
    await this.customerRepo.updatePassword(resetRecord.customerId, passwordHash);

    // Mark token as used
    await this.passwordResetRepo.markAsUsed(input.token);

    // Emit event
    eventBus.emit('customer.password_reset', {
      customerId: resetRecord.customerId,
    });

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }
}
