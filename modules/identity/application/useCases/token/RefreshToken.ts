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

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepo: any,
    private readonly tokenService: any,
    private readonly customerRepo: any,
    private readonly merchantRepo: any,
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
    } else if (tokenRecord.merchantId) {
      // Merchant token
      const merchant = await this.merchantRepo.findById(tokenRecord.merchantId);
      if (!merchant || (merchant.status !== 'active' && merchant.status !== 'approved')) {
        throw new Error('Account is not active');
      }
      payload = {
        merchantId: merchant.merchantId,
        email: merchant.email,
        type: 'merchant',
        permissions: merchant.permissions || [],
      };
      expiresIn = 8 * 60 * 60; // 8 hours
    } else {
      throw new Error('Invalid token record');
    }

    // Generate new tokens
    const accessToken = await this.tokenService.generateAccessToken(payload);
    const newRefreshToken = await this.tokenService.generateRefreshToken(
      tokenRecord.customerId ? { customerId: tokenRecord.customerId } : { merchantId: tokenRecord.merchantId },
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
