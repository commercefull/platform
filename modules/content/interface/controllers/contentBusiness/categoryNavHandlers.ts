import {jsonResponse} from 'libs/apiResponse';
import type {HttpRequest, HttpResponse} from 'libs/http';
import {createCategoryUseCase, updateCategoryUseCase, deleteCategoryUseCase, moveCategoryUseCase, createNavigationUseCase, updateNavigationUseCase, addNavigationItemUseCase, assignPageToCategoryUseCase, removePageFromCategoryUseCase, setPrimaryCategoryUseCase, manageContentUseCase} from '../../../application/useCases/wired';
import {CreateCategoryCommand} from '../../../application/useCases/category/CreateCategory';
import {UpdateCategoryCommand} from '../../../application/useCases/category/UpdateCategory';
import {MoveCategoryCommand} from '../../../application/useCases/category/MoveCategory';
import {CreateNavigationCommand} from '../../../application/useCases/navigation/CreateNavigation';
import {UpdateNavigationCommand} from '../../../application/useCases/navigation/UpdateNavigation';
import {AddNavigationItemCommand} from '../../../application/useCases/navigation/AddNavigationItem';
import {AssignPageToCategoryCommand} from '../../../application/useCases/categorization/AssignPageToCategory';
import {RemovePageFromCategoryCommand} from '../../../application/useCases/categorization/RemovePageFromCategory';
import {SetPrimaryCategoryCommand} from '../../../application/useCases/categorization/SetPrimaryCategory';
import type {CreateCategoryBody, UpdateCategoryBody, MoveCategoryBody, CreateNavigationBody, UpdateNavigationBody, AddNavigationItemBody, UpdateNavigationItemBody, ReorderNavigationItemsBody, AssignCategoryBody, SetPrimaryCategoryBody} from './types';

/** Category, navigation, and page-categorization handlers. */
export class CategoryNavHandlers {
  private contentUC = manageContentUseCase;

  // Category Handlers

  getCategories = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const parentId = req.query.parentId as string | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const categories = await this.contentUC.findAllCategories(parentId, isActive, limit, offset);
    jsonResponse(res, 200, { success: true, data: categories });
  };

  getCategoryTree = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const categories = await this.contentUC.getCategoryTree(isActive);
    jsonResponse(res, 200, { success: true, data: categories });
  };

  createCategory = async (req: HttpRequest<Record<string, string>, unknown, CreateCategoryBody>, res: HttpResponse): Promise<void> => {
    const { name, slug, parentId, description, featuredImage, metaTitle, metaDescription, sortOrder, isActive } = req.body;

    const result = await createCategoryUseCase.execute(
      new CreateCategoryCommand({
        name: name,
        slug: slug,
        parentId: parentId,
        description: description,
        featuredImage: featuredImage,
        metaTitle: metaTitle,
        metaDescription: metaDescription,
        sortOrder: sortOrder,
        isActive: isActive,
      }),
    );
    jsonResponse(res, 201, {
      success: true,
      data: { ...result, contentCategoryId: result.id },
      message: 'Category created successfully',
    });
  };

  getCategoryById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const category = await this.contentUC.findCategoryById(id);
    if (!category) {
      jsonResponse(res, 404, { success: false, message: `Category with ID ${id} not found` });
      return;
    }
    jsonResponse(res, 200, { success: true, data: category });
  };

  updateCategory = async (req: HttpRequest<Record<string, string>, unknown, UpdateCategoryBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { name, slug, description, featuredImage, metaTitle, metaDescription, sortOrder, isActive } = req.body;

    const result = await updateCategoryUseCase.execute(
      new UpdateCategoryCommand(id, { name, slug, description, featuredImage, metaTitle, metaDescription, sortOrder, isActive }),
    );
    jsonResponse(res, 200, { success: true, data: result, message: 'Category updated successfully' });
  };

  deleteCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;

    await deleteCategoryUseCase.execute(id);
    jsonResponse(res, 200, { success: true, message: 'Category deleted successfully' });
  };

  moveCategory = async (req: HttpRequest<Record<string, string>, unknown, MoveCategoryBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { newParentId } = req.body;

    const result = await moveCategoryUseCase.execute(new MoveCategoryCommand(id, newParentId ?? null));
    jsonResponse(res, 200, { success: true, data: { ...result, contentCategoryId: result.id }, message: 'Category moved successfully' });
  };

  // Navigation Handlers

  getNavigations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const navigations = await this.contentUC.findAllNavigations(isActive);
    jsonResponse(res, 200, { success: true, data: navigations });
  };

  createNavigation = async (req: HttpRequest<Record<string, string>, unknown, CreateNavigationBody>, res: HttpResponse): Promise<void> => {
    const { name, slug, description, location, isActive } = req.body;

    const result = await createNavigationUseCase.execute(new CreateNavigationCommand({ name, slug, description, location, isActive }));
    jsonResponse(res, 201, {
      success: true,
      data: { ...result, contentNavigationId: result.id },
      message: 'Navigation created successfully',
    });
  };

  getNavigationById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const navigation = await this.contentUC.findNavigationById(id);
    if (!navigation) {
      jsonResponse(res, 404, { success: false, message: `Navigation with ID ${id} not found` });
      return;
    }
    jsonResponse(res, 200, { success: true, data: navigation });
  };

  getNavigationWithItems = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const navigation = await this.contentUC.findNavigationById(id);
    if (!navigation) {
      jsonResponse(res, 404, { success: false, message: `Navigation with ID ${id} not found` });
      return;
    }

    const items = await this.contentUC.findAllNavigationItems(id);
    jsonResponse(res, 200, { success: true, data: { navigation, items } });
  };

  updateNavigation = async (req: HttpRequest<Record<string, string>, unknown, UpdateNavigationBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { name, slug, description, location, isActive } = req.body;

    const result = await updateNavigationUseCase.execute(new UpdateNavigationCommand(id, { name, slug, description, location, isActive }));
    jsonResponse(res, 200, { success: true, data: result, message: 'Navigation updated successfully' });
  };

  deleteNavigation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    await this.contentUC.deleteNavigation(id);
    jsonResponse(res, 200, { success: true, message: 'Navigation deleted successfully' });
  };

  addNavigationItem = async (
    req: HttpRequest<Record<string, string>, unknown, AddNavigationItemBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { navigationId } = req.params;
    const {
      parentId,
      title,
      type,
      url,
      contentPageId,
      targetId,
      targetSlug,
      icon,
      cssClasses,
      openInNewTab,
      isActive,
      sortOrder,
      conditions,
    } = req.body;

    const result = await addNavigationItemUseCase.execute(
      new AddNavigationItemCommand({
        navigationId: navigationId,
        title: title,
        type: type as 'url' | 'page' | 'category' | 'product' | 'blog',
        parentId: parentId,
        url: url,
        contentPageId: contentPageId,
        targetId: targetId,
        targetSlug: targetSlug,
        icon: icon,
        cssClasses: cssClasses,
        openInNewTab: openInNewTab,
        isActive: isActive,
        sortOrder: sortOrder,
        conditions: conditions,
      }),
    );
    jsonResponse(res, 201, {
      success: true,
      data: { ...result, contentNavigationItemId: result.id },
      message: 'Navigation item added successfully',
    });
  };

  updateNavigationItem = async (
    req: HttpRequest<Record<string, string>, unknown, UpdateNavigationItemBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { id } = req.params;
    const { title, type, url, contentPageId, icon, openInNewTab, isActive, sortOrder } = req.body;

    const updated = await this.contentUC.updateNavigationItem(id, {
      title,
      type: type as 'url' | 'page' | 'category' | 'product' | 'blog' | undefined,
      url,
      contentPageId,
      icon,
      openInNewTab,
      isActive,
      sortOrder,
    });
    jsonResponse(res, 200, { success: true, data: updated, message: 'Navigation item updated successfully' });
  };

  deleteNavigationItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    await this.contentUC.deleteNavigationItem(id);
    jsonResponse(res, 200, { success: true, message: 'Navigation item deleted successfully' });
  };

  reorderNavigationItems = async (
    req: HttpRequest<Record<string, string>, unknown, ReorderNavigationItemsBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { navigationId } = req.params;
    const { itemOrders } = req.body;

    if (!itemOrders || !Array.isArray(itemOrders)) {
      jsonResponse(res, 400, { success: false, message: 'Item orders array is required' });
      return;
    }

    await this.contentUC.reorderNavigationItems(navigationId, itemOrders);
    jsonResponse(res, 200, { success: true, message: 'Navigation items reordered successfully' });
  };

  // Categorization Handlers

  getPageCategories = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId } = req.params;

    const page = await this.contentUC.findPageById(pageId);
    if (!page) {
      jsonResponse(res, 404, { success: false, message: `Page with ID ${pageId} not found` });
      return;
    }

    const categorizations = await this.contentUC.findCategorizationsByPageId(pageId);
    jsonResponse(res, 200, { success: true, data: categorizations });
  };

  assignPageToCategory = async (
    req: HttpRequest<Record<string, string>, unknown, AssignCategoryBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { pageId } = req.params;
    const { categoryId, isPrimary } = req.body;

    const result = await assignPageToCategoryUseCase.execute(new AssignPageToCategoryCommand(pageId, categoryId, isPrimary));
    jsonResponse(res, 201, { success: true, data: result, message: 'Page assigned to category successfully' });
  };

  removePageFromCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId, categoryId } = req.params;

    await removePageFromCategoryUseCase.execute(new RemovePageFromCategoryCommand(pageId, categoryId));
    jsonResponse(res, 200, { success: true, message: 'Page removed from category successfully' });
  };

  setPrimaryCategory = async (
    req: HttpRequest<Record<string, string>, unknown, SetPrimaryCategoryBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { pageId } = req.params;
    const { categorizationId } = req.body;

    const result = await setPrimaryCategoryUseCase.execute(new SetPrimaryCategoryCommand(pageId, categorizationId));
    jsonResponse(res, 200, { success: true, data: result, message: 'Primary category set successfully' });
  };

  getPagesByCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const categorizations = await this.contentUC.findCategorizationsByCategoryId(categoryId, limit, offset);

    // Fetch the actual pages
    const pages = await Promise.all(
      categorizations.map(async cat => {
        const page = await this.contentUC.findPageById(cat.contentPageId);
        return page ? { ...page, isPrimary: cat.isPrimary } : null;
      }),
    );

    const validPages = pages.filter(p => p !== null);
    jsonResponse(res, 200, { success: true, data: validPages });
  };
}
