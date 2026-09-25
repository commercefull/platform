/**
 * Promotion Customer Router
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isCustomerLoggedIn } from '../../../../libs/auth';
import * as giftCardController from '../controllers/giftCardCustomerController';

const router = createHttpRouter();

// Gift Card routes
router.get('/gift-cards/balance/:code', asyncHandler(giftCardController.checkGiftCardBalance));
router.post('/gift-cards/redeem', isCustomerLoggedIn, asyncHandler(giftCardController.redeemGiftCard));
router.get('/gift-cards/mine', isCustomerLoggedIn, asyncHandler(giftCardController.getMyGiftCards));
router.post('/gift-cards/reload', isCustomerLoggedIn, asyncHandler(giftCardController.reloadGiftCard));

export const promotionCustomerRouter = router;
