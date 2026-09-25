/**
 * Register Customer Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { Customer } from '../../../../libs/db/types';
import { withTransaction } from '../../../../libs/db';
import { hashString } from '../../../../libs/hash';
import { eventBus } from '../../../../libs/events/eventBus';
import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { CustomerEmailAlreadyExistsError, EmailRequiredError, CustomerValidationError } from '../../domain/errors/CustomerErrors';

// ============================================================================
// Command
// ============================================================================

export class RegisterCustomerCommand {
  constructor(
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly password?: string,
    public readonly phone?: string,
    public readonly dateOfBirth?: Date,
    public readonly preferredCurrency?: string,
    public readonly preferredLanguage?: string,
    public readonly metadata?: Record<string, unknown>,
    public readonly flags?: { isActive?: boolean; isVerified?: boolean },
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface RegisterCustomerResponse {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class RegisterCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: RegisterCustomerCommand): Promise<RegisterCustomerResponse> {
    // Validate
    if (!command.email?.trim()) {
      throw new EmailRequiredError();
    }
    // Password is optional to support provisioning flows (social, SSO, SCIM)
    // that create passwordless accounts; interfaces enforce it for registration.
    if (command.password && command.password.length < 8) {
      throw new CustomerValidationError('Password must be at least 8 characters');
    }

    // Check for existing customer
    const existing = await this.customerRepository.findByEmail(command.email);
    if (existing) {
      throw new CustomerEmailAlreadyExistsError(command.email);
    }

    const customerId = generateUUID();
    const now = new Date();

    const customer: Customer = {
      customerId,
      email: command.email.toLowerCase().trim(),
      firstName: command.firstName?.trim() || '',
      lastName: command.lastName?.trim() || '',
      password: '',
      phone: command.phone?.trim() || null,
      dateOfBirth: command.dateOfBirth || null,
      gender: null,
      avatarUrl: null,
      isActive: command.flags?.isActive ?? true,
      isVerified: command.flags?.isVerified ?? false,
      emailVerified: false,
      phoneVerified: false,
      lastLoginAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      preferredLocaleId: null,
      preferredCurrencyId: null,
      timezone: command.preferredLanguage || null,
      referralSource: null,
      referralCode: null,
      referredBy: null,
      acceptsMarketing: false,
      marketingPreferences: null,
      tags: null,
      note: null,
      externalId: null,
      externalSource: null,
      taxExempt: false,
      taxExemptionCertificate: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      verificationToken: null,
      agreeToTerms: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    // Hash password before saving so both writes happen in a single transaction.
    // Passwordless (provisioned) accounts keep an empty password column so
    // credential comparison can never match — they must sign in via their provider.
    const passwordHash = command.password ? await hashString(command.password, 12) : null;

    // Save customer + password atomically
    await withTransaction(async () => {
      await this.customerRepository.save(customer);
      if (passwordHash) {
        await this.customerRepository.updatePassword(customerId, passwordHash);
      }
    });

    // Emit event
    eventBus.emit('customer.registered', {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    });

    return {
      customerId: customer.customerId,
      email: customer.email,
      firstName: command.firstName,
      lastName: command.lastName,
      isVerified: customer.isVerified,
      createdAt: customer.createdAt.toISOString(),
    };
  }
}
