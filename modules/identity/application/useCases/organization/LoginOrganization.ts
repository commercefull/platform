/**
 * LoginOrganization Use Case
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import { EmailAndPasswordRequiredError, InvalidCredentialsError, AccountNotActiveError } from '../../../domain/errors/IdentityErrors';

export interface LoginOrganizationInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginOrganizationOutput {
  organizationId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  permissions: string[];
}

export interface OrganizationRecord {
  organizationId: string;
  email: string;
  passwordHash: string;
  status: string;
  permissions?: string[];
}

export interface OrganizationRepository {
  findByEmail(email: string): Promise<OrganizationRecord | null>;
  updateLastLogin(organizationId: string): Promise<void>;
}

export interface AuthService {
  verifyPassword(password: string, hash: string): Promise<boolean>;
}

export interface TokenService {
  generateAccessToken(payload: Record<string, unknown>): Promise<string>;
  generateRefreshToken(payload: Record<string, unknown>): Promise<string>;
}

export class LoginOrganizationUseCase {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginOrganizationInput): Promise<LoginOrganizationOutput> {
    if (!input.email || !input.password) {
      throw new EmailAndPasswordRequiredError();
    }

    // Find merchant by email
    const merchant = await this.organizationRepo.findByEmail(input.email);
    if (!merchant) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isValidPassword = await this.authService.verifyPassword(input.password, merchant.passwordHash);
    if (!isValidPassword) {
      eventBus.emit('organization.login_failed', {
        email: input.email,
        reason: 'invalid_password',
      });
      throw new InvalidCredentialsError();
    }

    // Check if account is active
    if (merchant.status !== 'active' && merchant.status !== 'approved') {
      throw new AccountNotActiveError();
    }

    // Generate tokens
    const expiresIn = input.rememberMe ? 7 * 24 * 60 * 60 : 8 * 60 * 60; // 7 days or 8 hours
    const accessToken = await this.tokenService.generateAccessToken({
      organizationId: merchant.organizationId,
      email: merchant.email,
      type: 'organization',
      permissions: merchant.permissions || [],
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      organizationId: merchant.organizationId,
    });

    // Update last login
    await this.organizationRepo.updateLastLogin(merchant.organizationId);

    // Emit success event
    eventBus.emit('organization.logged_in', {
      organizationId: merchant.organizationId,
      email: merchant.email,
    });

    return {
      organizationId: merchant.organizationId,
      email: merchant.email,
      accessToken,
      refreshToken,
      expiresIn,
      permissions: merchant.permissions || [],
    };
  }
}
