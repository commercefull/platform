/**
 * VerifyCustomerEmail Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import { logger } from '../../../../../libs/logger';
import { VerificationTokenRequiredError, InvalidVerificationTokenError, VerificationTokenAlreadyUsedError, VerificationTokenExpiredError, EmailRequiredOnlyError, EmailAlreadyVerifiedError } from '../../../domain/errors/IdentityErrors';

export interface VerifyEmailInput {
  token: string;
}

export interface ResendVerificationInput {
  email: string;
}

export interface VerifyEmailOutput {
  success: boolean;
  customerId: string;
  message: string;
}

export interface ResendVerificationOutput {
  success: boolean;
  message: string;
}

export interface CustomerRecord {
  customerId: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
}

export interface EmailVerificationRecord {
  customerId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}

export interface CustomerRepository {
  findByEmail(email: string): Promise<CustomerRecord | null>;
  update(customerId: string, data: { emailVerified: boolean; status: string }): Promise<void>;
}

export interface EmailVerificationRepository {
  findByToken(token: string): Promise<EmailVerificationRecord | null>;
  markAsUsed(token: string): Promise<void>;
  create(data: { customerId: string; token: string; expiresAt: Date; used: boolean }): Promise<void>;
}

export interface AuthService {
  generateVerificationToken(customerId: string): Promise<string>;
}

export interface EmailService {
  sendVerificationEmail(params: { to: string; token: string; firstName?: string }): Promise<void>;
}

export class VerifyCustomerEmailUseCase {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly emailVerificationRepo: EmailVerificationRepository,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  async verify(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    if (!input.token) {
      throw new VerificationTokenRequiredError();
    }

    // Find verification record
    const verification = await this.emailVerificationRepo.findByToken(input.token);
    if (!verification) {
      throw new InvalidVerificationTokenError();
    }

    if (verification.used) {
      throw new VerificationTokenAlreadyUsedError();
    }

    if (new Date() > new Date(verification.expiresAt)) {
      throw new VerificationTokenExpiredError();
    }

    // Update customer
    await this.customerRepo.update(verification.customerId, {
      emailVerified: true,
      status: 'active',
    });

    // Mark token as used
    await this.emailVerificationRepo.markAsUsed(input.token);

    // Emit event
    eventBus.emit('customer.email_verified', {
      customerId: verification.customerId,
    });

    return {
      success: true,
      customerId: verification.customerId,
      message: 'Email verified successfully',
    };
  }

  async resendVerification(input: ResendVerificationInput): Promise<ResendVerificationOutput> {
    if (!input.email) {
      throw new EmailRequiredOnlyError();
    }

    // Find customer
    const customer = await this.customerRepo.findByEmail(input.email);
    if (!customer) {
      return {
        success: true,
        message: 'If the email exists, a verification link has been sent',
      };
    }

    if (customer.emailVerified) {
      throw new EmailAlreadyVerifiedError();
    }

    // Generate new verification token
    const token = await this.authService.generateVerificationToken(customer.customerId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification record
    await this.emailVerificationRepo.create({
      customerId: customer.customerId,
      token,
      expiresAt,
      used: false,
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail({
        to: input.email,
        token,
        firstName: customer.firstName,
      });
    } catch (err) {
      logger.warn('Failed to send customer welcome email', { error: err });
    }

    return {
      success: true,
      message: 'Verification email has been sent',
    };
  }
}
