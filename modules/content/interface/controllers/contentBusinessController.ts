import { TypeAndPageHandlers } from './contentBusiness/typeAndPageHandlers';
import { BlockAndTemplateHandlers } from './contentBusiness/blockAndTemplateHandlers';
import { CategoryNavHandlers } from './contentBusiness/categoryNavHandlers';
import { MediaHandlers } from './contentBusiness/mediaHandlers';
import { RedirectVersionTranslationHandlers } from './contentBusiness/redirectVersionTranslationHandlers';

/**
 * Business content controller. Composes per-section handler classes kept in
 * `contentBusiness/` so each concern lives in a focused file. All members are
 * arrow-function properties, so the router can use them unbound as before.
 */
export class ContentController {
  private readonly typeAndPage = new TypeAndPageHandlers();
  private readonly blockAndTemplate = new BlockAndTemplateHandlers();
  private readonly categoryNav = new CategoryNavHandlers();
  private readonly media = new MediaHandlers();
  private readonly redirectVersionTranslation = new RedirectVersionTranslationHandlers();

  constructor() {}

  // Content Type Handlers
  getContentTypes = this.typeAndPage.getContentTypes;
  getContentTypeById = this.typeAndPage.getContentTypeById;
  getContentTypeBySlug = this.typeAndPage.getContentTypeBySlug;
  createContentType = this.typeAndPage.createContentType;
  updateContentType = this.typeAndPage.updateContentType;
  deleteContentType = this.typeAndPage.deleteContentType;

  // Content Page Handlers
  getPages = this.typeAndPage.getPages;
  getPageById = this.typeAndPage.getPageById;
  getFullPageById = this.typeAndPage.getFullPageById;
  createPage = this.typeAndPage.createPage;
  updatePage = this.typeAndPage.updatePage;
  deletePage = this.typeAndPage.deletePage;

  // Content Block Handlers
  getPageBlocks = this.blockAndTemplate.getPageBlocks;
  getBlockById = this.blockAndTemplate.getBlockById;
  createBlock = this.blockAndTemplate.createBlock;
  updateBlock = this.blockAndTemplate.updateBlock;
  deleteBlock = this.blockAndTemplate.deleteBlock;
  reorderBlocks = this.blockAndTemplate.reorderBlocks;

  // Template Handlers
  getTemplates = this.blockAndTemplate.getTemplates;
  getTemplateById = this.blockAndTemplate.getTemplateById;
  createTemplate = this.blockAndTemplate.createTemplate;
  updateTemplate = this.blockAndTemplate.updateTemplate;
  deleteTemplate = this.blockAndTemplate.deleteTemplate;
  duplicateTemplate = this.blockAndTemplate.duplicateTemplate;

  // Page Action Handlers
  publishPage = this.typeAndPage.publishPage;
  unpublishPage = this.typeAndPage.unpublishPage;
  schedulePage = this.typeAndPage.schedulePage;
  duplicatePage = this.typeAndPage.duplicatePage;

  // Page Publication Handlers
  getPagePublications = this.typeAndPage.getPagePublications;
  createPagePublication = this.typeAndPage.createPagePublication;
  deletePagePublication = this.typeAndPage.deletePagePublication;

  // Category Handlers
  getCategories = this.categoryNav.getCategories;
  getCategoryTree = this.categoryNav.getCategoryTree;
  createCategory = this.categoryNav.createCategory;
  getCategoryById = this.categoryNav.getCategoryById;
  updateCategory = this.categoryNav.updateCategory;
  deleteCategory = this.categoryNav.deleteCategory;
  moveCategory = this.categoryNav.moveCategory;

  // Navigation Handlers
  getNavigations = this.categoryNav.getNavigations;
  createNavigation = this.categoryNav.createNavigation;
  getNavigationById = this.categoryNav.getNavigationById;
  getNavigationWithItems = this.categoryNav.getNavigationWithItems;
  updateNavigation = this.categoryNav.updateNavigation;
  deleteNavigation = this.categoryNav.deleteNavigation;
  addNavigationItem = this.categoryNav.addNavigationItem;
  updateNavigationItem = this.categoryNav.updateNavigationItem;
  deleteNavigationItem = this.categoryNav.deleteNavigationItem;
  reorderNavigationItems = this.categoryNav.reorderNavigationItems;

  // Media Handlers
  getMedia = this.media.getMedia;
  uploadMedia = this.media.uploadMedia;
  getMediaById = this.media.getMediaById;
  updateMedia = this.media.updateMedia;
  deleteMedia = this.media.deleteMedia;
  moveMediaToFolder = this.media.moveMediaToFolder;

  // Media Folder Handlers
  getMediaFolders = this.media.getMediaFolders;
  getMediaFolderTree = this.media.getMediaFolderTree;
  createMediaFolder = this.media.createMediaFolder;
  updateMediaFolder = this.media.updateMediaFolder;
  deleteMediaFolder = this.media.deleteMediaFolder;

  // Redirect Handlers
  getRedirects = this.redirectVersionTranslation.getRedirects;
  createRedirect = this.redirectVersionTranslation.createRedirect;
  getRedirectById = this.redirectVersionTranslation.getRedirectById;
  updateRedirect = this.redirectVersionTranslation.updateRedirect;
  deleteRedirect = this.redirectVersionTranslation.deleteRedirect;

  // Page Version Handlers
  getPageVersions = this.redirectVersionTranslation.getPageVersions;
  createPageVersion = this.redirectVersionTranslation.createPageVersion;
  restorePageVersion = this.redirectVersionTranslation.restorePageVersion;
  deletePageVersion = this.redirectVersionTranslation.deletePageVersion;

  // Page Translation Handlers
  getPageTranslations = this.redirectVersionTranslation.getPageTranslations;
  getPageTranslationByLocale = this.redirectVersionTranslation.getPageTranslationByLocale;
  createPageTranslation = this.redirectVersionTranslation.createPageTranslation;
  updatePageTranslation = this.redirectVersionTranslation.updatePageTranslation;
  deletePageTranslation = this.redirectVersionTranslation.deletePageTranslation;

  // Categorization Handlers
  getPageCategories = this.categoryNav.getPageCategories;
  assignPageToCategory = this.categoryNav.assignPageToCategory;
  removePageFromCategory = this.categoryNav.removePageFromCategory;
  setPrimaryCategory = this.categoryNav.setPrimaryCategory;
  getPagesByCategory = this.categoryNav.getPagesByCategory;

  // Media Usage Handlers
  getMediaUsage = this.media.getMediaUsage;
  getMediaUsageByEntity = this.media.getMediaUsageByEntity;
  trackMediaUsage = this.media.trackMediaUsage;
  untrackMediaUsage = this.media.untrackMediaUsage;
  getMediaUsageCount = this.media.getMediaUsageCount;
}
