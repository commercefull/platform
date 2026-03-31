import { Router } from 'express';
import { assignUserToStore, getUserStores, listStoreUsers, removeUserFromStore } from '../controllers/UserStoreController';

const router = Router();

router.post('/users/:userId/stores', assignUserToStore);
router.get('/users/:userId/stores', getUserStores);
router.get('/stores/:storeId/users', listStoreUsers);
router.delete('/users/:userId/stores/:storeId', removeUserFromStore);

export const userStoreRouter = router;
