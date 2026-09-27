/**
 * Recommendation Customer Router — public placement reads (spec §11.1).
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { optionalCustomerAuth } from '../../../../libs/auth';
import * as controller from '../controllers/RecommendationCustomerController';

const router = createHttpRouter();

router.use(optionalCustomerAuth);

router.get('/recommendation/products/:productId', asyncHandler(controller.getProductRecommendations));
router.post('/recommendation/products', asyncHandler(controller.postProductRecommendations));
router.get('/recommendation/popular', asyncHandler(controller.getPopular));

export const recommendationCustomerRouter = router;
