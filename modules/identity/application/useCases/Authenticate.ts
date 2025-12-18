/**
 * Authentication Use Cases
 */

import { generateUUID } from '../../../../libs/uuid';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/entities/User';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Commands
// ============================================================================

export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly ip?: string
  ) {}
}

export class RefreshTokenCommand {
  constructor(public readonly refreshToken: string) {}
}

export class LogoutCommand {
  constructor(public readonly userId: string) {}
}

// ============================================================================
// Response
// ============================================================================

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
      throw new Error('Invalid credentials');
    }

    if (!user.canLogin) {
      if (user.isLocked) {
        throw new Error('Account is temporarily locked. Please try again later.');
      }
      throw new Error('Account is not active');
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
      ip: command.ip
    });

    return {
      userId: user.userId,
      email: user.email,
      userType: user.userType,
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour
    };
  }
}

export class RefreshTokenUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: RefreshTokenCommand): Promise<AuthResponse> {
    const user = await this.userRepository.findByRefreshToken(command.refreshToken);
    
    if (!user || !user.canLogin) {
      throw new Error('Invalid refresh token');
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
      expiresIn: 3600
    };
  }
}

export class LogoutUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: LogoutCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    if (user) {
      user.clearRefreshToken();
      await this.userRepository.save(user);

      eventBus.emit('identity.logout', {
        userId: user.userId
      });
    }
  }
}
