/**
 * VerifyCustomerEmail Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';

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

export class VerifyCustomerEmailUseCase {
  constructor(
    private readonly customerRepo: any,
    private readonly emailVerificationRepo: any,
    private readonly authService: any,
    private readonly emailService: any
  ) {}

  async verify(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    if (!input.token) {
      throw new Error('Verification token is required');
    }

    // Find verification record
    const verification = await this.emailVerificationRepo.findByToken(input.token);
    if (!verification) {
      throw new Error('Invalid verification token');
    }

    if (verification.used) {
      throw new Error('Token has already been used');
    }

    if (new Date() > new Date(verification.expiresAt)) {
      throw new Error('Verification token has expired');
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
      throw new Error('Email is required');
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
      throw new Error('Email is already verified');
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
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    return {
      success: true,
      message: 'Verification email has been sent',
    };
  }
}
