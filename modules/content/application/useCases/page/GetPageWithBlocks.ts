/**
 * Get Page With Blocks Use Case
 * Retrieves a complete page with all its content blocks and related data
 */

import type { ContentRepo } from '../../../infrastructure/repositories/contentRepo';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';

export class GetPageWithBlocksQuery {
  constructor(
    public readonly pageId?: string,
    public readonly slug?: string,
    public readonly includeInactiveBlocks: boolean = false,
  ) {}
}

export interface BlockWithType {
  contentBlockId: string;
  title: string | null;
  sortOrder: number;
  content: Record<string, unknown>;
  isVisible: boolean;
  contentType: {
    contentTypeId: string;
    name: string;
    slug: string;
  };
}

export interface PageWithBlocksResponse {
  page: {
    contentPageId: string;
    title: string;
    slug: string;
    status: string;
    visibility: string;
    summary?: string | null;
    featuredImage?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    publishedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  contentType: {
    contentTypeId: string;
    name: string;
    slug: string;
  } | null;
  template: {
    contentTemplateId: string;
    name: string;
    slug: string;
    htmlStructure?: string | null;
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
      throw new ContentValidationError('Page ID or slug is required');
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
          contentTypeId: ct.contentTypeId,
          name: ct.name,
          slug: ct.slug,
        };
      }
    }

    // Get template
    let template = null;
    if (page.templateId) {
      const t = await this.contentRepo.findTemplateById(page.templateId);
      if (t) {
        template = {
          contentTemplateId: t.contentTemplateId,
          name: t.name,
          slug: t.slug,
          htmlStructure: t.htmlStructure,
        };
      }
    }

    // Get blocks
    const allBlocks = await this.contentRepo.findBlocksByPageId(page.contentPageId);
    const filteredBlocks = query.includeInactiveBlocks ? allBlocks : allBlocks.filter(b => b.isVisible);

    // Enrich blocks with content type info
    const blocksWithTypes: BlockWithType[] = [];
    for (const block of filteredBlocks) {
      const blockType = await this.contentRepo.findBlockTypeById(block.blockTypeId);
      blocksWithTypes.push({
        contentBlockId: block.contentBlockId,
        title: block.title,
        sortOrder: block.sortOrder,
        content: block.content,
        isVisible: block.isVisible,
        contentType: blockType
          ? {
              contentTypeId: blockType.contentBlockTypeId,
              name: blockType.name,
              slug: blockType.slug,
            }
          : {
              contentTypeId: block.blockTypeId,
              name: 'Unknown',
              slug: 'unknown',
            },
      });
    }

    // Sort blocks by sortOrder
    blocksWithTypes.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      page: {
        contentPageId: page.contentPageId,
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
        updatedAt: page.updatedAt,
      },
      contentType,
      template,
      blocks: blocksWithTypes,
    };
  }
}
