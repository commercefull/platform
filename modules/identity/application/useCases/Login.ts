import { generateUUID } from '../../../../libs/uuid';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountNotActiveError,
} from '../../domain/errors/IdentityErrors';

export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly ip?: string,
  ) {}
}

export interface AuthResponse {
  userId: string;
  email: string;
  userType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================================
// Use Cases
// ============================================================================


export class LoginUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: LoginCommand): Promise<AuthResponse> {
    const user = await this.userRepository.validateCredentials(command.email, command.password);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.canLogin) {
      if (user.isLocked) {
        throw new AccountLockedError();
      }
      throw new AccountNotActiveError();
    }

    user.recordLogin(command.ip);

    const accessToken = generateUUID(); // Would use JWT in real implementation
    const refreshToken = generateUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    user.setRefreshToken(refreshToken, expiresAt);
    await this.userRepository.save(user);

    eventBus.emit('identity.login', {
      userId: user.userId,
      email: user.email,
      userType: user.userType,
      ip: command.ip,
    });

    return {
      userId: user.userId,
      email: user.email,
      userType: user.userType,
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
    };
  }
}

