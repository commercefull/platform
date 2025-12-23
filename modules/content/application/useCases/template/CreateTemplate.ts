/**
 * Create Template Use Case
 * Creates a new content template for page layouts
 */

import { ContentRepo } from '../../../repos/contentRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class CreateTemplateCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly description?: string,
    public readonly thumbnail?: string,
    public readonly htmlStructure?: string,
    public readonly cssStyles?: string,
    public readonly jsScripts?: string,
    public readonly areas?: Record<string, any>,
    public readonly defaultBlocks?: Record<string, any>,
    public readonly compatibleContentTypes?: string[],
    public readonly isSystem?: boolean,
    public readonly isActive?: boolean,
    public readonly createdBy?: string,
  ) {}
}

export interface TemplateResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export class CreateTemplateUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: CreateTemplateCommand): Promise<TemplateResponse> {
    if (!command.name || !command.slug) {
      throw new Error('Name and slug are required');
    }

    // Validate compatible content types if provided
    if (command.compatibleContentTypes && command.compatibleContentTypes.length > 0) {
      for (const typeId of command.compatibleContentTypes) {
        const contentType = await this.contentRepo.findContentTypeById(typeId);
        if (!contentType) {
          throw new Error(`Content type with ID ${typeId} not found`);
        }
      }
    }

    const template = await this.contentRepo.createTemplate({
      name: command.name,
      slug: command.slug,
      description: command.description,
      thumbnail: command.thumbnail,
      htmlStructure: command.htmlStructure,
      cssStyles: command.cssStyles,
      jsScripts: command.jsScripts,
      areas: command.areas,
      defaultBlocks: command.defaultBlocks,
      compatibleContentTypes: command.compatibleContentTypes,
      isSystem: command.isSystem || false,
      isActive: command.isActive !== undefined ? command.isActive : true,
      createdBy: command.createdBy,
    });

    eventBus.emit('content.template.created', {
      templateId: template.id,
      name: template.name,
      slug: template.slug,
    });

    return {
      id: template.id,
      name: template.name,
      slug: template.slug,
      description: template.description,
      thumbnail: template.thumbnail,
      isSystem: template.isSystem,
      isActive: template.isActive,
      createdAt: template.createdAt,
    };
  }
}
