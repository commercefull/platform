/**
 * LoginMerchant Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface LoginMerchantInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginMerchantOutput {
  merchantId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  permissions: string[];
}

export class LoginMerchantUseCase {
  constructor(
    private readonly merchantRepo: any,
    private readonly authService: any,
    private readonly tokenService: any
  ) {}

  async execute(input: LoginMerchantInput): Promise<LoginMerchantOutput> {
    if (!input.email || !input.password) {
      throw new Error('Email and password are required');
    }

    // Find merchant by email
    const merchant = await this.merchantRepo.findByEmail(input.email);
    if (!merchant) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.authService.verifyPassword(
      input.password,
      merchant.passwordHash
    );
    if (!isValidPassword) {
      eventBus.emit('merchant.login_failed', {
        email: input.email,
        reason: 'invalid_password',
      });
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (merchant.status !== 'active' && merchant.status !== 'approved') {
      throw new Error('Account is not active');
    }

    // Generate tokens
    const expiresIn = input.rememberMe ? 7 * 24 * 60 * 60 : 8 * 60 * 60; // 7 days or 8 hours
    const accessToken = await this.tokenService.generateAccessToken({
      merchantId: merchant.merchantId,
      email: merchant.email,
      type: 'merchant',
      permissions: merchant.permissions || [],
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      merchantId: merchant.merchantId,
    });

    // Update last login
    await this.merchantRepo.updateLastLogin(merchant.merchantId);

    // Emit success event
    eventBus.emit('merchant.logged_in', {
      merchantId: merchant.merchantId,
      email: merchant.email,
    });

    return {
      merchantId: merchant.merchantId,
      email: merchant.email,
      accessToken,
      refreshToken,
      expiresIn,
      permissions: merchant.permissions || [],
    };
  }
}
