/**
 * Content Domain Events
 * Events that occur within the content domain
 */

export interface DomainEvent {
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  payload: Record<string, any>;
}

// ============================================================================
// Content Page Events
// ============================================================================

export class PageCreatedEvent implements DomainEvent {
  readonly eventType = 'content.page.created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    pageId: string;
    title: string;
    slug: string;
    contentTypeId: string;
    status: string;
    createdBy?: string;
  };

  constructor(
    pageId: string,
    title: string,
    slug: string,
    contentTypeId: string,
    status: string,
    createdBy?: string
  ) {
    this.occurredAt = new Date();
    this.aggregateId = pageId;
    this.payload = { pageId, title, slug, contentTypeId, status, createdBy };
  }
}

export class PageUpdatedEvent implements DomainEvent {
  readonly eventType = 'content.page.updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    pageId: string;
    title: string;
    slug: string;
    updatedBy?: string;
    changes: string[];
  };

  constructor(
    pageId: string,
    title: string,
    slug: string,
    changes: string[],
    updatedBy?: string
  ) {
    this.occurredAt = new Date();
    this.aggregateId = pageId;
    this.payload = { pageId, title, slug, updatedBy, changes };
  }
}

export class PagePublishedEvent implements DomainEvent {
  readonly eventType = 'content.page.published';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    pageId: string;
    title: string;
    slug: string;
    publishedAt: string;
    publishedBy?: string;
  };

  constructor(
    pageId: string,
    title: string,
    slug: string,
    publishedBy?: string
  ) {
    this.occurredAt = new Date();
    this.aggregateId = pageId;
    this.payload = {
      pageId,
      title,
      slug,
      publishedAt: new Date().toISOString(),
      publishedBy
    };
  }
}

export class PageUnpublishedEvent implements DomainEvent {
  readonly eventType = 'content.page.unpublished';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    pageId: string;
    title: string;
    slug: string;
    unpublishedBy?: string;
  };

  constructor(
    pageId: string,
    title: string,
    slug: string,
    unpublishedBy?: string
  ) {
    this.occurredAt = new Date();
    this.aggregateId = pageId;
    this.payload = { pageId, title, slug, unpublishedBy };
  }
}

export class PageArchivedEvent implements DomainEvent {
  readonly eventType = 'content.page.archived';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    pageId: string;
    title: string;
    archivedBy?: string;
  };

  constructor(pageId: string, title: string, archivedBy?: string) {
    this.occurredAt = new Date();
    this.aggregateId = pageId;
    this.payload = { pageId, title, archivedBy };
  }
}

export class PageDeletedEvent implements DomainEvent {
  readonly eventType = 'content.page.deleted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    pageId: string;
    title: string;
    deletedBy?: string;
  };

  constructor(pageId: string, title: string, deletedBy?: string) {
    this.occurredAt = new Date();
    this.aggregateId = pageId;
    this.payload = { pageId, title, deletedBy };
  }
}

export class PageVersionCreatedEvent implements DomainEvent {
  readonly eventType = 'content.page.version_created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    pageId: string;
    versionId: string;
    version: number;
    createdBy?: string;
  };

  constructor(
    pageId: string,
    versionId: string,
    version: number,
    createdBy?: string
  ) {
    this.occurredAt = new Date();
    this.aggregateId = pageId;
    this.payload = { pageId, versionId, version, createdBy };
  }
}

// ============================================================================
// Content Block Events
// ============================================================================

export class BlockCreatedEvent implements DomainEvent {
  readonly eventType = 'content.block.created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    blockId: string;
    pageId: string;
    name: string;
    contentTypeId: string;
    order: number;
  };

  constructor(
    blockId: string,
    pageId: string,
    name: string,
    contentTypeId: string,
    order: number
  ) {
    this.occurredAt = new Date();
    this.aggregateId = blockId;
    this.payload = { blockId, pageId, name, contentTypeId, order };
  }
}

export class BlockUpdatedEvent implements DomainEvent {
  readonly eventType = 'content.block.updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    blockId: string;
    pageId: string;
    name: string;
  };

  constructor(blockId: string, pageId: string, name: string) {
    this.occurredAt = new Date();
    this.aggregateId = blockId;
    this.payload = { blockId, pageId, name };
  }
}

export class BlockDeletedEvent implements DomainEvent {
  readonly eventType = 'content.block.deleted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    blockId: string;
    pageId: string;
  };

  constructor(blockId: string, pageId: string) {
    this.occurredAt = new Date();
    this.aggregateId = blockId;
    this.payload = { blockId, pageId };
  }
}

export class BlocksReorderedEvent implements DomainEvent {
  readonly eventType = 'content.blocks.reordered';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    pageId: string;
    blockOrders: Array<{ id: string; order: number }>;
  };

  constructor(pageId: string, blockOrders: Array<{ id: string; order: number }>) {
    this.occurredAt = new Date();
    this.aggregateId = pageId;
    this.payload = { pageId, blockOrders };
  }
}

// ============================================================================
// Content Type Events
// ============================================================================

export class ContentTypeCreatedEvent implements DomainEvent {
  readonly eventType = 'content.type.created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    contentTypeId: string;
    name: string;
    slug: string;
  };

  constructor(contentTypeId: string, name: string, slug: string) {
    this.occurredAt = new Date();
    this.aggregateId = contentTypeId;
    this.payload = { contentTypeId, name, slug };
  }
}

export class ContentTypeUpdatedEvent implements DomainEvent {
  readonly eventType = 'content.type.updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    contentTypeId: string;
    name: string;
    slug: string;
  };

  constructor(contentTypeId: string, name: string, slug: string) {
    this.occurredAt = new Date();
    this.aggregateId = contentTypeId;
    this.payload = { contentTypeId, name, slug };
  }
}

export class ContentTypeDeletedEvent implements DomainEvent {
  readonly eventType = 'content.type.deleted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    contentTypeId: string;
    name: string;
  };

  constructor(contentTypeId: string, name: string) {
    this.occurredAt = new Date();
    this.aggregateId = contentTypeId;
    this.payload = { contentTypeId, name };
  }
}

// ============================================================================
// Content Template Events
// ============================================================================

export class TemplateCreatedEvent implements DomainEvent {
  readonly eventType = 'content.template.created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    templateId: string;
    name: string;
    slug: string;
  };

  constructor(templateId: string, name: string, slug: string) {
    this.occurredAt = new Date();
    this.aggregateId = templateId;
    this.payload = { templateId, name, slug };
  }
}

export class TemplateUpdatedEvent implements DomainEvent {
  readonly eventType = 'content.template.updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    templateId: string;
    name: string;
  };

  constructor(templateId: string, name: string) {
    this.occurredAt = new Date();
    this.aggregateId = templateId;
    this.payload = { templateId, name };
  }
}

export class TemplateDeletedEvent implements DomainEvent {
  readonly eventType = 'content.template.deleted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    templateId: string;
    name: string;
  };

  constructor(templateId: string, name: string) {
    this.occurredAt = new Date();
    this.aggregateId = templateId;
    this.payload = { templateId, name };
  }
}

// ============================================================================
// Content Media Events
// ============================================================================

export class MediaUploadedEvent implements DomainEvent {
  readonly eventType = 'content.media.uploaded';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    mediaId: string;
    title: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy?: string;
  };

  constructor(
    mediaId: string,
    title: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    uploadedBy?: string
  ) {
    this.occurredAt = new Date();
    this.aggregateId = mediaId;
    this.payload = { mediaId, title, fileName, fileType, fileSize, uploadedBy };
  }
}

export class MediaDeletedEvent implements DomainEvent {
  readonly eventType = 'content.media.deleted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    mediaId: string;
    fileName: string;
    deletedBy?: string;
  };

  constructor(mediaId: string, fileName: string, deletedBy?: string) {
    this.occurredAt = new Date();
    this.aggregateId = mediaId;
    this.payload = { mediaId, fileName, deletedBy };
  }
}

// ============================================================================
// Content Navigation Events
// ============================================================================

export class NavigationCreatedEvent implements DomainEvent {
  readonly eventType = 'content.navigation.created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    navigationId: string;
    name: string;
    slug: string;
    location?: string;
  };

  constructor(navigationId: string, name: string, slug: string, location?: string) {
    this.occurredAt = new Date();
    this.aggregateId = navigationId;
    this.payload = { navigationId, name, slug, location };
  }
}

export class NavigationUpdatedEvent implements DomainEvent {
  readonly eventType = 'content.navigation.updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    navigationId: string;
    name: string;
  };

  constructor(navigationId: string, name: string) {
    this.occurredAt = new Date();
    this.aggregateId = navigationId;
    this.payload = { navigationId, name };
  }
}

export class NavigationItemAddedEvent implements DomainEvent {
  readonly eventType = 'content.navigation.item_added';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    navigationId: string;
    itemId: string;
    title: string;
    type: string;
  };

  constructor(navigationId: string, itemId: string, title: string, type: string) {
    this.occurredAt = new Date();
    this.aggregateId = navigationId;
    this.payload = { navigationId, itemId, title, type };
  }
}

// ============================================================================
// Content Category Events
// ============================================================================

export class CategoryCreatedEvent implements DomainEvent {
  readonly eventType = 'content.category.created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    categoryId: string;
    name: string;
    slug: string;
    parentId?: string;
  };

  constructor(categoryId: string, name: string, slug: string, parentId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = categoryId;
    this.payload = { categoryId, name, slug, parentId };
  }
}

export class CategoryUpdatedEvent implements DomainEvent {
  readonly eventType = 'content.category.updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    categoryId: string;
    name: string;
    slug: string;
  };

  constructor(categoryId: string, name: string, slug: string) {
    this.occurredAt = new Date();
    this.aggregateId = categoryId;
    this.payload = { categoryId, name, slug };
  }
}

export class CategoryDeletedEvent implements DomainEvent {
  readonly eventType = 'content.category.deleted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    categoryId: string;
    name: string;
  };

  constructor(categoryId: string, name: string) {
    this.occurredAt = new Date();
    this.aggregateId = categoryId;
    this.payload = { categoryId, name };
  }
}

// ============================================================================
// Content Redirect Events
// ============================================================================

export class RedirectCreatedEvent implements DomainEvent {
  readonly eventType = 'content.redirect.created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    redirectId: string;
    sourceUrl: string;
    targetUrl: string;
    statusCode: number;
  };

  constructor(redirectId: string, sourceUrl: string, targetUrl: string, statusCode: number) {
    this.occurredAt = new Date();
    this.aggregateId = redirectId;
    this.payload = { redirectId, sourceUrl, targetUrl, statusCode };
  }
}

export class RedirectUpdatedEvent implements DomainEvent {
  readonly eventType = 'content.redirect.updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    redirectId: string;
    sourceUrl: string;
    targetUrl: string;
  };

  constructor(redirectId: string, sourceUrl: string, targetUrl: string) {
    this.occurredAt = new Date();
    this.aggregateId = redirectId;
    this.payload = { redirectId, sourceUrl, targetUrl };
  }
}

export class RedirectDeletedEvent implements DomainEvent {
  readonly eventType = 'content.redirect.deleted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    redirectId: string;
    sourceUrl: string;
  };

  constructor(redirectId: string, sourceUrl: string) {
    this.occurredAt = new Date();
    this.aggregateId = redirectId;
    this.payload = { redirectId, sourceUrl };
  }
}
