/**
 * Search Router
 *
 * Customer routes (public):
 * - GET /search — full-text search with merchandising
 * - GET /search/autocomplete — autocomplete suggestions
 *
 * Business routes (auth required):
 * - GET /search/merchandising — list rules
 * - POST /search/merchandising — create rule
 * - PUT /search/merchandising/:ruleId — update rule
 * - DELETE /search/merchandising/:ruleId — delete rule
 * - GET /search/manual-order/:categoryId — get manual order
 * - PUT /search/manual-order/:categoryId — set manual order
 * - DELETE /search/manual-order/:categoryId — delete manual order
 * - GET /search/health — search backend health
 */

import express from 'express';
import { asyncHandler } from '../asyncHandler';
import { isOrganizationLoggedIn } from '../auth';
import searchController from './searchController';

// Customer router (public)
export const searchCustomerRouter = express.Router();

searchCustomerRouter.get('/search', asyncHandler(searchController.search.bind(searchController)));
searchCustomerRouter.get('/search/autocomplete', asyncHandler(searchController.autocomplete.bind(searchController)));

// Business router (auth required)
export const searchBusinessRouter = express.Router();

searchBusinessRouter.get('/search/health', isOrganizationLoggedIn, asyncHandler(searchController.health.bind(searchController)));

searchBusinessRouter.get('/search/merchandising', isOrganizationLoggedIn, asyncHandler(searchController.listMerchandisingRules.bind(searchController)));
searchBusinessRouter.post('/search/merchandising', isOrganizationLoggedIn, asyncHandler(searchController.createMerchandisingRule.bind(searchController)));
searchBusinessRouter.put('/search/merchandising/:ruleId', isOrganizationLoggedIn, asyncHandler(searchController.updateMerchandisingRule.bind(searchController)));
searchBusinessRouter.delete('/search/merchandising/:ruleId', isOrganizationLoggedIn, asyncHandler(searchController.deleteMerchandisingRule.bind(searchController)));

searchBusinessRouter.get('/search/manual-order/:categoryId', isOrganizationLoggedIn, asyncHandler(searchController.getCategoryManualOrder.bind(searchController)));
searchBusinessRouter.put('/search/manual-order/:categoryId', isOrganizationLoggedIn, asyncHandler(searchController.setCategoryManualOrder.bind(searchController)));
searchBusinessRouter.delete('/search/manual-order/:categoryId', isOrganizationLoggedIn, asyncHandler(searchController.deleteCategoryManualOrder.bind(searchController)));
