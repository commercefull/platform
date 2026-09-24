import { generateUUID } from '../../../../libs/uuid';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { InvalidRefreshTokenError } from '../../domain/errors/IdentityErrors';
import type { AuthResponse } from './Login';

export class RefreshTokenCommand {
  constructor(public readonly refreshToken: string) {}
}


export class RefreshTokenUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: RefreshTokenCommand): Promise<AuthResponse> {
    const user = await this.userRepository.findByRefreshToken(command.refreshToken);

    if (!user || !user.canLogin) {
      throw new InvalidRefreshTokenError();
    }

    const accessToken = generateUUID();
    const refreshToken = generateUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    user.setRefreshToken(refreshToken, expiresAt);
    await this.userRepository.save(user);

    return {
      userId: user.userId,
      email: user.email,
      userType: user.userType,
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }
}

