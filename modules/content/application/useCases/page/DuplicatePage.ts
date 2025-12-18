/**
 * Duplicate Page Use Case
 * Creates a complete copy of a page including all its blocks
 */

import { ContentRepo } from '../../../repos/contentRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class DuplicatePageCommand {
  constructor(
    public readonly pageId: string,
    public readonly newTitle: string,
    public readonly newSlug: string,
    public readonly duplicatedBy?: string
  ) {}
}

export interface DuplicatePageResponse {
  id: string;
  title: string;
  slug: string;
  originalPageId: string;
  blocksCopied: number;
  createdAt: string;
}

export class DuplicatePageUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: DuplicatePageCommand): Promise<DuplicatePageResponse> {
    if (!command.pageId || !command.newTitle || !command.newSlug) {
      throw new Error('Page ID, new title, and new slug are required');
    }

    // Get original page
    const original = await this.contentRepo.findPageById(command.pageId);
    if (!original) {
      throw new Error(`Page with ID ${command.pageId} not found`);
    }

    // Create duplicate page
    const duplicatePage = await this.contentRepo.createPage({
      title: command.newTitle,
      slug: command.newSlug,
      contentTypeId: original.contentTypeId,
      templateId: original.templateId,
      status: 'draft', // Always start as draft
      visibility: original.visibility,
      summary: original.summary,
      featuredImage: original.featuredImage,
      metaTitle: original.metaTitle,
      metaDescription: original.metaDescription,
      metaKeywords: original.metaKeywords,
      customFields: original.customFields,
      isHomePage: false // Never duplicate as home page
    });

    // Get and duplicate all blocks
    const originalBlocks = await this.contentRepo.findBlocksByPageId(command.pageId);
    let blocksCopied = 0;

    for (const block of originalBlocks) {
      await this.contentRepo.createBlock({
        pageId: duplicatePage.id,
        contentTypeId: block.contentTypeId,
        name: block.name,
        order: block.order,
        content: block.content,
        status: block.status
      });
      blocksCopied++;
    }

    eventBus.emit('content.page.created', {
      pageId: duplicatePage.id,
      title: duplicatePage.title,
      slug: duplicatePage.slug,
      contentTypeId: duplicatePage.contentTypeId,
      status: duplicatePage.status,
      createdBy: command.duplicatedBy
    });

    return {
      id: duplicatePage.id,
      title: duplicatePage.title,
      slug: duplicatePage.slug,
      originalPageId: command.pageId,
      blocksCopied,
      createdAt: duplicatePage.createdAt
    };
  }
}
