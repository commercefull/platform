/**
 * RegisterMerchant Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface RegisterMerchantInput {
  email: string;
  password: string;
  businessName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  businessType?: string;
  website?: string;
}

export interface RegisterMerchantOutput {
  merchantId: string;
  email: string;
  status: string;
  requiresApproval: boolean;
}

export class RegisterMerchantUseCase {
  constructor(
    private readonly merchantRepo: any,
    private readonly authService: any,
    private readonly emailService: any
  ) {}

  async execute(input: RegisterMerchantInput): Promise<RegisterMerchantOutput> {
    if (!input.email || !input.password || !input.businessName) {
      throw new Error('Email, password, and business name are required');
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
    const existingMerchant = await this.merchantRepo.findByEmail(input.email);
    if (existingMerchant) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await this.authService.hashPassword(input.password);

    // Create merchant
    const merchantId = `merch_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    
    await this.merchantRepo.create({
      merchantId,
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
      await this.emailService.sendMerchantWelcomeEmail({
        to: input.email,
        businessName: input.businessName,
        firstName: input.firstName,
      });
    } catch (error) {
      
    }

    // Emit event
    eventBus.emit('merchant.registered', {
      merchantId,
      email: input.email,
      businessName: input.businessName,
    });

    return {
      merchantId,
      email: input.email,
      status: 'pending_approval',
      requiresApproval: true,
    };
  }
}
