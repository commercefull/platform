import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../libs/logger';
import { adminRespond } from '../../respond';
import StoreRepo from '../../../modules/store/infrastructure/repositories/StoreRepo';
import BusinessRepo from '../../../modules/business/infrastructure/repositories/BusinessRepo';
import SystemConfigurationRepo from '../../../modules/configuration/infrastructure/repositories/SystemConfigurationRepo';
import userStoreRepository from '../../../modules/identity/infrastructure/repositories/UserStoreRepository';
import { ListStoresQuery, ListStoresUseCase } from '../../../modules/store/application/useCases/ListStores';
import { GetStoreQuery, GetStoreUseCase } from '../../../modules/store/application/useCases/GetStore';
import { CreateStoreCommand, CreateStoreUseCase } from '../../../modules/store/application/useCases/CreateStore';
import { UpdateStoreCommand, UpdateStoreUseCase } from '../../../modules/store/application/useCases/UpdateStore';
import { ListStoreUsersUseCase } from '../../../modules/identity/application/useCases/store/ListStoreUsers';
import { AssignUserToStoreUseCase } from '../../../modules/identity/application/useCases/store/AssignUserToStore';
import { RemoveUserFromStoreUseCase } from '../../../modules/identity/application/useCases/store/RemoveUserFromStore';
import OrderRepo from '../../../modules/order/infrastructure/repositories/OrderRepository';
import storeDispatchRepository from '../../../modules/inventory/infrastructure/repositories/StoreDispatchRepository';

const listStoresUseCase = new ListStoresUseCase(StoreRepo);
const getStoreUseCase = new GetStoreUseCase(StoreRepo);
const createStoreUseCase = new CreateStoreUseCase(StoreRepo, BusinessRepo, SystemConfigurationRepo);
const updateStoreUseCase = new UpdateStoreUseCase(StoreRepo);
const listStoreUsersUseCase = new ListStoreUsersUseCase(userStoreRepository);
const assignUserToStoreUseCase = new AssignUserToStoreUseCase(
  userStoreRepository,
  { findById: async (userId: string) => ({ userId }) } as any,
  StoreRepo,
);
const removeUserFromStoreUseCase = new RemoveUserFromStoreUseCase(userStoreRepository);

export const listStores = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
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
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load stores' });
  }
};

export const viewStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const storeResult = await getStoreUseCase.execute(new GetStoreQuery(req.params.storeId));
    if (!storeResult.store) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Store not found' });
      return;
    }

    const [users, orders, dispatches] = await Promise.all([
      listStoreUsersUseCase.execute(req.params.storeId).catch(() => []),
      OrderRepo.findAll({ storeId: req.params.storeId }, { limit: 10, offset: 0, orderBy: 'createdAt', orderDirection: 'desc' }).catch(() => ({ data: [] } as any)),
      storeDispatchRepository.findAll({ fromStoreId: req.params.storeId }, { limit: 10, offset: 0 }).catch(() => ({ data: [] } as any)),
    ]);

    adminRespond(req, res, 'stores/view', {
      pageName: storeResult.store.name,
      store: storeResult.store,
      users,
      recentOrders: orders.data || [],
      recentDispatches: dispatches.data ? dispatches.data.map((dispatch: { toJSON: () => any }) => dispatch.toJSON()) : [],
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load store' });
  }
};

export const createStoreForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const businesses = await BusinessRepo.findActive();
    const stores = await StoreRepo.findActive();
    adminRespond(req, res, 'stores/create', { pageName: 'Create Store', businesses, stores, formData: {} });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load store form' });
  }
};

export const createStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const result = await createStoreUseCase.execute(
      new CreateStoreCommand({
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
        storeType: req.body.storeType || 'business_store',
        businessId: req.body.businessId || undefined,
        merchantId: req.body.merchantId || undefined,
        isHeadquarters: req.body.isHeadquarters === 'on',
        parentStoreId: req.body.parentStoreId || undefined,
        storeEmail: req.body.storeEmail || undefined,
        storePhone: req.body.storePhone || undefined,
        storeUrl: req.body.storeUrl || undefined,
        address: {
          line1: req.body.addressLine1,
          line2: req.body.addressLine2 || undefined,
          city: req.body.city,
          state: req.body.state,
          postalCode: req.body.postalCode,
          country: req.body.country,
        },
        defaultCurrency: req.body.defaultCurrency || 'USD',
      }),
    );
    res.redirect(`/admin/stores/${result.storeId}?success=Store created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    const businesses = await BusinessRepo.findActive().catch(() => []);
    const stores = await StoreRepo.findActive().catch(() => []);
    adminRespond(req, res, 'stores/create', {
      pageName: 'Create Store',
      error: error.message || 'Failed to create store',
      businesses,
      stores,
      formData: req.body,
    });
  }
};

export const editStoreForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const storeResult = await getStoreUseCase.execute(new GetStoreQuery(req.params.storeId));
    const businesses = await BusinessRepo.findActive();
    const stores = await StoreRepo.findActive();
    adminRespond(req, res, 'stores/edit', { pageName: 'Edit Store', store: storeResult.store, businesses, stores, formData: storeResult.store });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load store form' });
  }
};

export const updateStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await updateStoreUseCase.execute(
      new UpdateStoreCommand(req.params.storeId, {
        name: req.body.name || undefined,
        description: req.body.description || undefined,
        storeEmail: req.body.storeEmail || undefined,
        storePhone: req.body.storePhone || undefined,
        storeUrl: req.body.storeUrl || undefined,
        isActive: req.body.isActive === 'on',
        address: {
          line1: req.body.addressLine1,
          line2: req.body.addressLine2 || undefined,
          city: req.body.city,
          state: req.body.state,
          postalCode: req.body.postalCode,
          country: req.body.country,
        },
      }),
    );
    res.redirect(`/admin/stores/${req.params.storeId}?success=Store updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    const businesses = await BusinessRepo.findActive().catch(() => []);
    const stores = await StoreRepo.findActive().catch(() => []);
    adminRespond(req, res, 'stores/edit', {
      pageName: 'Edit Store',
      error: error.message || 'Failed to update store',
      businesses,
      stores,
      store: { storeId: req.params.storeId },
      formData: req.body,
    });
  }
};

export const manageStoreUsers = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const storeResult = await getStoreUseCase.execute(new GetStoreQuery(req.params.storeId));
    const users = await listStoreUsersUseCase.execute(req.params.storeId);
    adminRespond(req, res, 'stores/users', { pageName: 'Store Users', store: storeResult.store, users });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load store users' });
  }
};

export const assignUserToStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await assignUserToStoreUseCase.execute({
      userId: req.body.userId,
      storeId: req.params.storeId,
      role: req.body.role,
      isPrimary: req.body.isPrimary === 'on',
      permissions: req.body.permissions ? String(req.body.permissions).split(',').map((value: string) => value.trim()).filter(Boolean) : [],
    });
    res.redirect(`/admin/stores/${req.params.storeId}/users?success=User assigned successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/stores/${req.params.storeId}/users?error=${encodeURIComponent(error.message || 'Failed to assign user')}`);
  }
};

export const removeUserFromStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await removeUserFromStoreUseCase.execute(req.params.userId, req.params.storeId);
    res.redirect(`/admin/stores/${req.params.storeId}/users?success=User removed successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/stores/${req.params.storeId}/users?error=${encodeURIComponent(error.message || 'Failed to remove user')}`);
  }
};
