/**
 * Brand Router
 */

import { Router } from 'express';
import {
  createBrand,
  getBrand,
  updateBrand,
  deleteBrand,
  listBrands,
} from '../controllers/BrandController';

const router = Router();

router.get('/', listBrands);
router.post('/', createBrand);
router.get('/:brandId', getBrand);
router.put('/:brandId', updateBrand);
router.patch('/:brandId', updateBrand);
router.delete('/:brandId', deleteBrand);

export const brandBusinessRouter = router;
export default router;
