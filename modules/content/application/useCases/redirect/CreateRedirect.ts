/**
 * Create Redirect Use Case
 * Creates a new URL redirect rule
 */

import { ContentRedirectRepo } from '../../../repos/contentRedirectRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class CreateRedirectCommand {
  constructor(
    public readonly sourceUrl: string,
    public readonly targetUrl: string,
    public readonly statusCode?: 301 | 302 | 303 | 307 | 308,
    public readonly isRegex?: boolean,
    public readonly isActive?: boolean,
    public readonly notes?: string,
    public readonly createdBy?: string
  ) {}
}

export interface RedirectResponse {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  statusCode: number;
  isRegex: boolean;
  isActive: boolean;
  hits: number;
  createdAt: string;
}

export class CreateRedirectUseCase {
  constructor(private readonly redirectRepo: ContentRedirectRepo) {}

  async execute(command: CreateRedirectCommand): Promise<RedirectResponse> {
    if (!command.sourceUrl || !command.targetUrl) {
      throw new Error('Source URL and target URL are required');
    }

    // Validate URLs
    if (command.sourceUrl === command.targetUrl) {
      throw new Error('Source and target URLs cannot be the same');
    }

    // Validate regex if specified
    if (command.isRegex) {
      try {
        new RegExp(command.sourceUrl);
      } catch {
        throw new Error('Invalid regex pattern in source URL');
      }
    }

    const redirect = await this.redirectRepo.createRedirect({
      sourceUrl: command.sourceUrl,
      targetUrl: command.targetUrl,
      statusCode: String(command.statusCode || 301),
      isRegex: command.isRegex || false,
      isActive: command.isActive !== undefined ? command.isActive : true,
      notes: command.notes ?? null,
      createdBy: command.createdBy ?? null,
      updatedBy: null
    });

    eventBus.emit('content.redirect.created', {
      redirectId: redirect.contentRedirectId,
      sourceUrl: redirect.sourceUrl,
      targetUrl: redirect.targetUrl,
      statusCode: redirect.statusCode
    });

    return {
      id: redirect.contentRedirectId,
      sourceUrl: redirect.sourceUrl,
      targetUrl: redirect.targetUrl,
      statusCode: parseInt(redirect.statusCode, 10),
      isRegex: redirect.isRegex,
      isActive: redirect.isActive,
      hits: redirect.hits,
      createdAt: redirect.createdAt instanceof Date ? redirect.createdAt.toISOString() : String(redirect.createdAt)
    };
  }
}
