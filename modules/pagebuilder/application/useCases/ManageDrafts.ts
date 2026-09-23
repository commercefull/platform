import { generateUUID } from '../../../../libs/uuid';
import { PageDraft } from '../../domain/entities/PageDraft';
import { PageDraftRepository } from '../../domain/repositories/PageDraftRepository';
import {
  PageDraftNotFoundError,
  PageDraftValidationError,
} from '../../domain/errors/PageBuilderErrors';
import { eventBus } from '../../../../libs/events/eventBus';


export interface CreateDraftCommand {
  storeId?: string;
  organizationId: string;
  themeId?: string;
  title: string;
  slug: string;
  pageType: string;
  pageId?: string;
}

export class ManageDraftsUseCase {
  constructor(private readonly repo: PageDraftRepository) {}

  async create(cmd: CreateDraftCommand): Promise<PageDraft> {
    if (!cmd.title?.trim()) throw new PageDraftValidationError('Title is required');
    if (!cmd.slug?.trim()) throw new PageDraftValidationError('Slug is required');

    const draft = PageDraft.create({
      draftId: generateUUID(),
      pageId: cmd.pageId,
      storeId: cmd.storeId || '',
      organizationId: cmd.organizationId,
      themeId: cmd.themeId || '',
      title: cmd.title,
      slug: cmd.slug,
      pageType: cmd.pageType || 'page',
    });

    const saved = await this.repo.save(draft);

    eventBus.emit('pagebuilder.draft.created', {
      draftId: saved.draftId,
      storeId: cmd.storeId,
      title: cmd.title,
      slug: cmd.slug,
    });

    return saved;
  }

  async getById(draftId: string): Promise<PageDraft> {
    const draft = await this.repo.findById(draftId);
    if (!draft) throw new PageDraftNotFoundError(draftId);
    return draft;
  }

  async getByPageId(pageId: string): Promise<PageDraft | null> {
    return this.repo.findByPageId(pageId);
  }

  async listByStore(storeId: string): Promise<PageDraft[]> {
    return this.repo.findByStore(storeId);
  }

  async listByOrganization(organizationId: string): Promise<PageDraft[]> {
    return this.repo.findByOrganization(organizationId);
  }

  async listAll(): Promise<PageDraft[]> {
    return this.repo.findAll();
  }

  async updateTitle(draftId: string, title: string): Promise<PageDraft> {
    const draft = await this.getById(draftId);
    draft.updateTitle(title);
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.draft.updated', { draftId, field: 'title' });
    return saved;
  }

  async updateSlug(draftId: string, slug: string): Promise<PageDraft> {
    const draft = await this.getById(draftId);
    draft.updateSlug(slug);
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.draft.updated', { draftId, field: 'slug' });
    return saved;
  }

  async updateTheme(draftId: string, themeId: string): Promise<PageDraft> {
    const draft = await this.getById(draftId);
    draft.updateTheme(themeId);
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.draft.updated', { draftId, field: 'theme' });
    return saved;
  }

  async delete(draftId: string): Promise<boolean> {
    const result = await this.repo.delete(draftId);
    if (result) {
      eventBus.emit('pagebuilder.draft.deleted', { draftId });
    }
    return result;
  }
}

