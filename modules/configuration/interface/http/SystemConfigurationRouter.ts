/**
 * System Configuration HTTP Router
 * Defines routes for system configuration operations
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { SystemConfigurationController } from './SystemConfigurationController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = Router();
const systemConfigurationController = new SystemConfigurationController();

router.use(isOrganizationLoggedIn);

// Create system configuration
router.post('/configuration', asyncHandler(systemConfigurationController.createSystemConfiguration.bind(systemConfigurationController)));

// Update system configuration
router.put('/configuration/:configId', asyncHandler(systemConfigurationController.updateSystemConfiguration.bind(systemConfigurationController)));

// Get active system configuration (must be before /:configId to avoid matching "active" as an ID)
router.get('/configuration/active', asyncHandler(systemConfigurationController.getActiveSystemConfiguration.bind(systemConfigurationController)));

// Get system configuration by ID
router.get('/configuration/:configId', asyncHandler(systemConfigurationController.getSystemConfiguration.bind(systemConfigurationController)));

// List all system configurations
router.get('/configuration', asyncHandler(systemConfigurationController.listSystemConfigurations.bind(systemConfigurationController)));

export { router as systemConfigurationRouter };
