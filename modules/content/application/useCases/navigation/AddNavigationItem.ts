/**
 * Add Navigation Item Use Case
 * Adds a new item to a navigation menu
 */

import { ContentNavigationRepo } from '../../../repos/contentNavigationRepo';
import { ContentRepo } from '../../../repos/contentRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class AddNavigationItemCommand {
  constructor(
    public readonly navigationId: string,
    public readonly title: string,
    public readonly type: 'url' | 'page' | 'category' | 'product' | 'blog',
    public readonly parentId?: string,
    public readonly url?: string,
    public readonly contentPageId?: string,
    public readonly targetId?: string,
    public readonly targetSlug?: string,
    public readonly icon?: string,
    public readonly cssClasses?: string,
    public readonly openInNewTab?: boolean,
    public readonly isActive?: boolean,
    public readonly sortOrder?: number,
    public readonly conditions?: Record<string, any>
  ) {}
}

export interface NavigationItemResponse {
  id: string;
  navigationId: string;
  parentId?: string;
  title: string;
  type: string;
  url?: string;
  contentPageId?: string;
  isActive: boolean;
  sortOrder: number;
  depth: number;
}

export class AddNavigationItemUseCase {
  constructor(
    private readonly navigationRepo: ContentNavigationRepo,
    private readonly contentRepo: ContentRepo
  ) {}

  async execute(command: AddNavigationItemCommand): Promise<NavigationItemResponse> {
    if (!command.navigationId || !command.title || !command.type) {
      throw new Error('Navigation ID, title, and type are required');
    }

    // Verify navigation exists
    const navigation = await this.navigationRepo.findNavigationById(command.navigationId);
    if (!navigation) {
      throw new Error(`Navigation with ID ${command.navigationId} not found`);
    }

    // Verify parent item exists if provided
    let depth = 0;
    if (command.parentId) {
      const parentItem = await this.navigationRepo.findNavigationItemById(command.parentId);
      if (!parentItem) {
        throw new Error(`Parent navigation item with ID ${command.parentId} not found`);
      }
      depth = parentItem.depth + 1;
    }

    // Validate based on type
    if (command.type === 'url' && !command.url) {
      throw new Error('URL is required for URL type navigation items');
    }

    if (command.type === 'page' && command.contentPageId) {
      const page = await this.contentRepo.findPageById(command.contentPageId);
      if (!page) {
        throw new Error(`Content page with ID ${command.contentPageId} not found`);
      }
    }

    const item = await this.navigationRepo.createNavigationItem({
      navigationId: command.navigationId,
      parentId: command.parentId ?? null,
      title: command.title,
      type: command.type,
      url: command.url ?? null,
      contentPageId: command.contentPageId ?? null,
      targetId: command.targetId ?? null,
      targetSlug: command.targetSlug ?? null,
      icon: command.icon ?? null,
      cssClasses: command.cssClasses ?? null,
      openInNewTab: command.openInNewTab || false,
      isActive: command.isActive !== undefined ? command.isActive : true,
      sortOrder: command.sortOrder || 0,
      conditions: command.conditions ?? null,
      depth
    });

    eventBus.emit('content.navigation.item_added', {
      navigationId: command.navigationId,
      itemId: item.contentNavigationItemId,
      title: item.title,
      type: item.type
    });

    return {
      id: item.contentNavigationItemId,
      navigationId: item.navigationId,
      parentId: item.parentId ?? undefined,
      title: item.title,
      type: item.type,
      url: item.url ?? undefined,
      contentPageId: item.contentPageId ?? undefined,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
      depth: item.depth
    };
  }
}
