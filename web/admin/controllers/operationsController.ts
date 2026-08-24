/**
 * Operations Controller for Admin Hub
 * Dashboard for operations management
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { ManageOperationsUseCase } from '../../../modules/fulfillment/application/useCases/ManageOperations';
import { adminRespond } from '../../respond';

const manageOperationsUseCase = new ManageOperationsUseCase();

// ============================================================================
// Operations Dashboard
// ============================================================================

export const operationsDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
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
