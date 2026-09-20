import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { assignUserToStore, getUserStores, listStoreUsers, removeUserFromStore } from '../controllers/UserStoreController';

const router = createHttpRouter();

router.post('/auth/users/:userId/stores', asyncHandler(assignUserToStore));
router.get('/auth/users/:userId/stores', asyncHandler(getUserStores));
router.get('/auth/stores/:storeId/users', asyncHandler(listStoreUsers));
router.delete('/auth/users/:userId/stores/:storeId', asyncHandler(removeUserFromStore));

export const userStoreRouter = router;
