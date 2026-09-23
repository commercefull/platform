import { ThemeRepository } from '../../domain/repositories/ThemeRepository';
import { ThemeNotFoundError, ThemeValidationError, ThemeAssignmentNotFoundError } from '../../domain/errors/ThemeErrors';
import { eventBus } from '../../../../libs/events/eventBus';


// ============================================================================
// Assign Theme to Store
// ============================================================================

export class AssignThemeToStoreCommand {
  constructor(
    public readonly storeId: string,
    public readonly themeId: string,
    public readonly organizationId: string,
  ) {}
}
export class AssignThemeToStoreUseCase {
  constructor(private readonly themeRepository: ThemeRepository) {}

  async execute(command: AssignThemeToStoreCommand): Promise<void> {
    const theme = await this.themeRepository.findById(command.themeId);
    if (!theme) throw new ThemeNotFoundError(command.themeId);
    if (!theme.isActive()) throw new ThemeValidationError(`Theme '${theme.slug}' is not active`);

    await this.themeRepository.assignThemeToStore(command.storeId, command.themeId, command.organizationId);

    eventBus.emit('theme.assigned', { storeId: command.storeId, themeId: command.themeId });
  }

  async unassign(storeId: string): Promise<void> {
    const assignment = await this.themeRepository.findThemeAssignment(storeId);
    if (!assignment) throw new ThemeAssignmentNotFoundError(storeId);

    await this.themeRepository.unassignThemeFromStore(storeId);

    eventBus.emit('theme.unassigned', { storeId });
  }

  async getAssignment(storeId: string): Promise<{ themeId: string; overrideId?: string } | null> {
    return this.themeRepository.findThemeAssignment(storeId);
  }
}
