/**
 * RenewAccessToken Use Case
 *
 * Exchanges a valid, non-revoked refresh token for a new access token.
 * The refresh token stays valid and is marked as used for tracking.
 */

import type { CredentialSubjectPort, CredentialSubject } from '../../ports/CredentialSubjectPort';
import type { TokenRepository } from '../../../domain/repositories/TokenRepository';
import {
  RefreshTokenRequiredError,
  InvalidRefreshTokenError,
  AccountNotActiveError,
} from '../../../domain/errors/IdentityErrors';
import { emitCustomerTokenRefreshed, emitOrganizationTokenRefreshed } from '../../../domain/events/emitIdentityEvent';
import type { JwtTokenPort, TokenSubjectType } from './IssueTokenPair';

export interface RenewAccessTokenConfig {
  userType: TokenSubjectType;
  jwtSecret: string;
  accessTokenDuration: string;
  requireActiveStatus: boolean;
}

export class RenewAccessTokenCommand {
  constructor(
    public readonly refreshToken: string,
    public readonly ipAddress?: string,
  ) {}
}

export interface RenewAccessTokenResult {
  accessToken: string;
  expiresIn: string;
  subject: CredentialSubject;
}

export class RenewAccessTokenUseCase {
  constructor(
    private readonly credentialPort: CredentialSubjectPort,
    private readonly tokenRepo: TokenRepository,
    private readonly jwt: JwtTokenPort,
    private readonly config: RenewAccessTokenConfig,
  ) {}

  async execute(command: RenewAccessTokenCommand): Promise<RenewAccessTokenResult> {
    if (!command.refreshToken) {
      throw new RefreshTokenRequiredError();
    }

    const tokenPayload = this.jwt.verify(command.refreshToken, this.config.jwtSecret);
    if (!tokenPayload || !tokenPayload.id || tokenPayload.tokenUse === 'access') {
      throw new InvalidRefreshTokenError();
    }

    const storedToken = await this.tokenRepo.findRefreshToken(command.refreshToken);
    if (!storedToken || storedToken.userId !== tokenPayload.id || storedToken.userType !== this.config.userType) {
      throw new InvalidRefreshTokenError();
    }

    const subject = await this.credentialPort.findById(tokenPayload.id);
    if (!subject) {
      throw new InvalidRefreshTokenError();
    }

    if (this.config.requireActiveStatus && subject.status !== 'active') {
      throw new AccountNotActiveError();
    }

    const accessToken = this.jwt.sign(subject.id, subject.email, this.config.userType, this.config.jwtSecret, this.config.accessTokenDuration);

    await this.tokenRepo.markRefreshTokenUsed(command.refreshToken);

    const refreshedPayload = { userId: subject.id, ipAddress: command.ipAddress };
    if (this.config.userType === 'organization') {
      emitOrganizationTokenRefreshed(refreshedPayload);
    } else {
      emitCustomerTokenRefreshed(refreshedPayload);
    }

    return {
      accessToken,
      expiresIn: this.config.accessTokenDuration,
      subject,
    };
  }
}
