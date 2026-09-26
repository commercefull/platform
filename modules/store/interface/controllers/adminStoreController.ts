import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import type { StoreRole } from '../../../identity/domain/entities/UserStoreAssignment';
import { logger } from '../../../../libs/logger';
import { adminRespond } from '../../../../libs/adminRespond';
import type { PaginatedResult } from '../../../../libs/types/shared';
import {
  listStoresUseCase,
  getStoreUseCase,
  createStoreUseCase,
  updateStoreUseCase,
  organizationLookupAdapter,
  findActiveStoresUseCase,
} from '../../application/useCases/wired';
import {
  listStoreUsersUseCase,
  assignUserToStoreUseCase,
  removeUserFromStoreUseCase,
} from '../../../identity/application/useCases/store/wired';
import { getOrdersByStoreUseCase } from '../../../order/application/useCases/wired';
import { getDispatchesByStoreUseCase } from '../../../inventory/application/useCases/wired';
import { ListStoresQuery } from '../../application/useCases/ListStores';
import { GetStoreQuery } from '../../application/useCases/GetStore';
import { CreateStoreCommand } from '../../application/useCases/CreateStore';
import { UpdateStoreCommand } from '../../application/useCases/UpdateStore';



export const listStores = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const result = await listStoresUseCase.execute(
    new ListStoresQuery(
      {
        isActive: req.query.status ? req.query.status === 'active' : undefined,
        isHeadquarters: req.query.type ? req.query.type === 'hq' : undefined,
      },
      { page, limit: 20 },
      { field: 'createdAt', direction: 'desc' },
    ),
  );

  adminRespond(req, res, 'stores/index', {
    pageName: 'Stores',
    stores: result.stores,
    pagination: { total: result.total, page: result.page, pages: result.totalPages, limit: result.limit },
    filters: { status: req.query.status || '', type: req.query.type || '' },
  });
};

export const viewStore = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const storeResult = await getStoreUseCase.execute(new GetStoreQuery(req.params.storeId));
  if (!storeResult.store) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Store not found' });
    return;
  }

  const [users, orders, dispatches] = await Promise.all([
    listStoreUsersUseCase.execute(req.params.storeId).catch(() => []),
    getOrdersByStoreUseCase
      .execute(req.params.storeId, 10, 0)
      .catch((): PaginatedResult<unknown> => ({ data: [], total: 0, limit: 10, offset: 0, hasMore: false, length: 0 })),
    getDispatchesByStoreUseCase
      .execute(req.params.storeId, 10, 0)
      .then(result => result as PaginatedResult<{ toJSON: () => unknown }>)
      .catch((): PaginatedResult<{ toJSON: () => unknown }> => ({ data: [], total: 0, limit: 10, offset: 0, hasMore: false, length: 0 })),
  ]);

  adminRespond(req, res, 'stores/view', {
    pageName: storeResult.store.name,
    store: storeResult.store,
    users,
    recentOrders: orders.data || [],
    recentDispatches: dispatches.data ? dispatches.data.map(dispatch => dispatch.toJSON()) : [],
  });
};

export const createStoreForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizations = await organizationLookupAdapter.findAll();
  const stores = await findActiveStoresUseCase.execute();
  adminRespond(req, res, 'stores/create', { pageName: 'Create Store', organizations, stores, formData: {} });
};

export const createStore = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as {
      name: string;
      slug?: string;
      description?: string;
      storeType?: 'merchant_store' | 'organization_store';
      organizationId?: string;
      isHeadquarters?: string;
      parentStoreId?: string;
      storeEmail?: string;
      storePhone?: string;
      storeUrl?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      defaultCurrency?: string;
    };
    const result = await createStoreUseCase.execute(
      new CreateStoreCommand({
        name: body.name,
        slug: body.slug,
        description: body.description,
        storeType: body.storeType || 'organization_store',
        organizationId: body.organizationId || undefined,
        isHeadquarters: body.isHeadquarters === 'on',
        parentStoreId: body.parentStoreId || undefined,
        storeEmail: body.storeEmail || undefined,
        storePhone: body.storePhone || undefined,
        storeUrl: body.storeUrl || undefined,
        address: {
          line1: body.addressLine1,
          line2: body.addressLine2 || undefined,
          city: body.city,
          state: body.state,
          postalCode: body.postalCode,
          country: body.country,
        },
        defaultCurrency: body.defaultCurrency || 'USD',
      }),
    );
    res.redirect(`/admin/stores/${result.storeId}?success=Store created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    const organizations = await organizationLookupAdapter.findAll().catch(() => []);
    const stores = await findActiveStoresUseCase.execute().catch(() => []);
    adminRespond(req, res, 'stores/create', {
      pageName: 'Create Store',
      error: (error as Error).message || 'Failed to create store',
      organizations,
      stores,
      formData: req.body as HttpRequestBody,
    });
  }
};

export const editStoreForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const storeResult = await getStoreUseCase.execute(new GetStoreQuery(req.params.storeId));
  const organizations = await organizationLookupAdapter.findAll();
  const stores = await findActiveStoresUseCase.execute();
  adminRespond(req, res, 'stores/edit', {
    pageName: 'Edit Store',
    store: storeResult.store,
    organizations,
    stores,
    formData: storeResult.store,
  });
};

export const updateStore = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as {
      name?: string;
      description?: string;
      storeEmail?: string;
      storePhone?: string;
      storeUrl?: string;
      isActive?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    await updateStoreUseCase.execute(
      new UpdateStoreCommand(req.params.storeId, {
        name: body.name || undefined,
        description: body.description || undefined,
        storeEmail: body.storeEmail || undefined,
        storePhone: body.storePhone || undefined,
        storeUrl: body.storeUrl || undefined,
        isActive: body.isActive === 'on',
        address: {
          line1: body.addressLine1,
          line2: body.addressLine2 || undefined,
          city: body.city,
          state: body.state,
          postalCode: body.postalCode,
          country: body.country,
        },
      }),
    );
    res.redirect(`/admin/stores/${req.params.storeId}?success=Store updated successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    const organizations = await organizationLookupAdapter.findAll().catch(() => []);
    const stores = await findActiveStoresUseCase.execute().catch(() => []);
    adminRespond(req, res, 'stores/edit', {
      pageName: 'Edit Store',
      error: (error as Error).message || 'Failed to update store',
      organizations,
      stores,
      store: { storeId: req.params.storeId },
      formData: req.body as HttpRequestBody,
    });
  }
};

export const manageStoreUsers = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const storeResult = await getStoreUseCase.execute(new GetStoreQuery(req.params.storeId));
  const users = await listStoreUsersUseCase.execute(req.params.storeId);
  adminRespond(req, res, 'stores/users', { pageName: 'Store Users', store: storeResult.store, users });
};

export const assignUserToStore = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as {
      userId: string;
      role: StoreRole;
      isPrimary?: string;
      permissions?: string;
    };
    await assignUserToStoreUseCase.execute({
      userId: body.userId,
      storeId: req.params.storeId,
      role: body.role,
      isPrimary: body.isPrimary === 'on',
      permissions: body.permissions
        ? body.permissions
            .split(',')
            .map((value: string) => value.trim())
            .filter(Boolean)
        : [],
    });
    res.redirect(`/admin/stores/${req.params.storeId}/users?success=User assigned successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(
      `/admin/stores/${req.params.storeId}/users?error=${encodeURIComponent((error as Error).message || 'Failed to assign user')}`,
    );
  }
};

export const removeUserFromStore = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    await removeUserFromStoreUseCase.execute(req.params.userId, req.params.storeId);
    res.redirect(`/admin/stores/${req.params.storeId}/users?success=User removed successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(
      `/admin/stores/${req.params.storeId}/users?error=${encodeURIComponent((error as Error).message || 'Failed to remove user')}`,
    );
  }
};
