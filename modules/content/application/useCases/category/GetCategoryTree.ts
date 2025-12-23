/**
 * Get Category Tree Use Case
 * Retrieves the full category hierarchy as a tree structure
 */

import { ContentCategoryRepo } from '../../../repos/contentCategoryRepo';
import { ContentCategory } from '../../../../../libs/db/types';

export class GetCategoryTreeQuery {
  constructor(
    public readonly includeInactive: boolean = false
  ) {}
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  featuredImage?: string;
  path?: string;
  depth: number;
  sortOrder: number;
  isActive: boolean;
  children: CategoryTreeNode[];
}

export class GetCategoryTreeUseCase {
  constructor(private readonly categoryRepo: ContentCategoryRepo) {}

  async execute(query: GetCategoryTreeQuery): Promise<CategoryTreeNode[]> {
    const isActive = query.includeInactive ? undefined : true;
    const categories = await this.categoryRepo.getCategoryTree(isActive);
    
    return this.buildTree(categories);
  }

  private buildTree(categories: ContentCategory[]): CategoryTreeNode[] {
    const categoryMap = new Map<string, CategoryTreeNode>();
    const rootNodes: CategoryTreeNode[] = [];

    // First pass: create all nodes
    for (const category of categories) {
      categoryMap.set(category.contentCategoryId, {
        id: category.contentCategoryId,
        name: category.name,
        slug: category.slug,
        description: category.description ?? undefined,
        featuredImage: category.featuredImage ?? undefined,
        path: category.path ?? undefined,
        depth: category.depth,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        children: []
      });
    }

    // Second pass: build hierarchy
    for (const category of categories) {
      const node = categoryMap.get(category.contentCategoryId)!;
      
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!;
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    // Sort children by sortOrder
    const sortChildren = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const node of nodes) {
        sortChildren(node.children);
      }
    };

    sortChildren(rootNodes);

    return rootNodes;
  }
}
