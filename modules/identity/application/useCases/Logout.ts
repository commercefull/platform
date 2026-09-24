import { UserRepository } from '../../domain/repositories/UserRepository';
import { eventBus } from '../../../../libs/events/eventBus';

export class LogoutCommand {
  constructor(public readonly userId: string) {}
}

// ============================================================================
// Response
// ============================================================================


export class LogoutUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: LogoutCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    if (user) {
      user.clearRefreshToken();
      await this.userRepository.save(user);

      eventBus.emit('identity.logout', {
        userId: user.userId,
      });
    }
  }
}
