/**
 * System Configuration HTTP Router
 * Defines routes for system configuration operations
 */

import { Router } from 'express';
import { SystemConfigurationController } from './SystemConfigurationController';

const router = Router();
const systemConfigurationController = new SystemConfigurationController();

// Create system configuration
router.post('/configuration', systemConfigurationController.createSystemConfiguration.bind(systemConfigurationController));

// Update system configuration
router.put('/configuration/:configId', systemConfigurationController.updateSystemConfiguration.bind(systemConfigurationController));

// Get system configuration by ID
router.get('/configuration/:configId', systemConfigurationController.getSystemConfiguration.bind(systemConfigurationController));

// Get active system configuration
router.get('/configuration/active', systemConfigurationController.getActiveSystemConfiguration.bind(systemConfigurationController));

// List all system configurations
router.get('/configuration', systemConfigurationController.listSystemConfigurations.bind(systemConfigurationController));

export { router as systemConfigurationRouter };
