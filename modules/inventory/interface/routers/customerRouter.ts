/**
 * Inventory Customer Router
 *
 * Public routes for checking product availability.
 */

import express from 'express';
import { checkAvailability } from '../controllers/inventoryController';

const router = express.Router();

// Check product availability by SKU
router.get('/inventory/availability/:sku', checkAvailability);

export const inventoryCustomerRouter = router;
