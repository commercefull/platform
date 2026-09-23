import { PageDraft, PlacedBlockProps } from '../../domain/entities/PageDraft';
import { PageDraftRepository } from '../../domain/repositories/PageDraftRepository';
import { blockSchemaRegistry } from '../../domain/services/BlockSchemaRegistry';
import { themeRegistry } from '../../../theme/domain/services/ThemeRegistry';
import { ThemeRepository } from '../../../theme/domain/repositories/ThemeRepository';
import { PageDraftNotFoundError } from '../../domain/errors/PageBuilderErrors';


export interface PreviewDraftCommand {
  draftId: string;
}


export interface PreviewData {
  draft: PageDraft;
  theme: {
    themeId: string;
    slug: string;
    name: string;
    cssVariables: Record<string, string>;
    customCss?: string;
    headTags: string[];
    bodyAttributes: Record<string, string>;
  };
  blocks: PlacedBlockProps[];
  blockTypes: Map<string, { name: string; icon: string; category: string }>;
}

export class PreviewDraftUseCase {
  constructor(
    private readonly repo: PageDraftRepository,
    private readonly themeRepo: ThemeRepository,
  ) {}

  async preview(draftId: string): Promise<PreviewData> {
    const draft = await this.repo.findById(draftId);
    if (!draft) throw new PageDraftNotFoundError(draftId);

    const resolved = draft.storeId ? await themeRegistry.resolveThemeForStore(draft.storeId, this.themeRepo) : null;

    const blockTypes = new Map<string, { name: string; icon: string; category: string }>();
    for (const block of draft.blocks) {
      if (!blockTypes.has(block.typeId)) {
        const def = blockSchemaRegistry.get(block.typeId);
        if (def) {
          blockTypes.set(block.typeId, { name: def.name, icon: def.icon, category: def.category });
        }
      }
    }

    return {
      draft,
      theme: {
        themeId: resolved?.theme.themeId || draft.themeId || '',
        slug: resolved?.theme.slug || '',
        name: resolved?.theme.name || 'Unknown',
        cssVariables: resolved?.cssVariables || {},
        customCss: resolved?.customCss,
        headTags: resolved ? themeRegistry.generateHeadTags(resolved) : [],
        bodyAttributes: resolved ? themeRegistry.generateBodyAttributes(resolved) : {},
      },
      blocks: draft.blocks,
      blockTypes,
    };
  }
}

