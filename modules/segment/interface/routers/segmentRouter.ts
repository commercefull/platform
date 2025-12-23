/**
 * Segment Router
 */

import { Router } from 'express';
import {
  createSegment,
  getSegment,
  updateSegment,
  listSegments,
} from '../controllers/SegmentController';

const router = Router();

router.get('/', listSegments);
router.post('/', createSegment);
router.get('/:segmentId', getSegment);
router.put('/:segmentId', updateSegment);
router.patch('/:segmentId', updateSegment);

export default router;
