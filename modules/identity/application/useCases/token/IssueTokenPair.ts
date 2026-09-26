/**
 * IssueTokenPair Use Case
 *
 * Authenticates a credential subject (customer or organization) and issues a
 * JWT access/refresh token pair. The refresh token is persisted so it can be
 * revoked or tracked per device.
 */

import type { CredentialSubjectPort, CredentialSubject } from '../../ports/CredentialSubjectPort';
import type { TokenRepository } from '../../../domain/repositories/TokenRepository';
import {
  EmailAndPasswordRequiredError,
  InvalidCredentialsError,
  AccountNotActiveError,
} from '../../../domain/errors/IdentityErrors';
import { parseExpirationDate } from '../../../utils/jwtHelpers';
import type { JwtPayload } from 'jsonwebtoken';

export type TokenSubjectType = 'customer' | 'organization';

export interface JwtTokenPort {
  sign(subjectId: string, email: string, userType: TokenSubjectType, secret: string, expiresIn: string, tokenUse?: 'access' | 'refresh'): string;
  verify(token: string, secret: string): JwtPayload | null;
}

export interface IssueTokenPairConfig {
  userType: TokenSubjectType;
  jwtSecret: string;
  accessTokenDuration: string;
  refreshTokenDuration: string;
  requireActiveStatus: boolean;
  trackLoginTimestamp: boolean;
}

export class IssueTokenPairCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly userAgent?: string | null,
    public readonly ipAddress?: string | null,
  ) {}
}

export interface IssueTokenPairResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  subject: CredentialSubject;
}

export class IssueTokenPairUseCase {
  constructor(
    private readonly credentialPort: CredentialSubjectPort,
    private readonly tokenRepo: TokenRepository,
    private readonly jwt: JwtTokenPort,
    private readonly config: IssueTokenPairConfig,
  ) {}

  async execute(command: IssueTokenPairCommand): Promise<IssueTokenPairResult> {
    if (!command.email || !command.password) {
      throw new EmailAndPasswordRequiredError();
    }

    const subject = await this.credentialPort.authenticate(command.email, command.password);
    if (!subject) {
      throw new InvalidCredentialsError();
    }

    if (this.config.requireActiveStatus && subject.status !== 'active') {
      throw new AccountNotActiveError();
    }

    if (this.config.trackLoginTimestamp) {
      await this.credentialPort.updateLoginTimestamp(subject.id);
    }

    const accessToken = this.jwt.sign(subject.id, subject.email, this.config.userType, this.config.jwtSecret, this.config.accessTokenDuration);
    const refreshToken = this.jwt.sign(
      subject.id,
      subject.email,
      this.config.userType,
      this.config.jwtSecret,
      this.config.refreshTokenDuration,
      'refresh',
    );

    await this.tokenRepo.createRefreshToken({
      token: refreshToken,
      userType: this.config.userType,
      userId: subject.id,
      expiresAt: parseExpirationDate(this.config.refreshTokenDuration),
      userAgent: command.userAgent ?? null,
      ipAddress: command.ipAddress ?? null,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.accessTokenDuration,
      subject,
    };
  }
}
