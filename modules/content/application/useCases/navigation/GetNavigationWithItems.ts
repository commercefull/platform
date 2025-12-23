/**
 * Get Navigation With Items Use Case
 * Retrieves a navigation menu with all its items in tree structure
 */

import { ContentNavigationRepo } from '../../../repos/contentNavigationRepo';
import { ContentNavigationItem } from '../../../../../libs/db/types';

export class GetNavigationWithItemsQuery {
  constructor(
    public readonly navigationId?: string,
    public readonly slug?: string,
    public readonly location?: string,
    public readonly includeInactive: boolean = false,
  ) {}
}

export interface NavigationItemNode {
  id: string;
  title: string;
  type: string;
  url?: string;
  contentPageId?: string;
  targetSlug?: string;
  icon?: string;
  cssClasses?: string;
  openInNewTab: boolean;
  isActive: boolean;
  sortOrder: number;
  children: NavigationItemNode[];
}

export interface NavigationWithItemsResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location?: string;
  isActive: boolean;
  items: NavigationItemNode[];
}

export class GetNavigationWithItemsUseCase {
  constructor(private readonly navigationRepo: ContentNavigationRepo) {}

  async execute(query: GetNavigationWithItemsQuery): Promise<NavigationWithItemsResponse | null> {
    let navigation;

    if (query.navigationId) {
      navigation = await this.navigationRepo.findNavigationById(query.navigationId);
    } else if (query.slug) {
      navigation = await this.navigationRepo.findNavigationBySlug(query.slug);
    } else if (query.location) {
      navigation = await this.navigationRepo.findNavigationByLocation(query.location);
    } else {
      throw new Error('Navigation ID, slug, or location is required');
    }

    if (!navigation) {
      return null;
    }

    // Get all items for this navigation
    const items = await this.navigationRepo.findAllNavigationItems(navigation.contentNavigationId);

    // Filter inactive items if needed
    const filteredItems = query.includeInactive ? items : items.filter(item => item.isActive);

    // Build tree structure
    const itemTree = this.buildItemTree(filteredItems);

    return {
      id: navigation.contentNavigationId,
      name: navigation.name,
      slug: navigation.slug,
      description: navigation.description ?? undefined,
      location: navigation.location ?? undefined,
      isActive: navigation.isActive,
      items: itemTree,
    };
  }

  private buildItemTree(items: ContentNavigationItem[]): NavigationItemNode[] {
    const itemMap = new Map<string, NavigationItemNode>();
    const rootNodes: NavigationItemNode[] = [];

    // First pass: create all nodes
    for (const item of items) {
      itemMap.set(item.contentNavigationItemId, {
        id: item.contentNavigationItemId,
        title: item.title,
        type: item.type,
        url: item.url ?? undefined,
        contentPageId: item.contentPageId ?? undefined,
        targetSlug: item.targetSlug ?? undefined,
        icon: item.icon ?? undefined,
        cssClasses: item.cssClasses ?? undefined,
        openInNewTab: item.openInNewTab,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
        children: [],
      });
    }

    // Second pass: build hierarchy
    for (const item of items) {
      const node = itemMap.get(item.contentNavigationItemId)!;

      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!;
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    // Sort by sortOrder
    const sortNodes = (nodes: NavigationItemNode[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const node of nodes) {
        sortNodes(node.children);
      }
    };

    sortNodes(rootNodes);

    return rootNodes;
  }
}
