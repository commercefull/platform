/**
 * RefreshToken Use Case
 */

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
      throw new Error('Refresh token is required');
    }

    // Validate refresh token
    const tokenRecord = await this.refreshTokenRepo.findByToken(input.refreshToken);
    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    if (tokenRecord.revoked) {
      throw new Error('Refresh token has been revoked');
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      throw new Error('Refresh token has expired');
    }

    let payload: Record<string, unknown>;
    let expiresIn: number;

    if (tokenRecord.customerId) {
      // Customer token
      const customer = await this.customerRepo.findById(tokenRecord.customerId);
      if (!customer || customer.status !== 'active') {
        throw new Error('Account is not active');
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
        throw new Error('Account is not active');
      }
      payload = {
        organizationId: merchant.organizationId,
        email: merchant.email,
        type: 'organization',
        permissions: merchant.permissions || [],
      };
      expiresIn = 8 * 60 * 60; // 8 hours
    } else {
      throw new Error('Invalid token record');
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
