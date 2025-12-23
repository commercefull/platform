/**
 * Channel Router
 */

import { Router } from 'express';
import {
  createChannel,
  getChannel,
  updateChannel,
  listChannels,
  assignProducts,
  assignWarehouse,
} from '../controllers/ChannelController';

const router = Router();

router.get('/', listChannels);
router.post('/', createChannel);
router.get('/:channelId', getChannel);
router.put('/:channelId', updateChannel);
router.patch('/:channelId', updateChannel);
router.post('/:channelId/products', assignProducts);
router.post('/:channelId/warehouse', assignWarehouse);

export const channelBusinessRouter = router;
export default router;
