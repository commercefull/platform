/**
 * RefreshToken Use Case
 */

import { RefreshTokenRequiredError, InvalidRefreshTokenError, RefreshTokenRevokedError, RefreshTokenExpiredError, AccountNotActiveError, InvalidTokenRecordError } from '../../../domain/errors/IdentityErrors';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRecord {
  token: string;
  customerId?: string;
  organizationId?: string;
  revoked: boolean;
  expiresAt: Date;
}

export interface RefreshTokenRepository {
  findByToken(token: string): Promise<RefreshTokenRecord | null>;
  revoke(token: string): Promise<void>;
}

export interface TokenService {
  generateAccessToken(payload: Record<string, unknown>): Promise<string>;
  generateRefreshToken(payload: Record<string, unknown>): Promise<string>;
}

export interface CustomerRecord {
  customerId: string;
  email: string;
  status: string;
}

export interface OrganizationRecord {
  organizationId: string;
  email: string;
  status: string;
  permissions?: string[];
}

export interface CustomerRepository {
  findById(customerId: string): Promise<CustomerRecord | null>;
}

export interface OrganizationRepository {
  findById(organizationId: string): Promise<OrganizationRecord | null>;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly customerRepo: CustomerRepository,
    private readonly organizationRepo: OrganizationRepository,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    if (!input.refreshToken) {
      throw new RefreshTokenRequiredError();
    }

    // Validate refresh token
    const tokenRecord = await this.refreshTokenRepo.findByToken(input.refreshToken);
    if (!tokenRecord) {
      throw new InvalidRefreshTokenError();
    }

    if (tokenRecord.revoked) {
      throw new RefreshTokenRevokedError();
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      throw new RefreshTokenExpiredError();
    }

    let payload: Record<string, unknown>;
    let expiresIn: number;

    if (tokenRecord.customerId) {
      // Customer token
      const customer = await this.customerRepo.findById(tokenRecord.customerId);
      if (!customer || customer.status !== 'active') {
        throw new AccountNotActiveError();
      }
      payload = {
        customerId: customer.customerId,
        email: customer.email,
        type: 'customer',
      };
      expiresIn = 24 * 60 * 60; // 24 hours
    } else if (tokenRecord.organizationId) {
      // Merchant token
      const merchant = await this.organizationRepo.findById(tokenRecord.organizationId);
      if (!merchant || (merchant.status !== 'active' && merchant.status !== 'approved')) {
        throw new AccountNotActiveError();
      }
      payload = {
        organizationId: merchant.organizationId,
        email: merchant.email,
        type: 'organization',
        permissions: merchant.permissions || [],
      };
      expiresIn = 8 * 60 * 60; // 8 hours
    } else {
      throw new InvalidTokenRecordError();
    }

    // Generate new tokens
    const accessToken = await this.tokenService.generateAccessToken(payload);
    const newRefreshToken = await this.tokenService.generateRefreshToken(
      tokenRecord.customerId ? { customerId: tokenRecord.customerId } : { organizationId: tokenRecord.organizationId },
    );

    // Revoke old refresh token
    await this.refreshTokenRepo.revoke(input.refreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    };
  }
}
