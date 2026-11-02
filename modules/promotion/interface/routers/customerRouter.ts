/**
 * Promotion Customer Router
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isCustomerLoggedIn } from '../../../../libs/auth';
import {
  checkGiftCardBalance,
  getMyGiftCards,
  redeemGiftCard,
  reloadGiftCard,
} from '../controllers/giftCardCustomerController';
const router = createHttpRouter();

// Gift Card routes
router.get('/gift-cards/balance/:code', asyncHandler(checkGiftCardBalance));
router.post('/gift-cards/redeem', isCustomerLoggedIn, asyncHandler(redeemGiftCard));
router.get('/gift-cards/mine', isCustomerLoggedIn, asyncHandler(getMyGiftCards));
router.post('/gift-cards/reload', isCustomerLoggedIn, asyncHandler(reloadGiftCard));

export const promotionCustomerRouter = router;
