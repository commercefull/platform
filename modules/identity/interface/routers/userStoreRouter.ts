import { Router } from 'express';
import { assignUserToStore, getUserStores, listStoreUsers, removeUserFromStore } from '../controllers/UserStoreController';

const router = Router();

router.post('/auth/users/:userId/stores', assignUserToStore);
router.get('/auth/users/:userId/stores', getUserStores);
router.get('/auth/stores/:storeId/users', listStoreUsers);
router.delete('/auth/users/:userId/stores/:storeId', removeUserFromStore);

export const userStoreRouter = router;
