/**
 * Duplicate Template Use Case
 * Creates a copy of an existing template
 */

import { ContentRepo } from '../../../repos/contentRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class DuplicateTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly newName: string,
    public readonly newSlug: string,
    public readonly createdBy?: string,
  ) {}
}

export interface DuplicateTemplateResponse {
  id: string;
  name: string;
  slug: string;
  originalTemplateId: string;
  createdAt: string;
}

export class DuplicateTemplateUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: DuplicateTemplateCommand): Promise<DuplicateTemplateResponse> {
    if (!command.templateId || !command.newName || !command.newSlug) {
      throw new Error('Template ID, new name, and new slug are required');
    }

    // Get original template
    const original = await this.contentRepo.findTemplateById(command.templateId);
    if (!original) {
      throw new Error(`Template with ID ${command.templateId} not found`);
    }

    // Create duplicate
    const duplicate = await this.contentRepo.createTemplate({
      name: command.newName,
      slug: command.newSlug,
      description: original.description ? `Copy of: ${original.description}` : `Copy of ${original.name}`,
      thumbnail: original.thumbnail,
      htmlStructure: original.htmlStructure,
      cssStyles: original.cssStyles,
      jsScripts: original.jsScripts,
      areas: original.areas,
      defaultBlocks: original.defaultBlocks,
      compatibleContentTypes: original.compatibleContentTypes,
      isSystem: false, // Duplicates are never system templates
      isActive: true,
      createdBy: command.createdBy,
    });

    eventBus.emit('content.template.created', {
      templateId: duplicate.id,
      name: duplicate.name,
      slug: duplicate.slug,
    });

    return {
      id: duplicate.id,
      name: duplicate.name,
      slug: duplicate.slug,
      originalTemplateId: command.templateId,
      createdAt: duplicate.createdAt,
    };
  }
}
