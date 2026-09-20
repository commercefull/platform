/**
 * Operations Controller for Admin Hub
 * Dashboard for operations management
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { ManageOperationsUseCase } from '../../application/useCases/ManageOperations';
import { adminRespond } from '../../../../libs/adminRespond';

const manageOperationsUseCase = new ManageOperationsUseCase();

// ============================================================================
// Operations Dashboard
// ============================================================================

export const operationsDashboard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const stats = await manageOperationsUseCase.getOperationsStats();
  const recentFulfillments = await manageOperationsUseCase.findRecentFulfillments(10);
  const warehouses = await manageOperationsUseCase.findWarehousesWithCounts();

  adminRespond(req, res, 'operations/dashboard/index', {
    pageName: 'Operations Dashboard',
    stats: {
      ...stats,
      pendingOrders: 0,
    },
    recentFulfillments,
    warehouses,
  });
};
