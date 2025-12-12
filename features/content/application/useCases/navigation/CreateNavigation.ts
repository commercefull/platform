/**
 * Create Navigation Use Case
 * Creates a new navigation menu
 */

import { ContentNavigationRepo } from '../../../repos/contentNavigationRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class CreateNavigationCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly description?: string,
    public readonly location?: string,
    public readonly isActive?: boolean,
    public readonly createdBy?: string
  ) {}
}

export interface NavigationResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
}

export class CreateNavigationUseCase {
  constructor(private readonly navigationRepo: ContentNavigationRepo) {}

  async execute(command: CreateNavigationCommand): Promise<NavigationResponse> {
    if (!command.name || !command.slug) {
      throw new Error('Name and slug are required');
    }

    const navigation = await this.navigationRepo.createNavigation({
      name: command.name,
      slug: command.slug,
      description: command.description,
      location: command.location,
      isActive: command.isActive !== undefined ? command.isActive : true,
      createdBy: command.createdBy
    });

    eventBus.emit('content.navigation.created', {
      navigationId: navigation.id,
      name: navigation.name,
      slug: navigation.slug,
      location: navigation.location
    });

    return {
      id: navigation.id,
      name: navigation.name,
      slug: navigation.slug,
      description: navigation.description,
      location: navigation.location,
      isActive: navigation.isActive,
      createdAt: navigation.createdAt
    };
  }
}
