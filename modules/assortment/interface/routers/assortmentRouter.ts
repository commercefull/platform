/**
 * Assortment Router
 */

import { Router } from 'express';
import {
  createAssortment,
  getAssortment,
  listAssortments,
  addItem,
  removeItem,
  setScope,
  getVisibleProducts,
} from '../controllers/AssortmentController';

const router = Router();

// List assortments
router.get('/', listAssortments);

// Create assortment
router.post('/', createAssortment);

// Get assortment by ID
router.get('/:assortmentId', getAssortment);

// Add item to assortment
router.post('/:assortmentId/items', addItem);

// Remove item from assortment
router.delete('/:assortmentId/items/:productVariantId', removeItem);

// Set assortment scope
router.post('/:assortmentId/scope', setScope);

// Get visible products for a store
router.get('/store/:storeId/products', getVisibleProducts);

export default router;
