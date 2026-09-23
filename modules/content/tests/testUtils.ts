/**
 * Shared test utilities for content use-case tests.
 * Mocks the eventBus boundary once and provides typed lazy port mocks
 * plus factories for the libs/db/types rows the content ports return.
 */

import { eventBus } from '../../../libs/events/eventBus';
import type {
  ContentPage,
  ContentBlock,
  ContentBlockType,
  ContentType,
  ContentTemplate,
  ContentCategory,
  ContentMedia,
  ContentMediaFolder,
  ContentNavigation,
  ContentNavigationItem,
  ContentRedirect,
} from '../../../libs/db/types';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

export function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    // `in` checks must see every port method
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

const now = new Date('2024-01-01T00:00:00.000Z');

// ============================================================================
// Record factories
// ============================================================================

export function createContentPage(overrides: Partial<ContentPage> = {}): ContentPage {
  return {
    contentPageId: 'page-1',
    title: 'Test Page',
    slug: 'test-page',
    contentTypeId: 'ct-1',
    templateId: null,
    status: 'draft',
    visibility: 'public',
    accessPassword: null,
    summary: null,
    featuredImage: null,
    parentId: null,
    sortOrder: null,
    metaTitle: null,
    metaDescription: null,
    metaKeywords: null,
    openGraphImage: null,
    canonicalUrl: null,
    noIndex: null,
    customFields: null,
    publishedAt: null,
    scheduledAt: null,
    expiresAt: null,
    isHomePage: null,
    path: null,
    depth: null,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    publishedBy: null,
    ...overrides,
  };
}

export function createContentBlock(overrides: Partial<ContentBlock> = {}): ContentBlock {
  return {
    contentBlockId: 'block-1',
    contentPageId: 'page-1',
    blockTypeId: 'bt-1',
    title: null,
    area: 'main',
    sortOrder: 0,
    content: {},
    settings: null,
    isVisible: true,
    cssClasses: null,
    conditions: null,
    parentBlockId: null,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

export function createContentBlockType(overrides: Partial<ContentBlockType> = {}): ContentBlockType {
  return {
    contentBlockTypeId: 'bt-1',
    name: 'Text',
    slug: 'text',
    description: null,
    icon: null,
    category: null,
    defaultConfig: null,
    schema: null,
    isSystem: false,
    isActive: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

export function createContentType(overrides: Partial<ContentType> = {}): ContentType {
  return {
    contentTypeId: 'ct-1',
    name: 'Page',
    slug: 'page',
    description: null,
    icon: null,
    allowedBlocks: null,
    defaultTemplate: null,
    requiredFields: null,
    metaFields: null,
    isSystem: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

export function createContentTemplate(overrides: Partial<ContentTemplate> = {}): ContentTemplate {
  return {
    contentTemplateId: 'tpl-1',
    name: 'Default',
    slug: 'default',
    description: null,
    thumbnail: null,
    htmlStructure: null,
    cssStyles: null,
    jsScripts: null,
    areas: null,
    defaultBlocks: null,
    compatibleContentTypes: null,
    isSystem: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

export function createContentCategory(overrides: Partial<ContentCategory> = {}): ContentCategory {
  return {
    contentCategoryId: 'cat-1',
    name: 'Category',
    slug: 'category',
    parentId: null,
    description: null,
    featuredImage: null,
    metaTitle: null,
    metaDescription: null,
    sortOrder: 0,
    isActive: true,
    path: null,
    depth: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createContentMedia(overrides: Partial<ContentMedia> = {}): ContentMedia {
  return {
    contentMediaId: 'media-1',
    title: 'Image',
    fileName: 'image.png',
    filePath: '/uploads/image.png',
    fileType: 'image/png',
    fileSize: 1024,
    width: null,
    height: null,
    duration: null,
    altText: null,
    caption: null,
    description: null,
    contentMediaFolderId: null,
    url: 'https://cdn.test/image.png',
    thumbnailUrl: null,
    sortOrder: 0,
    tags: null,
    isExternal: false,
    externalService: null,
    externalId: null,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

export function createContentMediaFolder(overrides: Partial<ContentMediaFolder> = {}): ContentMediaFolder {
  return {
    contentMediaFolderId: 'folder-1',
    name: 'Folder',
    parentId: null,
    path: 'folder',
    depth: 0,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

export function createContentNavigation(overrides: Partial<ContentNavigation> = {}): ContentNavigation {
  return {
    contentNavigationId: 'nav-1',
    name: 'Main Nav',
    slug: 'main',
    description: null,
    location: 'header',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

export function createContentNavigationItem(overrides: Partial<ContentNavigationItem> = {}): ContentNavigationItem {
  return {
    contentNavigationItemId: 'item-1',
    navigationId: 'nav-1',
    parentId: null,
    title: 'Home',
    type: 'url',
    url: '/',
    contentPageId: null,
    targetId: null,
    targetSlug: null,
    icon: null,
    cssClasses: null,
    openInNewTab: false,
    isActive: true,
    sortOrder: 0,
    conditions: null,
    depth: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createContentRedirect(overrides: Partial<ContentRedirect> = {}): ContentRedirect {
  return {
    contentRedirectId: 'red-1',
    sourceUrl: '/old',
    targetUrl: '/new',
    statusCode: '301',
    isRegex: false,
    isActive: true,
    hits: 0,
    lastUsed: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}
