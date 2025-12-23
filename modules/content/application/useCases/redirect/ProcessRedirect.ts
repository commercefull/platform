/**
 * Process Redirect Use Case
 * Checks if a URL should be redirected and returns the target
 */

import { ContentRedirectRepo } from '../../../repos/contentRedirectRepo';

export class ProcessRedirectQuery {
  constructor(
    public readonly url: string
  ) {}
}

export interface RedirectResult {
  shouldRedirect: boolean;
  targetUrl?: string;
  statusCode?: number;
  redirectId?: string;
}

export class ProcessRedirectUseCase {
  constructor(private readonly redirectRepo: ContentRedirectRepo) {}

  async execute(query: ProcessRedirectQuery): Promise<RedirectResult> {
    if (!query.url) {
      return { shouldRedirect: false };
    }

    // Find matching redirect
    const redirect = await this.redirectRepo.findMatchingRedirect(query.url);

    if (!redirect) {
      return { shouldRedirect: false };
    }

    // Record the hit
    await this.redirectRepo.recordHit(redirect.contentRedirectId);

    // Handle regex replacement if needed
    let targetUrl = redirect.targetUrl;
    if (redirect.isRegex) {
      try {
        const regex = new RegExp(redirect.sourceUrl);
        targetUrl = query.url.replace(regex, redirect.targetUrl);
      } catch {
        // If regex fails, use target as-is
      }
    }

    return {
      shouldRedirect: true,
      targetUrl,
      statusCode: parseInt(redirect.statusCode, 10),
      redirectId: redirect.contentRedirectId
    };
  }
}
