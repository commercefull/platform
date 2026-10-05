import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { StoreRole } from '../../domain/entities/UserStoreAssignment';
import { assignUserToStoreUseCase, getUserStoresUseCase, listStoreUsersUseCase, removeUserFromStoreUseCase } from '../../application/wired';

interface AssignUserBody {
  storeId: string;
  role: StoreRole;
  isPrimary?: boolean;
  permissions?: string[];
}

export const assignUserToStore = async (
  req: HttpRequest<Record<string, string>, unknown, AssignUserBody>,
  res: HttpResponse,
): Promise<void> => {
  if (!req.body.storeId) {
    jsonResponse(res, 400, { success: false, error: 'storeId is required' });
    return;
  }
  if (!req.body.role) {
    jsonResponse(res, 400, { success: false, error: 'role is required' });
    return;
  }
  const result = await assignUserToStoreUseCase.execute({
    userId: req.params.userId,
    storeId: req.body.storeId,
    role: req.body.role,
    isPrimary: req.body.isPrimary,
    permissions: req.body.permissions,
  });

  jsonResponse(res, 201, { success: true, data: result });
};

export const getUserStores = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const result = await getUserStoresUseCase.execute(req.params.userId);
  jsonResponse(res, 200, { success: true, data: result });
};

export const listStoreUsers = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const result = await listStoreUsersUseCase.execute(req.params.storeId);
  jsonResponse(res, 200, { success: true, data: result });
};

export const removeUserFromStore = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  await removeUserFromStoreUseCase.execute(req.params.userId, req.params.storeId);
  jsonResponse(res, 200, { success: true });
};
