/**
 * Segment Router
 */

import { Router } from 'express';
import {
  createSegment,
  getSegment,
  updateSegment,
  listSegments,
  evaluateSegment,
  getCustomerSegments,
  deleteSegment,
} from '../controllers/SegmentController';

const router = Router();

router.get('/', listSegments);
router.post('/', createSegment);
router.get('/customer/:customerId', getCustomerSegments);
router.get('/:segmentId', getSegment);
router.put('/:segmentId', updateSegment);
router.patch('/:segmentId', updateSegment);
router.delete('/:segmentId', deleteSegment);
router.post('/:segmentId/evaluate', evaluateSegment);

export const segmentBusinessRouter = router;
export default router;
