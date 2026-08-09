/**
 * Inventory Customer Router
 *
 * Public routes for checking product availability.
 */

import express from 'express';
import { checkAvailability, checkProductAvailability } from '../controllers/inventoryController';

const router = express.Router();

// Check product availability by SKU
router.get('/inventory/availability/:sku', checkAvailability);

// Check product availability by productId
router.get('/inventory/availability/product/:productId', checkProductAvailability);

export const inventoryCustomerRouter = router;
