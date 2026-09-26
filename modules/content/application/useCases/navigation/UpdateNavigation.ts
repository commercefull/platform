/**
 * Update Navigation Use Case
 * Updates a navigation menu and emits an update event
 */

import type { IContentNavigationRepository } from '../../../domain/repositories/ContentNavigationRepository';
import type { ContentNavigation } from '../../../domain/entities/ContentModel';
import { eventBus } from '../../../../../libs/events/eventBus';
import { NavigationMenuNotFoundError } from '../../../domain/errors/ContentErrors';

// ============================================================================
// Command
// ============================================================================

export class UpdateNavigationCommand {
  constructor(
    public readonly navigationId: string,
    public readonly updates: {
      name?: string;
      slug?: string;
      description?: string;
      location?: string;
      isActive?: boolean;
    },
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdateNavigationUseCase {
  constructor(private readonly navigationRepo: IContentNavigationRepository) {}

  async execute(command: UpdateNavigationCommand): Promise<ContentNavigation> {
    const existing = await this.navigationRepo.findNavigationById(command.navigationId);
    if (!existing) {
      throw new NavigationMenuNotFoundError(command.navigationId);
    }

    const updated = await this.navigationRepo.updateNavigation(command.navigationId, command.updates);

    eventBus.emit('content.navigation.updated', {
      navigationId: command.navigationId,
      name: updated.name,
    });

    return updated;
  }
}
