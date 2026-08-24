/**
 * RegisterOrganization Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import { logger } from '../../../../../libs/logger';
import { OrganizationRegistrationFieldsRequiredError, InvalidEmailFormatError, PasswordTooShortError, EmailAlreadyRegisteredError } from '../../../domain/errors/IdentityErrors';

export interface RegisterOrganizationInput {
  email: string;
  password: string;
  businessName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  businessType?: string;
  website?: string;
}

export interface RegisterOrganizationOutput {
  organizationId: string;
  email: string;
  status: string;
  requiresApproval: boolean;
}

export interface OrganizationRecord {
  organizationId: string;
  email: string;
}

export interface OrganizationRepository {
  findByEmail(email: string): Promise<OrganizationRecord | null>;
  create(data: {
    organizationId: string;
    email: string;
    passwordHash: string;
    businessName: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    businessType?: string;
    website?: string;
    status: string;
    emailVerified: boolean;
  }): Promise<void>;
}

export interface AuthService {
  hashPassword(password: string): Promise<string>;
}

export interface EmailService {
  sendOrganizationWelcomeEmail(params: { to: string; businessName: string; firstName?: string }): Promise<void>;
}

export class RegisterOrganizationUseCase {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: RegisterOrganizationInput): Promise<RegisterOrganizationOutput> {
    if (!input.email || !input.password || !input.businessName) {
      throw new OrganizationRegistrationFieldsRequiredError();
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new InvalidEmailFormatError();
    }

    // Validate password strength
    if (input.password.length < 8) {
      throw new PasswordTooShortError();
    }

    // Check if email already exists
    const existingOrganization = await this.organizationRepo.findByEmail(input.email);
    if (existingOrganization) {
      throw new EmailAlreadyRegisteredError();
    }

    // Hash password
    const passwordHash = await this.authService.hashPassword(input.password);

    // Create merchant
    const organizationId = `merch_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    await this.organizationRepo.create({
      organizationId,
      email: input.email.toLowerCase(),
      passwordHash,
      businessName: input.businessName,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      businessType: input.businessType,
      website: input.website,
      status: 'pending_approval',
      emailVerified: false,
    });

    // Send welcome email
    try {
      await this.emailService.sendOrganizationWelcomeEmail({
        to: input.email,
        businessName: input.businessName,
        firstName: input.firstName,
      });
    } catch (err) {
      logger.warn('Failed to send organization welcome email', { error: err });
    }

    // Emit event
    eventBus.emit('organization.registered', {
      organizationId,
      email: input.email,
      businessName: input.businessName,
    });

    return {
      organizationId,
      email: input.email,
      status: 'pending_approval',
      requiresApproval: true,
    };
  }
}
