import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { logger } from '../../../libs/logger';
import { adminRespond } from '../../respond';
import { listStoresUseCase, getStoreUseCase, createStoreUseCase, updateStoreUseCase, organizationLookupAdapter, FindActiveStoresUseCase } from '../../../modules/store/application/useCases/wired';
import { listStoreUsersUseCase, assignUserToStoreUseCase, removeUserFromStoreUseCase } from '../../../modules/identity/application/useCases/store/wired';
import { GetOrdersByStoreUseCase } from '../../../modules/order/application/useCases/GetOrdersByStore';
import { GetDispatchesByStoreUseCase } from '../../../modules/inventory/application/useCases/GetDispatchesByStore';
import { ListStoresQuery } from '../../../modules/store/application/useCases/ListStores';
import { GetStoreQuery } from '../../../modules/store/application/useCases/GetStore';
import { CreateStoreCommand } from '../../../modules/store/application/useCases/CreateStore';
import { UpdateStoreCommand } from '../../../modules/store/application/useCases/UpdateStore';

const findActiveStoresUseCase = new FindActiveStoresUseCase();
const getOrdersByStoreUseCase = new GetOrdersByStoreUseCase();
const getDispatchesByStoreUseCase = new GetDispatchesByStoreUseCase();

export const listStores = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const viewStore = async (req: TypedRequest, res: Response): Promise<void> => {
  const storeResult = await getStoreUseCase.execute(new GetStoreQuery(req.params.storeId));
  if (!storeResult.store) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Store not found' });
    return;
  }

  const [users, orders, dispatches] = await Promise.all([
    listStoreUsersUseCase.execute(req.params.storeId).catch(() => []),
    getOrdersByStoreUseCase.execute(req.params.storeId, 10, 0).catch(
      () => ({ data: [] }) as Record<string, unknown>,
    ),
    getDispatchesByStoreUseCase.execute(req.params.storeId, 10, 0).catch(() => ({ data: [] }) as Record<string, unknown>),
  ]);

  adminRespond(req, res, 'stores/view', {
    pageName: storeResult.store.name,
    store: storeResult.store,
    users,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentOrders: (orders as any).data || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentDispatches: (dispatches as any).data ? (dispatches as any).data.map((dispatch: { toJSON: () => unknown }) => dispatch.toJSON()) : [],
  });
  
};

export const createStoreForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const organizations = await organizationLookupAdapter.findAll();
  const stores = await findActiveStoresUseCase.execute();
  adminRespond(req, res, 'stores/create', { pageName: 'Create Store', organizations, stores, formData: {} });
  
};

export const createStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await createStoreUseCase.execute(
      new CreateStoreCommand({
        name: (req.body as RequestBody).name,
        slug: (req.body as RequestBody).slug,
        description: (req.body as RequestBody).description,
        storeType: (req.body as RequestBody).storeType || 'organization_store',
        organizationId: (req.body as RequestBody).organizationId || undefined,
        isHeadquarters: (req.body as RequestBody).isHeadquarters === 'on',
        parentStoreId: (req.body as RequestBody).parentStoreId || undefined,
        storeEmail: (req.body as RequestBody).storeEmail || undefined,
        storePhone: (req.body as RequestBody).storePhone || undefined,
        storeUrl: (req.body as RequestBody).storeUrl || undefined,
        address: {
          line1: (req.body as RequestBody).addressLine1,
          line2: (req.body as RequestBody).addressLine2 || undefined,
          city: (req.body as RequestBody).city,
          state: (req.body as RequestBody).state,
          postalCode: (req.body as RequestBody).postalCode,
          country: (req.body as RequestBody).country,
        },
        defaultCurrency: (req.body as RequestBody).defaultCurrency || 'USD',
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
      formData: req.body as RequestBody,
    });
  }
};

export const editStoreForm = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const updateStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await updateStoreUseCase.execute(
      new UpdateStoreCommand(req.params.storeId, {
        name: (req.body as RequestBody).name || undefined,
        description: (req.body as RequestBody).description || undefined,
        storeEmail: (req.body as RequestBody).storeEmail || undefined,
        storePhone: (req.body as RequestBody).storePhone || undefined,
        storeUrl: (req.body as RequestBody).storeUrl || undefined,
        isActive: (req.body as RequestBody).isActive === 'on',
        address: {
          line1: (req.body as RequestBody).addressLine1,
          line2: (req.body as RequestBody).addressLine2 || undefined,
          city: (req.body as RequestBody).city,
          state: (req.body as RequestBody).state,
          postalCode: (req.body as RequestBody).postalCode,
          country: (req.body as RequestBody).country,
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
      formData: req.body as RequestBody,
    });
  }
};

export const manageStoreUsers = async (req: TypedRequest, res: Response): Promise<void> => {
  const storeResult = await getStoreUseCase.execute(new GetStoreQuery(req.params.storeId));
  const users = await listStoreUsersUseCase.execute(req.params.storeId);
  adminRespond(req, res, 'stores/users', { pageName: 'Store Users', store: storeResult.store, users });
  
};

export const assignUserToStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await assignUserToStoreUseCase.execute({
      userId: (req.body as RequestBody).userId,
      storeId: req.params.storeId,
      role: (req.body as RequestBody).role,
      isPrimary: (req.body as RequestBody).isPrimary === 'on',
      permissions: (req.body as RequestBody).permissions
        ? String((req.body as RequestBody).permissions)
            .split(',')
            .map((value: string) => value.trim())
            .filter(Boolean)
        : [],
    });
    res.redirect(`/admin/stores/${req.params.storeId}/users?success=User assigned successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/stores/${req.params.storeId}/users?error=${encodeURIComponent((error as Error).message || 'Failed to assign user')}`);
  }
};

export const removeUserFromStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await removeUserFromStoreUseCase.execute(req.params.userId, req.params.storeId);
    res.redirect(`/admin/stores/${req.params.storeId}/users?success=User removed successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/stores/${req.params.storeId}/users?error=${encodeURIComponent((error as Error).message || 'Failed to remove user')}`);
  }
};
