/**
 * RegisterCustomer Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface RegisterCustomerInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

export interface RegisterCustomerOutput {
  customerId: string;
  email: string;
  requiresVerification: boolean;
}

export class RegisterCustomerUseCase {
  constructor(
    private readonly customerRepo: any,
    private readonly authService: any,
    private readonly emailService: any
  ) {}

  async execute(input: RegisterCustomerInput): Promise<RegisterCustomerOutput> {
    if (!input.email || !input.password) {
      throw new Error('Email and password are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (input.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if email already exists
    const existingCustomer = await this.customerRepo.findByEmail(input.email);
    if (existingCustomer) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await this.authService.hashPassword(input.password);

    // Create customer
    const customerId = `cust_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    
    await this.customerRepo.create({
      customerId,
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      acceptsMarketing: input.acceptsMarketing ?? false,
      status: 'pending_verification',
      emailVerified: false,
    });

    // Generate verification token
    const verificationToken = await this.authService.generateVerificationToken(customerId);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail({
        to: input.email,
        token: verificationToken,
        firstName: input.firstName,
      });
    } catch (error) {
      
    }

    // Emit event
    eventBus.emit('customer.registered', {
      customerId,
      email: input.email,
    });

    return {
      customerId,
      email: input.email,
      requiresVerification: true,
    };
  }
}
