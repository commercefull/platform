/**
 * Brand Customer Router
 *
 * Public-facing routes for browsing brands.
 */

import { Router } from 'express';
import { getBrand, listBrands } from '../controllers/BrandController';

const router = Router();

router.get('/brands', listBrands);
router.get('/brands/:brandId', getBrand);

export const brandCustomerRouter = router;
export default router;
