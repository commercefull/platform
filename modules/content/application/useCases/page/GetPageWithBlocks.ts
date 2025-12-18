/**
 * Get Page With Blocks Use Case
 * Retrieves a complete page with all its content blocks and related data
 */

import { ContentRepo } from '../../../repos/contentRepo';

export class GetPageWithBlocksQuery {
  constructor(
    public readonly pageId?: string,
    public readonly slug?: string,
    public readonly includeInactiveBlocks: boolean = false
  ) {}
}

export interface BlockWithType {
  id: string;
  name: string;
  order: number;
  content: Record<string, any>;
  status: string;
  contentType: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface PageWithBlocksResponse {
  page: {
    id: string;
    title: string;
    slug: string;
    status: string;
    visibility: string;
    summary?: string;
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
  contentType: {
    id: string;
    name: string;
    slug: string;
  } | null;
  template: {
    id: string;
    name: string;
    slug: string;
    htmlStructure?: string;
  } | null;
  blocks: BlockWithType[];
}

export class GetPageWithBlocksUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(query: GetPageWithBlocksQuery): Promise<PageWithBlocksResponse | null> {
    let page;

    if (query.pageId) {
      page = await this.contentRepo.findPageById(query.pageId);
    } else if (query.slug) {
      page = await this.contentRepo.findPageBySlug(query.slug);
    } else {
      throw new Error('Page ID or slug is required');
    }

    if (!page) {
      return null;
    }

    // Get content type
    let contentType = null;
    if (page.contentTypeId) {
      const ct = await this.contentRepo.findContentTypeById(page.contentTypeId);
      if (ct) {
        contentType = {
          id: ct.id,
          name: ct.name,
          slug: ct.slug
        };
      }
    }

    // Get template
    let template = null;
    if (page.templateId) {
      const t = await this.contentRepo.findTemplateById(page.templateId);
      if (t) {
        template = {
          id: t.id,
          name: t.name,
          slug: t.slug,
          htmlStructure: t.htmlStructure
        };
      }
    }

    // Get blocks
    const allBlocks = await this.contentRepo.findBlocksByPageId(page.id);
    const filteredBlocks = query.includeInactiveBlocks 
      ? allBlocks 
      : allBlocks.filter(b => b.status === 'active');

    // Enrich blocks with content type info
    const blocksWithTypes: BlockWithType[] = [];
    for (const block of filteredBlocks) {
      const blockType = await this.contentRepo.findContentTypeById(block.contentTypeId);
      blocksWithTypes.push({
        id: block.id,
        name: block.name,
        order: block.order,
        content: block.content,
        status: block.status,
        contentType: blockType ? {
          id: blockType.id,
          name: blockType.name,
          slug: blockType.slug
        } : {
          id: block.contentTypeId,
          name: 'Unknown',
          slug: 'unknown'
        }
      });
    }

    // Sort blocks by order
    blocksWithTypes.sort((a, b) => a.order - b.order);

    return {
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        visibility: page.visibility,
        summary: page.summary,
        featuredImage: page.featuredImage,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        publishedAt: page.publishedAt,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt
      },
      contentType,
      template,
      blocks: blocksWithTypes
    };
  }
}
