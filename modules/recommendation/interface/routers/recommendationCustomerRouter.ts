/**
 * Recommendation Customer Router — public placement reads (spec §11.1).
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { optionalCustomerAuth } from '../../../../libs/auth';
import {
  getPopular,
  getProductRecommendations,
  postProductRecommendations,
} from '../controllers/RecommendationCustomerController';
const router = createHttpRouter();

router.use(optionalCustomerAuth);

router.get('/recommendation/products/:productId', asyncHandler(getProductRecommendations));
router.post('/recommendation/products', asyncHandler(postProductRecommendations));
router.get('/recommendation/popular', asyncHandler(getPopular));

export const recommendationCustomerRouter = router;
