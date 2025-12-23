/**
 * LoginCustomer Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface LoginCustomerInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginCustomerOutput {
  customerId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class LoginCustomerUseCase {
  constructor(
    private readonly customerRepo: any,
    private readonly authService: any,
    private readonly tokenService: any
  ) {}

  async execute(input: LoginCustomerInput): Promise<LoginCustomerOutput> {
    if (!input.email || !input.password) {
      throw new Error('Email and password are required');
    }

    // Find customer by email
    const customer = await this.customerRepo.findByEmail(input.email);
    if (!customer) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.authService.verifyPassword(
      input.password,
      customer.passwordHash
    );
    if (!isValidPassword) {
      // Emit failed login event
      eventBus.emit('customer.login_failed', {
        email: input.email,
        reason: 'invalid_password',
      });
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (customer.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Generate tokens
    const expiresIn = input.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 24 hours
    const accessToken = await this.tokenService.generateAccessToken({
      customerId: customer.customerId,
      email: customer.email,
      type: 'customer',
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      customerId: customer.customerId,
    });

    // Update last login
    await this.customerRepo.updateLastLogin(customer.customerId);

    // Emit success event
    eventBus.emit('customer.logged_in', {
      customerId: customer.customerId,
      email: customer.email,
    });

    return {
      customerId: customer.customerId,
      email: customer.email,
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}
