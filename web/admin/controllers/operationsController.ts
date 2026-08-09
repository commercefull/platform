/**
 * Operations Controller for Admin Hub
 * Dashboard for operations management
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import * as adminOperationsRepo from '../../../modules/fulfillment/infrastructure/repositories/adminOperationsRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Operations Dashboard
// ============================================================================

export const operationsDashboard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const stats = await adminOperationsRepo.getOperationsStats();
    const recentFulfillments = await adminOperationsRepo.findRecentFulfillments(10);
    const warehouses = await adminOperationsRepo.findWarehousesWithCounts();

    adminRespond(req, res, 'operations/dashboard/index', {
      pageName: 'Operations Dashboard',
      stats: {
        ...stats,
        pendingOrders: 0,
      },
      recentFulfillments,
      warehouses,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load operations dashboard',
    });
  }
};
