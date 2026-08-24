# Route Index

> Auto-generated from router source files. Do not edit manually.
> Run `yarn docs:routes` to regenerate.

**Total routes:** 995

## (unmounted)

| Method | Path | Controller | Description |
|---|---|---|---|
| <span class="badge badge-get">GET</span> | `/:fulfillmentId` | `getFulfillment` | Get fulfillment by ID (customer view) |
| <span class="badge badge-get">GET</span> | `/:fulfillmentId/track` | `getTrackingInfo` | Track fulfillment |
| <span class="badge badge-get">GET</span> | `/auth/stores/:storeId/users` | `listStoreUsers` | — |
| <span class="badge badge-post">POST</span> | `/auth/users/:userId/stores` | `assignUserToStore` | — |
| <span class="badge badge-get">GET</span> | `/auth/users/:userId/stores` | `getUserStores` | — |
| <span class="badge badge-delete">DELETE</span> | `/auth/users/:userId/stores/:storeId` | `removeUserFromStore` | — |
| <span class="badge badge-post">POST</span> | `/configuration` | `bind` | Create system configuration |
| <span class="badge badge-get">GET</span> | `/configuration` | `bind` | List all system configurations |
| <span class="badge badge-put">PUT</span> | `/configuration/:configId` | `bind` | Update system configuration |
| <span class="badge badge-get">GET</span> | `/configuration/:configId` | `bind` | Get system configuration by ID |
| <span class="badge badge-get">GET</span> | `/configuration/active` | `bind` | Get active system configuration (must be before /:configId to avoid matching "active" as an ID) |
| <span class="badge badge-post">POST</span> | `/dispatches` | `createStoreDispatch` | — |
| <span class="badge badge-get">GET</span> | `/dispatches` | `listStoreDispatches` | — |
| <span class="badge badge-get">GET</span> | `/dispatches/:dispatchId` | `getStoreDispatch` | — |
| <span class="badge badge-put">PUT</span> | `/dispatches/:dispatchId/approve` | `approveStoreDispatch` | — |
| <span class="badge badge-put">PUT</span> | `/dispatches/:dispatchId/cancel` | `cancelStoreDispatch` | — |
| <span class="badge badge-put">PUT</span> | `/dispatches/:dispatchId/dispatch` | `dispatchFromStore` | — |
| <span class="badge badge-put">PUT</span> | `/dispatches/:dispatchId/receive` | `receiveStoreDispatch` | — |
| <span class="badge badge-get">GET</span> | `/identity/:provider/config` | `getOAuthConfig` | GET /identity/social/:provider/config
Get OAuth configuration for a provider (client ID, auth URL, scopes) |
| <span class="badge badge-post">POST</span> | `/identity/:provider/customer` | `customerSocialLogin` | POST /identity/social/:provider/customer
Authenticate or register a customer via social login
Body: { accessToken, idToken?, profile: { id, email, name?, ... } } |
| <span class="badge badge-post">POST</span> | `/identity/:provider/customer/link` | `linkCustomerSocialAccount` | POST /identity/social/:provider/customer/link
Link a social account to an existing customer (requires auth)
Body: { accessToken, profile: { id, email?, ... } } |
| <span class="badge badge-delete">DELETE</span> | `/identity/:provider/customer/unlink` | `unlinkCustomerSocialAccount` | DELETE /identity/social/:provider/customer/unlink
Unlink a social account from a customer (requires auth) |
| <span class="badge badge-post">POST</span> | `/identity/:provider/merchant` | `merchantSocialLogin` | POST /identity/social/:provider/merchant
Authenticate or register a merchant via social login
Body: { accessToken, idToken?, profile: { id, email, name?, ... } } |
| <span class="badge badge-post">POST</span> | `/identity/:provider/organization` | `merchantSocialLogin` | — |
| <span class="badge badge-get">GET</span> | `/identity/customer/accounts` | `getCustomerLinkedAccounts` | GET /identity/social/customer/accounts
Get all linked social accounts for a customer (requires auth) |
| <span class="badge badge-get">GET</span> | `/identity/merchant/accounts` | `getOrganizationLinkedAccounts` | GET /identity/social/merchant/accounts
Get all linked social accounts for a merchant (requires auth) |
| <span class="badge badge-get">GET</span> | `/identity/organization/accounts` | `getOrganizationLinkedAccounts` | — |
| <span class="badge badge-get">GET</span> | `/me` | `getMyProfile` | Get my profile
GET /customers/me |
| <span class="badge badge-put">PUT</span> | `/me` | `updateMyProfile` | Update my profile
PUT /customers/me |
| <span class="badge badge-get">GET</span> | `/me/addresses` | `getAddresses` | Get my addresses
GET /customers/me/addresses |
| <span class="badge badge-post">POST</span> | `/me/addresses` | `addAddress` | Add a new address
POST /customers/me/addresses |
| <span class="badge badge-put">PUT</span> | `/me/addresses/:addressId` | `updateAddress` | Update an address
PUT /customers/me/addresses/:addressId |
| <span class="badge badge-delete">DELETE</span> | `/me/addresses/:addressId` | `deleteAddress` | Delete an address
DELETE /customers/me/addresses/:addressId |
| <span class="badge badge-post">POST</span> | `/me/addresses/:addressId/default` | `setDefaultAddress` | Set default address
POST /customers/me/addresses/:addressId/default |
| <span class="badge badge-post">POST</span> | `/media/upload` | `uploadSingle` | Upload single image |
| <span class="badge badge-post">POST</span> | `/media/upload/batch` | `uploadMultiple` | Upload multiple images |
| <span class="badge badge-get">GET</span> | `/order/:orderId` | `listFulfillmentsByOrder` | List fulfillments by order (customer view) |
| <span class="badge badge-post">POST</span> | `/register` | `registerCustomer` | Register a new customer
POST /customers/register |
| <span class="badge badge-post">POST</span> | `/stores` | `bind` | Create store |
| <span class="badge badge-get">GET</span> | `/stores` | `bind` | List stores with filtering and pagination |
| <span class="badge badge-get">GET</span> | `/stores/:storeId` | `bind` | Get store by ID |
| <span class="badge badge-put">PUT</span> | `/stores/:storeId` | `bind` | Update store |
| <span class="badge badge-delete">DELETE</span> | `/stores/:storeId` | `bind` | Delete store |
| <span class="badge badge-put">PUT</span> | `/stores/:storeId/local-delivery` | `bind` | Set local delivery zone |
| <span class="badge badge-put">PUT</span> | `/stores/:storeId/pickup` | `bind` | Configure store pickup (BOPIS) |
| <span class="badge badge-get">GET</span> | `/stores/active` | `bind` | Get active stores (must be before :storeId to avoid collision) |
| <span class="badge badge-get">GET</span> | `/stores/business/:organizationId` | `bind` | Get stores by business |
| <span class="badge badge-post">POST</span> | `/stores/hierarchy` | `bind` | Create store hierarchy |
| <span class="badge badge-get">GET</span> | `/stores/slug/:slug` | `bind` | Get store by slug |

## /business

| Method | Path | Controller | Description |
|---|---|---|---|
| <span class="badge badge-get">GET</span> | `/business/analytics/customers/cohorts` | `getCustomerCohorts` | GET /business/analytics/customers/cohorts - Get customer cohort analysis |
| <span class="badge badge-get">GET</span> | `/business/analytics/dashboards` | `getDashboards` | GET /business/analytics/dashboards - List dashboards |
| <span class="badge badge-post">POST</span> | `/business/analytics/dashboards` | `createDashboard` | POST /business/analytics/dashboards - Create dashboard |
| <span class="badge badge-get">GET</span> | `/business/analytics/dashboards/:id` | `getDashboard` | GET /business/analytics/dashboards/:id - Get dashboard |
| <span class="badge badge-put">PUT</span> | `/business/analytics/dashboards/:id` | `updateDashboard` | PUT /business/analytics/dashboards/:id - Update dashboard |
| <span class="badge badge-delete">DELETE</span> | `/business/analytics/dashboards/:id` | `deleteDashboard` | DELETE /business/analytics/dashboards/:id - Delete dashboard |
| <span class="badge badge-get">GET</span> | `/business/analytics/events` | `getEvents` | GET /business/analytics/events - Get tracked events |
| <span class="badge badge-get">GET</span> | `/business/analytics/events/counts` | `getEventCounts` | GET /business/analytics/events/counts - Get event counts by period |
| <span class="badge badge-get">GET</span> | `/business/analytics/products` | `getProductPerformance` | GET /business/analytics/products - Get product performance data |
| <span class="badge badge-get">GET</span> | `/business/analytics/products/top` | `getTopProducts` | GET /business/analytics/products/top - Get top performing products |
| <span class="badge badge-get">GET</span> | `/business/analytics/realtime` | `getRealTimeMetrics` | GET /business/analytics/realtime - Get real-time metrics |
| <span class="badge badge-get">GET</span> | `/business/analytics/sales/daily` | `getSalesDaily` | GET /business/analytics/sales/daily - Get daily sales data |
| <span class="badge badge-get">GET</span> | `/business/analytics/sales/dashboard` | `getSalesDashboard` | GET /business/analytics/sales/dashboard - Get sales dashboard with summary |
| <span class="badge badge-get">GET</span> | `/business/analytics/search` | `getSearchAnalytics` | GET /business/analytics/search - Get search analytics |
| <span class="badge badge-get">GET</span> | `/business/analytics/search/zero-results` | `getZeroResultSearches` | GET /business/analytics/search/zero-results - Get zero result searches |
| <span class="badge badge-get">GET</span> | `/business/analytics/snapshots` | `getSnapshots` | GET /business/analytics/snapshots - Get historical snapshots |
| <span class="badge badge-get">GET</span> | `/business/analytics/snapshots/latest` | `getLatestSnapshot` | GET /business/analytics/snapshots/latest - Get latest snapshot |
| <span class="badge badge-get">GET</span> | `/business/attribute-groups` | `bind` | — |
| <span class="badge badge-post">POST</span> | `/business/attribute-groups` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attribute-groups/:id` | `bind` | — |
| <span class="badge badge-put">PUT</span> | `/business/attribute-groups/:id` | `bind` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/attribute-groups/:id` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attribute-groups/code/:code` | `bind` | — |
| <span class="badge badge-post">POST</span> | `/business/attribute-options` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attribute-options/:id` | `bind` | — |
| <span class="badge badge-put">PUT</span> | `/business/attribute-options/:id` | `bind` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/attribute-options/:id` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attribute-options/attribute/:attributeId` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attribute-options/attribute/:attributeId/value/:value` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attribute-sets` | `bind` | — |
| <span class="badge badge-post">POST</span> | `/business/attribute-sets` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attribute-sets/:id` | `bind` | — |
| <span class="badge badge-put">PUT</span> | `/business/attribute-sets/:id` | `bind` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/attribute-sets/:id` | `bind` | — |
| <span class="badge badge-post">POST</span> | `/business/attribute-sets/:id/attributes` | `bind` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/attribute-sets/:id/attributes/:attributeId` | `bind` | — |
| <span class="badge badge-post">POST</span> | `/business/attribute-sets/:id/attributes/reorder` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attributes` | `isOrganizationLoggedIn` | List all attributes |
| <span class="badge badge-post">POST</span> | `/business/attributes` | `isOrganizationLoggedIn` | Create attribute |
| <span class="badge badge-get">GET</span> | `/business/attributes` | `bind` | — |
| <span class="badge badge-post">POST</span> | `/business/attributes` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attributes/:id` | `isOrganizationLoggedIn` | Get attribute by ID |
| <span class="badge badge-put">PUT</span> | `/business/attributes/:id` | `isOrganizationLoggedIn` | Update attribute |
| <span class="badge badge-delete">DELETE</span> | `/business/attributes/:id` | `isOrganizationLoggedIn` | Delete attribute |
| <span class="badge badge-get">GET</span> | `/business/attributes/:id` | `bind` | — |
| <span class="badge badge-put">PUT</span> | `/business/attributes/:id` | `bind` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/attributes/:id` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attributes/:id/values` | `isOrganizationLoggedIn` | Get attribute values |
| <span class="badge badge-post">POST</span> | `/business/attributes/:id/values` | `isOrganizationLoggedIn` | Add attribute value |
| <span class="badge badge-get">GET</span> | `/business/attributes/:id/values` | `bind` | Attribute Values |
| <span class="badge badge-post">POST</span> | `/business/attributes/:id/values` | `bind` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/attributes/:id/values/:valueId` | `isOrganizationLoggedIn` | Remove attribute value |
| <span class="badge badge-delete">DELETE</span> | `/business/attributes/:id/values/:valueId` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attributes/code/:code` | `isOrganizationLoggedIn` | Get attribute by code |
| <span class="badge badge-get">GET</span> | `/business/attributes/code/:code` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/attributes/group/:groupId` | `bind` | — |
| <span class="badge badge-post">POST</span> | `/business/auth/cleanup-tokens` | `cleanupExpiredTokens` | — |
| <span class="badge badge-post">POST</span> | `/business/auth/force-reset` | `forceResetPassword` | — |
| <span class="badge badge-post">POST</span> | `/business/auth/forgot-password` | `requestPasswordReset` | Password reset flow |
| <span class="badge badge-post">POST</span> | `/business/auth/login` | `loginOrganization` | Simple login (returns access token only) |
| <span class="badge badge-post">POST</span> | `/business/auth/refresh` | `renewAccessToken` | Refresh access token |
| <span class="badge badge-post">POST</span> | `/business/auth/register` | `registerOrganization` | Register new merchant account |
| <span class="badge badge-post">POST</span> | `/business/auth/reset-password` | `resetPassword` | — |
| <span class="badge badge-post">POST</span> | `/business/auth/revoke-tokens` | `revokeUserTokens` | — |
| <span class="badge badge-post">POST</span> | `/business/auth/token` | `issueTokenPair` | Token-based auth (returns access + refresh tokens) |
| <span class="badge badge-get">GET</span> | `/business/auth/user/:userId` | `getUserAuthDetails` | — |
| <span class="badge badge-post">POST</span> | `/business/auth/validate` | `checkTokenValidity` | Validate token |
| <span class="badge badge-get">GET</span> | `/business/basket` | `listBaskets` | List/search baskets (admin) |
| <span class="badge badge-get">GET</span> | `/business/basket/:basketId` | `getBasket` | Get basket by ID |
| <span class="badge badge-delete">DELETE</span> | `/business/basket/:basketId` | `deleteBasket` | Delete basket |
| <span class="badge badge-post">POST</span> | `/business/basket/:basketId/assign` | `assignToCustomer` | Assign basket to customer |
| <span class="badge badge-post">POST</span> | `/business/basket/:basketId/coupon` | `applyCouponAdmin` | Apply coupon (admin override) |
| <span class="badge badge-delete">DELETE</span> | `/business/basket/:basketId/coupon` | `removeCoupon` | Remove coupon |
| <span class="badge badge-put">PUT</span> | `/business/basket/:basketId/expiration` | `extendExpiration` | Extend expiration |
| <span class="badge badge-get">GET</span> | `/business/basket/:basketId/summary` | `getBasketSummary` | Get basket summary |
| <span class="badge badge-get">GET</span> | `/business/bundles` | `getBundles` | — |
| <span class="badge badge-post">POST</span> | `/business/bundles` | `createBundle` | — |
| <span class="badge badge-get">GET</span> | `/business/bundles/:id` | `getBundle` | — |
| <span class="badge badge-put">PUT</span> | `/business/bundles/:id` | `updateBundle` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/bundles/:id` | `deleteBundle` | — |
| <span class="badge badge-post">POST</span> | `/business/bundles/:id/items` | `addBundleItem` | — |
| <span class="badge badge-put">PUT</span> | `/business/bundles/:id/items/:itemId` | `updateBundleItem` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/bundles/:id/items/:itemId` | `deleteBundleItem` | — |
| <span class="badge badge-post">POST</span> | `/business/calculate-rates` | `calculateRates` | — |
| <span class="badge badge-get">GET</span> | `/business/carriers` | `getCarriers` | — |
| <span class="badge badge-post">POST</span> | `/business/carriers` | `createCarrier` | — |
| <span class="badge badge-get">GET</span> | `/business/carriers/:id` | `getCarrierById` | — |
| <span class="badge badge-put">PUT</span> | `/business/carriers/:id` | `updateCarrier` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/carriers/:id` | `deleteCarrier` | — |
| <span class="badge badge-post">POST</span> | `/business/cart-promotions` | `applyPromotion` | — |
| <span class="badge badge-get">GET</span> | `/business/cart-promotions/:id` | `getCartPromotionById` | Cart Promotion routes |
| <span class="badge badge-put">PUT</span> | `/business/cart-promotions/:id` | `updateCartPromotion` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/cart-promotions/:id` | `removePromotion` | — |
| <span class="badge badge-get">GET</span> | `/business/cart-promotions/cart/:cartId` | `getPromotionsByCartId` | — |
| <span class="badge badge-get">GET</span> | `/business/categories` | `listCategories` | — |
| <span class="badge badge-post">POST</span> | `/business/categories` | `createCategory` | — |
| <span class="badge badge-get">GET</span> | `/business/categories/:id` | `getCategory` | — |
| <span class="badge badge-put">PUT</span> | `/business/categories/:id` | `updateCategory` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/categories/:id` | `deleteCategory` | — |
| <span class="badge badge-get">GET</span> | `/business/categories/:id/children` | `getCategoryChildren` | — |
| <span class="badge badge-get">GET</span> | `/business/categories/root` | `getRootCategories` | — |
| <span class="badge badge-get">GET</span> | `/business/categories/slug/:slug` | `getCategoryBySlug` | — |
| <span class="badge badge-post">POST</span> | `/business/category-promotions` | `createCategoryPromotion` | — |
| <span class="badge badge-get">GET</span> | `/business/category-promotions/:id` | `getCategoryPromotionById` | — |
| <span class="badge badge-put">PUT</span> | `/business/category-promotions/:id` | `updateCategoryPromotion` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/category-promotions/:id` | `deleteCategoryPromotion` | — |
| <span class="badge badge-get">GET</span> | `/business/category-promotions/active` | `getActiveCategoryPromotions` | Category Promotion routes |
| <span class="badge badge-get">GET</span> | `/business/category-promotions/category/:categoryId` | `getPromotionsByCategoryId` | — |
| <span class="badge badge-get">GET</span> | `/business/collections` | `listCollections` | — |
| <span class="badge badge-post">POST</span> | `/business/collections` | `createCollection` | — |
| <span class="badge badge-put">PUT</span> | `/business/collections/:collectionId` | `updateCollection` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/collections/:collectionId` | `deleteCollection` | — |
| <span class="badge badge-post">POST</span> | `/business/content/blocks` | `createBlock` | — |
| <span class="badge badge-get">GET</span> | `/business/content/blocks/:id` | `getBlockById` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/blocks/:id` | `updateBlock` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/blocks/:id` | `deleteBlock` | — |
| <span class="badge badge-get">GET</span> | `/business/content/categories` | `getCategories` | Content Category routes |
| <span class="badge badge-post">POST</span> | `/business/content/categories` | `createCategory` | — |
| <span class="badge badge-get">GET</span> | `/business/content/categories/:categoryId/pages` | `getPagesByCategory` | — |
| <span class="badge badge-get">GET</span> | `/business/content/categories/:id` | `getCategoryById` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/categories/:id` | `updateCategory` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/categories/:id` | `deleteCategory` | — |
| <span class="badge badge-post">POST</span> | `/business/content/categories/:id/move` | `moveCategory` | — |
| <span class="badge badge-get">GET</span> | `/business/content/categories/tree` | `getCategoryTree` | — |
| <span class="badge badge-get">GET</span> | `/business/content/media` | `getMedia` | Content Media routes |
| <span class="badge badge-post">POST</span> | `/business/content/media` | `uploadMedia` | — |
| <span class="badge badge-get">GET</span> | `/business/content/media-folders` | `getMediaFolders` | Media Folder routes |
| <span class="badge badge-post">POST</span> | `/business/content/media-folders` | `createMediaFolder` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/media-folders/:id` | `updateMediaFolder` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/media-folders/:id` | `deleteMediaFolder` | — |
| <span class="badge badge-get">GET</span> | `/business/content/media-folders/tree` | `getMediaFolderTree` | — |
| <span class="badge badge-get">GET</span> | `/business/content/media/:id` | `getMediaById` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/media/:id` | `updateMedia` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/media/:id` | `deleteMedia` | — |
| <span class="badge badge-get">GET</span> | `/business/content/media/:mediaId/usage` | `getMediaUsage` | Media Usage routes |
| <span class="badge badge-get">GET</span> | `/business/content/media/:mediaId/usage/count` | `getMediaUsageCount` | — |
| <span class="badge badge-post">POST</span> | `/business/content/media/move` | `moveMediaToFolder` | — |
| <span class="badge badge-post">POST</span> | `/business/content/media/usage` | `trackMediaUsage` | — |
| <span class="badge badge-get">GET</span> | `/business/content/media/usage/:entityType/:entityId` | `getMediaUsageByEntity` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/media/usage/:usageId` | `untrackMediaUsage` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/navigation-items/:id` | `updateNavigationItem` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/navigation-items/:id` | `deleteNavigationItem` | — |
| <span class="badge badge-get">GET</span> | `/business/content/navigations` | `getNavigations` | Content Navigation routes |
| <span class="badge badge-post">POST</span> | `/business/content/navigations` | `createNavigation` | — |
| <span class="badge badge-get">GET</span> | `/business/content/navigations/:id` | `getNavigationById` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/navigations/:id` | `updateNavigation` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/navigations/:id` | `deleteNavigation` | — |
| <span class="badge badge-get">GET</span> | `/business/content/navigations/:id/items` | `getNavigationWithItems` | — |
| <span class="badge badge-post">POST</span> | `/business/content/navigations/:navigationId/items` | `addNavigationItem` | Navigation Item routes |
| <span class="badge badge-post">POST</span> | `/business/content/navigations/:navigationId/items/reorder` | `reorderNavigationItems` | — |
| <span class="badge badge-get">GET</span> | `/business/content/pages` | `getPages` | Content Page routes |
| <span class="badge badge-post">POST</span> | `/business/content/pages` | `createPage` | — |
| <span class="badge badge-get">GET</span> | `/business/content/pages/:id` | `getPageById` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/pages/:id` | `updatePage` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/pages/:id` | `deletePage` | — |
| <span class="badge badge-post">POST</span> | `/business/content/pages/:id/duplicate` | `duplicatePage` | — |
| <span class="badge badge-get">GET</span> | `/business/content/pages/:id/full` | `getFullPageById` | — |
| <span class="badge badge-post">POST</span> | `/business/content/pages/:id/publish` | `publishPage` | Page Actions routes |
| <span class="badge badge-post">POST</span> | `/business/content/pages/:id/schedule` | `schedulePage` | — |
| <span class="badge badge-post">POST</span> | `/business/content/pages/:id/unpublish` | `unpublishPage` | — |
| <span class="badge badge-get">GET</span> | `/business/content/pages/:pageId/blocks` | `getPageBlocks` | Content Block routes |
| <span class="badge badge-post">POST</span> | `/business/content/pages/:pageId/blocks/reorder` | `reorderBlocks` | — |
| <span class="badge badge-get">GET</span> | `/business/content/pages/:pageId/categories` | `getPageCategories` | Categorization routes |
| <span class="badge badge-post">POST</span> | `/business/content/pages/:pageId/categories` | `assignPageToCategory` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/pages/:pageId/categories/:categoryId` | `removePageFromCategory` | — |
| <span class="badge badge-post">POST</span> | `/business/content/pages/:pageId/categories/primary` | `setPrimaryCategory` | — |
| <span class="badge badge-get">GET</span> | `/business/content/pages/:pageId/translations` | `getPageTranslations` | Page Translation routes |
| <span class="badge badge-post">POST</span> | `/business/content/pages/:pageId/translations` | `createPageTranslation` | — |
| <span class="badge badge-get">GET</span> | `/business/content/pages/:pageId/translations/:localeId` | `getPageTranslationByLocale` | — |
| <span class="badge badge-get">GET</span> | `/business/content/pages/:pageId/versions` | `getPageVersions` | Page Version routes |
| <span class="badge badge-post">POST</span> | `/business/content/pages/:pageId/versions` | `createPageVersion` | — |
| <span class="badge badge-post">POST</span> | `/business/content/pages/:pageId/versions/:versionId/restore` | `restorePageVersion` | — |
| <span class="badge badge-get">GET</span> | `/business/content/redirects` | `getRedirects` | Content Redirect routes |
| <span class="badge badge-post">POST</span> | `/business/content/redirects` | `createRedirect` | — |
| <span class="badge badge-get">GET</span> | `/business/content/redirects/:id` | `getRedirectById` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/redirects/:id` | `updateRedirect` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/redirects/:id` | `deleteRedirect` | — |
| <span class="badge badge-get">GET</span> | `/business/content/templates` | `getTemplates` | Content Template routes |
| <span class="badge badge-post">POST</span> | `/business/content/templates` | `createTemplate` | — |
| <span class="badge badge-get">GET</span> | `/business/content/templates/:id` | `getTemplateById` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/templates/:id` | `updateTemplate` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/templates/:id` | `deleteTemplate` | — |
| <span class="badge badge-post">POST</span> | `/business/content/templates/:id/duplicate` | `duplicateTemplate` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/translations/:translationId` | `updatePageTranslation` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/translations/:translationId` | `deletePageTranslation` | — |
| <span class="badge badge-get">GET</span> | `/business/content/types` | `getContentTypes` | Content Type routes |
| <span class="badge badge-post">POST</span> | `/business/content/types` | `createContentType` | — |
| <span class="badge badge-get">GET</span> | `/business/content/types/:id` | `getContentTypeById` | — |
| <span class="badge badge-put">PUT</span> | `/business/content/types/:id` | `updateContentType` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/types/:id` | `deleteContentType` | — |
| <span class="badge badge-get">GET</span> | `/business/content/types/slug/:slug` | `getContentTypeBySlug` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/content/versions/:versionId` | `deletePageVersion` | — |
| <span class="badge badge-get">GET</span> | `/business/countries` | `getCountries` | Country CRUD |
| <span class="badge badge-post">POST</span> | `/business/countries` | `createCountry` | — |
| <span class="badge badge-get">GET</span> | `/business/countries/:id` | `getCountryById` | — |
| <span class="badge badge-put">PUT</span> | `/business/countries/:id` | `updateCountry` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/countries/:id` | `deleteCountry` | — |
| <span class="badge badge-post">POST</span> | `/business/countries/:id/activate` | `activateCountry` | Country status management |
| <span class="badge badge-post">POST</span> | `/business/countries/:id/deactivate` | `deactivateCountry` | — |
| <span class="badge badge-get">GET</span> | `/business/countries/code/:code` | `getCountryByCode` | — |
| <span class="badge badge-get">GET</span> | `/business/countries/region/:region` | `getCountriesByRegion` | — |
| <span class="badge badge-get">GET</span> | `/business/coupons` | `listCoupons` | — |
| <span class="badge badge-post">POST</span> | `/business/coupons` | `createCoupon` | — |
| <span class="badge badge-get">GET</span> | `/business/coupons` | `getActiveCoupons` | Coupon routes |
| <span class="badge badge-post">POST</span> | `/business/coupons` | `createCoupon` | — |
| <span class="badge badge-get">GET</span> | `/business/coupons/:couponId` | `getCoupon` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/coupons/:couponId` | `deleteCoupon` | — |
| <span class="badge badge-get">GET</span> | `/business/coupons/:id` | `getCouponById` | — |
| <span class="badge badge-put">PUT</span> | `/business/coupons/:id` | `updateCoupon` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/coupons/:id` | `deleteCoupon` | — |
| <span class="badge badge-get">GET</span> | `/business/coupons/:id/usage` | `getCouponUsage` | — |
| <span class="badge badge-post">POST</span> | `/business/coupons/apply` | `applyCoupon` | — |
| <span class="badge badge-post">POST</span> | `/business/coupons/calculate` | `calculateCouponDiscount` | — |
| <span class="badge badge-get">GET</span> | `/business/coupons/code/:code` | `getCouponByCode` | — |
| <span class="badge badge-post">POST</span> | `/business/coupons/redeem` | `redeemCoupon` | — |
| <span class="badge badge-post">POST</span> | `/business/coupons/validate` | `validateCoupon` | — |
| <span class="badge badge-post">POST</span> | `/business/coupons/validate` | `validateCoupon` | — |
| <span class="badge badge-get">GET</span> | `/business/coupons/validate/:code` | `validateCoupon` | — |
| <span class="badge badge-get">GET</span> | `/business/customers` | `listCustomers` | List all customers
GET /business/customers |
| <span class="badge badge-post">POST</span> | `/business/customers` | `createCustomer` | Create a new customer
POST /business/customers |
| <span class="badge badge-get">GET</span> | `/business/customers/:customerId` | `getCustomer` | Get customer by ID
GET /business/customers/:customerId |
| <span class="badge badge-put">PUT</span> | `/business/customers/:customerId` | `updateCustomer` | Update customer
PUT /business/customers/:customerId |
| <span class="badge badge-delete">DELETE</span> | `/business/customers/:customerId` | `deleteCustomer` | Delete customer
DELETE /business/customers/:customerId |
| <span class="badge badge-get">GET</span> | `/business/customers/:customerId/addresses` | `getCustomerAddresses` | Get customer addresses
GET /business/customers/:customerId/addresses |
| <span class="badge badge-post">POST</span> | `/business/customers/:customerId/addresses` | `addCustomerAddress` | Add customer address
POST /business/customers/:customerId/addresses |
| <span class="badge badge-post">POST</span> | `/business/customers/:customerId/deactivate` | `deactivateCustomer` | Deactivate customer
POST /business/customers/:customerId/deactivate |
| <span class="badge badge-post">POST</span> | `/business/customers/:customerId/reactivate` | `reactivateCustomer` | Reactivate customer
POST /business/customers/:customerId/reactivate |
| <span class="badge badge-post">POST</span> | `/business/customers/:customerId/verify` | `verifyCustomer` | Verify customer
POST /business/customers/:customerId/verify |
| <span class="badge badge-get">GET</span> | `/business/discounts` | `getActiveDiscounts` | Discount routes |
| <span class="badge badge-post">POST</span> | `/business/discounts` | `createDiscount` | — |
| <span class="badge badge-get">GET</span> | `/business/discounts/:id` | `getDiscountById` | — |
| <span class="badge badge-put">PUT</span> | `/business/discounts/:id` | `updateDiscount` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/discounts/:id` | `deleteDiscount` | — |
| <span class="badge badge-get">GET</span> | `/business/discounts/category/:categoryId` | `getDiscountsByCategoryId` | — |
| <span class="badge badge-get">GET</span> | `/business/discounts/product/:productId` | `getDiscountsByProductId` | — |
| <span class="badge badge-put">PUT</span> | `/business/downloads/:downloadId` | `updateDownload` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/downloads/:downloadId` | `deleteDownload` | — |
| <span class="badge badge-get">GET</span> | `/business/fraud/blacklist` | `getBlacklist` | — |
| <span class="badge badge-post">POST</span> | `/business/fraud/blacklist` | `addToBlacklist` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/fraud/blacklist/:id` | `removeFromBlacklist` | — |
| <span class="badge badge-get">GET</span> | `/business/fraud/checks` | `getFraudChecks` | — |
| <span class="badge badge-get">GET</span> | `/business/fraud/checks/:id` | `getFraudCheck` | — |
| <span class="badge badge-post">POST</span> | `/business/fraud/checks/:id/review` | `reviewFraudCheck` | — |
| <span class="badge badge-get">GET</span> | `/business/fraud/reviews` | `getPendingReviews` | — |
| <span class="badge badge-get">GET</span> | `/business/fraud/rules` | `getFraudRules` | Fraud Prevention routes |
| <span class="badge badge-post">POST</span> | `/business/fraud/rules` | `createFraudRule` | — |
| <span class="badge badge-get">GET</span> | `/business/fraud/rules/:id` | `getFraudRule` | — |
| <span class="badge badge-put">PUT</span> | `/business/fraud/rules/:id` | `updateFraudRule` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/fraud/rules/:id` | `deleteFraudRule` | — |
| <span class="badge badge-get">GET</span> | `/business/fulfillment/locations` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/business/fulfillment/locations` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/business/fulfillment/locations/:locationId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/business/fulfillment/locations/:locationId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/fulfillment/locations/:locationId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/business/fulfillment/locations/:locationId/activate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/business/fulfillment/locations/:locationId/deactivate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/business/fulfillment/locations/nearest` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/business/fulfillment/partners` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/business/fulfillment/partners` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/business/fulfillment/partners/:partnerId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/business/fulfillment/partners/:partnerId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/fulfillment/partners/:partnerId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/business/fulfillments` | `listFulfillments` | List all fulfillments (with filters/pagination) |
| <span class="badge badge-post">POST</span> | `/business/fulfillments` | `createFulfillment` | Create fulfillment |
| <span class="badge badge-get">GET</span> | `/business/fulfillments/:fulfillmentId` | `getFulfillment` | Get fulfillment by ID |
| <span class="badge badge-post">POST</span> | `/business/fulfillments/:fulfillmentId/assign` | `assignFulfillment` | Assign fulfillment |
| <span class="badge badge-post">POST</span> | `/business/fulfillments/:fulfillmentId/cancel` | `cancelFulfillment` | Cancel fulfillment |
| <span class="badge badge-post">POST</span> | `/business/fulfillments/:fulfillmentId/deliver` | `markDelivered` | Mark delivered |
| <span class="badge badge-post">POST</span> | `/business/fulfillments/:fulfillmentId/pack` | `processPacking` | Process packing |
| <span class="badge badge-post">POST</span> | `/business/fulfillments/:fulfillmentId/pick` | `processPicking` | Process picking |
| <span class="badge badge-post">POST</span> | `/business/fulfillments/:fulfillmentId/return` | `initiateReturn` | Initiate return |
| <span class="badge badge-post">POST</span> | `/business/fulfillments/:fulfillmentId/ship` | `shipOrder` | Ship order |
| <span class="badge badge-put">PUT</span> | `/business/fulfillments/:fulfillmentId/tracking` | `updateTracking` | Update tracking info |
| <span class="badge badge-get">GET</span> | `/business/fulfillments/order/:orderId` | `listFulfillmentsByOrder` | List by order |
| <span class="badge badge-get">GET</span> | `/business/gateways` | `listGateways` | ============================================================================ Gateway Routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/gateways` | `createGateway` | — |
| <span class="badge badge-get">GET</span> | `/business/gateways/:gatewayId` | `getGateway` | — |
| <span class="badge badge-put">PUT</span> | `/business/gateways/:gatewayId` | `updateGateway` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/gateways/:gatewayId` | `deleteGateway` | — |
| <span class="badge badge-get">GET</span> | `/business/gdpr/cookies/statistics` | `getCookieConsentStatistics` | Get cookie consent statistics |
| <span class="badge badge-get">GET</span> | `/business/gdpr/requests` | `listDataRequests` | List all GDPR requests |
| <span class="badge badge-get">GET</span> | `/business/gdpr/requests/:gdprDataRequestId` | `getDataRequest` | Get a specific request |
| <span class="badge badge-post">POST</span> | `/business/gdpr/requests/:gdprDataRequestId/delete` | `processDeletionRequest` | Process deletion request |
| <span class="badge badge-post">POST</span> | `/business/gdpr/requests/:gdprDataRequestId/export` | `processExportRequest` | Process export request |
| <span class="badge badge-post">POST</span> | `/business/gdpr/requests/:gdprDataRequestId/reject` | `rejectRequest` | Reject a request |
| <span class="badge badge-post">POST</span> | `/business/gdpr/requests/:gdprDataRequestId/verify` | `verifyIdentity` | Verify customer identity |
| <span class="badge badge-get">GET</span> | `/business/gdpr/requests/overdue` | `getOverdueRequests` | Get overdue requests |
| <span class="badge badge-get">GET</span> | `/business/gdpr/statistics` | `getGdprStatistics` | Get GDPR statistics |
| <span class="badge badge-get">GET</span> | `/business/gift-cards` | `getGiftCards` | Gift Card routes |
| <span class="badge badge-post">POST</span> | `/business/gift-cards` | `createGiftCard` | — |
| <span class="badge badge-get">GET</span> | `/business/gift-cards/:id` | `getGiftCard` | — |
| <span class="badge badge-post">POST</span> | `/business/gift-cards/:id/activate` | `activateGiftCard` | — |
| <span class="badge badge-post">POST</span> | `/business/gift-cards/:id/cancel` | `cancelGiftCard` | — |
| <span class="badge badge-post">POST</span> | `/business/gift-cards/:id/refund` | `refundToGiftCard` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory` | `listInventory` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory/:inventoryId` | `getInventory` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/:inventoryId/adjust` | `adjustStock` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/:inventoryId/reserve` | `reserveStock` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/:inventoryId/restock` | `restockInventory` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/items` | `createInventoryItem` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory/items` | `listInventoryItems` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory/items/lookup` | `getInventoryItem` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory/locations` | `listInventoryLocations` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/locations` | `createInventoryLocation` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory/locations/:inventoryLocationId` | `getInventoryLocation` | — |
| <span class="badge badge-put">PUT</span> | `/business/inventory/locations/:inventoryLocationId` | `updateInventoryLocation` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/inventory/locations/:inventoryLocationId` | `deleteInventoryLocation` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/locations/:inventoryLocationId/adjust` | `adjustStock` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/locations/:inventoryLocationId/release` | `releaseReservation` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/locations/:inventoryLocationId/reserve` | `reserveStock` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory/locations/low-stock` | `getLowStock` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory/locations/out-of-stock` | `getOutOfStock` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory/low-stock` | `getLowStock` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/pools` | `createInventoryPool` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/pools/allocate` | `allocateFromPool` | — |
| <span class="badge badge-put">PUT</span> | `/business/inventory/products/:productId/threshold` | `setLowStockThreshold` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/reservations/:reservationId/confirm` | `confirmReservation` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory/transactions/product/:productId` | `getTransactionHistory` | — |
| <span class="badge badge-get">GET</span> | `/business/inventory/transactions/types` | `getTransactionTypes` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/transfer` | `transferStock` | — |
| <span class="badge badge-post">POST</span> | `/business/inventory/transfer-between-stores` | `transferBetweenStores` | — |
| <span class="badge badge-post">POST</span> | `/business/labels` | `createLabel` | — |
| <span class="badge badge-get">GET</span> | `/business/labels/:id` | `getLabel` | — |
| <span class="badge badge-post">POST</span> | `/business/labels/:id/void` | `voidLabel` | — |
| <span class="badge badge-get">GET</span> | `/business/labels/order/:orderId` | `getLabelsByOrder` | — |
| <span class="badge badge-get">GET</span> | `/business/locales` | `getLocales` | Locale CRUD |
| <span class="badge badge-post">POST</span> | `/business/locales` | `createLocale` | — |
| <span class="badge badge-get">GET</span> | `/business/locales/:id` | `getLocaleById` | — |
| <span class="badge badge-put">PUT</span> | `/business/locales/:id` | `updateLocale` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/locales/:id` | `deleteLocale` | — |
| <span class="badge badge-post">POST</span> | `/business/locales/:id/activate` | `activateLocale` | — |
| <span class="badge badge-post">POST</span> | `/business/locales/:id/deactivate` | `deactivateLocale` | — |
| <span class="badge badge-post">POST</span> | `/business/locales/:id/default` | `setDefaultLocale` | Locale status management |
| <span class="badge badge-get">GET</span> | `/business/locales/code/:code` | `getLocaleByCode` | — |
| <span class="badge badge-get">GET</span> | `/business/locales/country/:countryCode` | `getLocalesByCountry` | — |
| <span class="badge badge-get">GET</span> | `/business/locales/default` | `getDefaultLocale` | — |
| <span class="badge badge-get">GET</span> | `/business/locales/language/:language` | `getLocalesByLanguage` | — |
| <span class="badge badge-get">GET</span> | `/business/locales/statistics` | `getLocaleStatistics` | — |
| <span class="badge badge-get">GET</span> | `/business/loyalty/customers/:customerId/points` | `getCustomerPoints` | Customer Management |
| <span class="badge badge-post">POST</span> | `/business/loyalty/customers/:customerId/points/adjust` | `adjustCustomerPoints` | — |
| <span class="badge badge-get">GET</span> | `/business/loyalty/customers/:customerId/redemptions` | `getCustomerRedemptions` | — |
| <span class="badge badge-get">GET</span> | `/business/loyalty/customers/:customerId/transactions` | `getCustomerPointsTransactions` | — |
| <span class="badge badge-post">POST</span> | `/business/loyalty/orders/:orderId/points` | `processOrderPoints` | Order Processing |
| <span class="badge badge-put">PUT</span> | `/business/loyalty/redemptions/:id/status` | `updateRedemptionStatus` | Redemption Management |
| <span class="badge badge-get">GET</span> | `/business/loyalty/rewards` | `getRewards` | Reward Management |
| <span class="badge badge-post">POST</span> | `/business/loyalty/rewards` | `createReward` | — |
| <span class="badge badge-get">GET</span> | `/business/loyalty/rewards/:id` | `getRewardById` | — |
| <span class="badge badge-put">PUT</span> | `/business/loyalty/rewards/:id` | `updateReward` | — |
| <span class="badge badge-get">GET</span> | `/business/loyalty/tiers` | `getTiers` | Tier Management |
| <span class="badge badge-post">POST</span> | `/business/loyalty/tiers` | `createTier` | — |
| <span class="badge badge-get">GET</span> | `/business/loyalty/tiers/:id` | `getTierById` | — |
| <span class="badge badge-put">PUT</span> | `/business/loyalty/tiers/:id` | `updateTier` | — |
| <span class="badge badge-get">GET</span> | `/business/membership/benefits` | `getMembershipBenefits` | Admin routes for membership benefit management |
| <span class="badge badge-post">POST</span> | `/business/membership/benefits` | `createMembershipBenefit` | — |
| <span class="badge badge-get">GET</span> | `/business/membership/benefits/:id` | `getMembershipBenefitById` | — |
| <span class="badge badge-put">PUT</span> | `/business/membership/benefits/:id` | `updateMembershipBenefit` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/membership/benefits/:id` | `deleteMembershipBenefit` | — |
| <span class="badge badge-get">GET</span> | `/business/membership/tiers` | `getMembershipTiers` | Admin routes for membership tier management |
| <span class="badge badge-post">POST</span> | `/business/membership/tiers` | `createMembershipTier` | — |
| <span class="badge badge-get">GET</span> | `/business/membership/tiers/:id` | `getMembershipTierById` | — |
| <span class="badge badge-put">PUT</span> | `/business/membership/tiers/:id` | `updateMembershipTier` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/membership/tiers/:id` | `deleteMembershipTier` | — |
| <span class="badge badge-get">GET</span> | `/business/membership/user-memberships` | `getUserMemberships` | Admin routes for user membership management |
| <span class="badge badge-post">POST</span> | `/business/membership/user-memberships` | `createUserMembership` | — |
| <span class="badge badge-get">GET</span> | `/business/membership/user-memberships/:id` | `getUserMembershipById` | — |
| <span class="badge badge-put">PUT</span> | `/business/membership/user-memberships/:id` | `updateUserMembership` | — |
| <span class="badge badge-post">POST</span> | `/business/membership/user-memberships/:id/cancel` | `cancelUserMembership` | — |
| <span class="badge badge-get">GET</span> | `/business/membership/users/:userId/benefits` | `getUserMembershipBenefits` | — |
| <span class="badge badge-get">GET</span> | `/business/membership/users/:userId/membership` | `getUserMembershipByUserId` | Admin routes for fetching user-specific membership data |
| <span class="badge badge-get">GET</span> | `/business/method-configs` | `listMethodConfigs` | ============================================================================ Method Config Routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/method-configs` | `createMethodConfig` | — |
| <span class="badge badge-get">GET</span> | `/business/method-configs/:methodConfigId` | `getMethodConfig` | — |
| <span class="badge badge-put">PUT</span> | `/business/method-configs/:methodConfigId` | `updateMethodConfig` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/method-configs/:methodConfigId` | `deleteMethodConfig` | — |
| <span class="badge badge-get">GET</span> | `/business/methods` | `getMethods` | — |
| <span class="badge badge-post">POST</span> | `/business/methods` | `createMethod` | — |
| <span class="badge badge-get">GET</span> | `/business/methods/:id` | `getMethodById` | — |
| <span class="badge badge-put">PUT</span> | `/business/methods/:id` | `updateMethod` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/methods/:id` | `deleteMethod` | — |
| <span class="badge badge-get">GET</span> | `/business/notification-preferences` | `getAllPreferences` | ============================================================================ Admin preference routes ============================================================================ |
| <span class="badge badge-put">PUT</span> | `/business/notification-preferences/:id` | `updatePreferenceAdmin` | — |
| <span class="badge badge-get">GET</span> | `/business/notification-preferences/user/:userId` | `getPreferencesByUser` | — |
| <span class="badge badge-get">GET</span> | `/business/notification-templates` | `getAllTemplates` | ============================================================================ Template routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/notification-templates` | `createTemplate` | — |
| <span class="badge badge-get">GET</span> | `/business/notification-templates/:id` | `getTemplateById` | — |
| <span class="badge badge-put">PUT</span> | `/business/notification-templates/:id` | `updateTemplate` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/notification-templates/:id` | `deleteTemplate` | — |
| <span class="badge badge-post">POST</span> | `/business/notification-templates/:id/preview` | `previewTemplate` | — |
| <span class="badge badge-get">GET</span> | `/business/notification-templates/type/:type` | `getTemplatesByType` | — |
| <span class="badge badge-get">GET</span> | `/business/notifications` | `getAllNotifications` | ============================================================================ Admin CRUD routes for notifications ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/notifications` | `createNotification` | — |
| <span class="badge badge-get">GET</span> | `/business/notifications/:id` | `getNotificationById` | — |
| <span class="badge badge-put">PUT</span> | `/business/notifications/:id` | `updateNotification` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/notifications/:id` | `deleteNotification` | — |
| <span class="badge badge-put">PUT</span> | `/business/notifications/:id/read` | `markNotificationAsRead` | — |
| <span class="badge badge-post">POST</span> | `/business/notifications/:id/send` | `markNotificationAsSent` | — |
| <span class="badge badge-get">GET</span> | `/business/notifications/batches` | `listBatches` | ============================================================================ Batch routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/notifications/batches` | `sendBatch` | — |
| <span class="badge badge-get">GET</span> | `/business/notifications/batches/:batchId` | `getBatch` | — |
| <span class="badge badge-get">GET</span> | `/business/notifications/count` | `getUnreadCount` | — |
| <span class="badge badge-put">PUT</span> | `/business/notifications/read-all` | `markAllNotificationsAsRead` | — |
| <span class="badge badge-get">GET</span> | `/business/notifications/recent` | `getRecentNotifications` | — |
| <span class="badge badge-get">GET</span> | `/business/notifications/templates/:templateId/translations` | `listTranslations` | ============================================================================ Template translation routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/notifications/templates/:templateId/translations` | `upsertTranslation` | — |
| <span class="badge badge-get">GET</span> | `/business/notifications/unread` | `getUnreadNotifications` | ============================================================================ User-specific routes (for logged-in merchant viewing their own notifications) ============================================================================ |
| <span class="badge badge-get">GET</span> | `/business/notifications/webhooks` | `listWebhooks` | ============================================================================ Webhook routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/notifications/webhooks` | `createWebhook` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/notifications/webhooks/:webhookId` | `deactivateWebhook` | — |
| <span class="badge badge-post">POST</span> | `/business/order-items` | `createOrderItem` | — |
| <span class="badge badge-get">GET</span> | `/business/order-items/:orderItemId` | `getOrderItemById` | — |
| <span class="badge badge-put">PUT</span> | `/business/order-items/:orderItemId` | `updateOrderItem` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/order-items/:orderItemId` | `deleteOrderItem` | — |
| <span class="badge badge-get">GET</span> | `/business/orders` | `listOrders` | List all orders with filters
GET /business/orders |
| <span class="badge badge-get">GET</span> | `/business/orders/:orderId` | `getOrder` | Get order details
GET /business/orders/:orderId |
| <span class="badge badge-post">POST</span> | `/business/orders/:orderId/cancel` | `cancelOrder` | Cancel an order
POST /business/orders/:orderId/cancel |
| <span class="badge badge-get">GET</span> | `/business/orders/:orderId/fulfillment-history` | `getFulfillmentHistory` | — |
| <span class="badge badge-put">PUT</span> | `/business/orders/:orderId/fulfillment-status` | `updateFulfillmentStatus` | — |
| <span class="badge badge-get">GET</span> | `/business/orders/:orderId/history` | `getOrderHistory` | Get order status history
GET /business/orders/:orderId/history |
| <span class="badge badge-get">GET</span> | `/business/orders/:orderId/items` | `getOrderItems` | ============================================================================ Order Items ============================================================================ |
| <span class="badge badge-get">GET</span> | `/business/orders/:orderId/notes` | `listOrderNotes` | — |
| <span class="badge badge-post">POST</span> | `/business/orders/:orderId/notes` | `addOrderNote` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/orders/:orderId/notes/:noteId` | `deleteOrderNote` | — |
| <span class="badge badge-get">GET</span> | `/business/orders/:orderId/packages` | `listFulfillmentPackages` | — |
| <span class="badge badge-post">POST</span> | `/business/orders/:orderId/packages` | `createFulfillmentPackage` | — |
| <span class="badge badge-post">POST</span> | `/business/orders/:orderId/packages/:packageId/tracking` | `trackFulfillmentPackage` | — |
| <span class="badge badge-get">GET</span> | `/business/orders/:orderId/payment-history` | `getPaymentHistory` | — |
| <span class="badge badge-put">PUT</span> | `/business/orders/:orderId/payment-status` | `updatePaymentStatus` | ============================================================================ Payment & Fulfillment Status ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/orders/:orderId/refund` | `processRefund` | Process refund
POST /business/orders/:orderId/refund |
| <span class="badge badge-get">GET</span> | `/business/orders/:orderId/refunds` | `listOrderRefunds` | — |
| <span class="badge badge-post">POST</span> | `/business/orders/:orderId/refunds` | `createOrderRefund` | — |
| <span class="badge badge-put">PUT</span> | `/business/orders/:orderId/status` | `updateOrderStatus` | Update order status
PUT /business/orders/:orderId/status |
| <span class="badge badge-get">GET</span> | `/business/orders/:orderId/status-history` | `getStatusHistory` | ============================================================================ Status History ============================================================================ |
| <span class="badge badge-get">GET</span> | `/business/orders/number/:orderNumber` | `getOrderByNumber` | Get order by order number
GET /business/orders/number/:orderNumber |
| <span class="badge badge-get">GET</span> | `/business/orders/stats` | `getOrderStats` | Get order statistics
GET /business/orders/stats |
| <span class="badge badge-get">GET</span> | `/business/orders/store-summary` | `getStoreSalesSummary` | Get store sales summary
GET /business/orders/store-summary |
| <span class="badge badge-get">GET</span> | `/business/organizations` | `getOrganizations` | — |
| <span class="badge badge-post">POST</span> | `/business/organizations` | `createOrganization` | — |
| <span class="badge badge-get">GET</span> | `/business/organizations/:id` | `getOrganizationById` | — |
| <span class="badge badge-put">PUT</span> | `/business/organizations/:id` | `updateOrganization` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/organizations/:id` | `deleteOrganization` | — |
| <span class="badge badge-get">GET</span> | `/business/organizations/:id/stores` | `getOrganizationStores` | — |
| <span class="badge badge-get">GET</span> | `/business/organizations/:organizationId/addresses` | `getOrganizationAddresses` | — |
| <span class="badge badge-post">POST</span> | `/business/organizations/:organizationId/addresses` | `addOrganizationAddress` | — |
| <span class="badge badge-put">PUT</span> | `/business/organizations/:organizationId/addresses/:addressId` | `updateOrganizationAddress` | — |
| <span class="badge badge-get">GET</span> | `/business/organizations/:organizationId/payment-info` | `getOrganizationPaymentInfo` | — |
| <span class="badge badge-post">POST</span> | `/business/organizations/:organizationId/payment-info` | `addOrganizationPaymentInfo` | — |
| <span class="badge badge-put">PUT</span> | `/business/organizations/:organizationId/payment-info/:paymentInfoId` | `updateOrganizationPaymentInfo` | — |
| <span class="badge badge-get">GET</span> | `/business/organizations/:organizationId/warehouses` | `getWarehousesByMerchant` | Organization warehouses |
| <span class="badge badge-get">GET</span> | `/business/packaging-types` | `getPackagingTypes` | — |
| <span class="badge badge-post">POST</span> | `/business/packaging-types` | `createPackagingType` | — |
| <span class="badge badge-get">GET</span> | `/business/packaging-types/:id` | `getPackagingTypeById` | — |
| <span class="badge badge-put">PUT</span> | `/business/packaging-types/:id` | `updatePackagingType` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/packaging-types/:id` | `deletePackagingType` | — |
| <span class="badge badge-get">GET</span> | `/business/payment/balance` | `getBalance` | ============================================================================ Balance Routes ============================================================================ |
| <span class="badge badge-get">GET</span> | `/business/payment/disputes` | `listDisputes` | ============================================================================ Dispute Routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/payment/disputes` | `listDisputes` | — |
| <span class="badge badge-get">GET</span> | `/business/payment/disputes/:disputeId` | `getDispute` | — |
| <span class="badge badge-patch">PATCH</span> | `/business/payment/disputes/:disputeId` | `updateDisputeStatus` | — |
| <span class="badge badge-get">GET</span> | `/business/payment/fees` | `listFees` | ============================================================================ Fee Routes ============================================================================ |
| <span class="badge badge-get">GET</span> | `/business/payment/reports` | `listReports` | ============================================================================ Report Routes ============================================================================ |
| <span class="badge badge-get">GET</span> | `/business/payment/settings` | `getSettings` | ============================================================================ Settings Routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/payment/settings` | `updateSettings` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/currencies` | `getAllCurrencies` | Currency Management Routes |
| <span class="badge badge-post">POST</span> | `/business/pricing/currencies` | `saveCurrency` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/currencies/:code` | `getCurrencyByCode` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/pricing/currencies/:code` | `deleteCurrency` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/currencies/default` | `getDefaultCurrency` | — |
| <span class="badge badge-post">POST</span> | `/business/pricing/currencies/update-exchange-rates` | `updateExchangeRates` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/currency-price-rules` | `getAllPriceRules` | Currency Price Rule Routes |
| <span class="badge badge-post">POST</span> | `/business/pricing/currency-price-rules` | `createPriceRule` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/currency-price-rules/:id` | `getPriceRuleById` | — |
| <span class="badge badge-put">PUT</span> | `/business/pricing/currency-price-rules/:id` | `updatePriceRule` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/pricing/currency-price-rules/:id` | `deletePriceRule` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/currency-regions` | `getAllCurrencyRegions` | Currency Region Routes |
| <span class="badge badge-post">POST</span> | `/business/pricing/currency-regions` | `createCurrencyRegion` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/currency-regions/:id` | `getCurrencyRegionById` | — |
| <span class="badge badge-put">PUT</span> | `/business/pricing/currency-regions/:id` | `updateCurrencyRegion` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/pricing/currency-regions/:id` | `deleteCurrencyRegion` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/price-lists` | `getPriceLists` | Customer Price List Routes |
| <span class="badge badge-post">POST</span> | `/business/pricing/price-lists` | `createPriceList` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/price-lists/:id` | `getPriceList` | — |
| <span class="badge badge-put">PUT</span> | `/business/pricing/price-lists/:id` | `updatePriceList` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/pricing/price-lists/:id` | `deletePriceList` | — |
| <span class="badge badge-post">POST</span> | `/business/pricing/price-lists/:priceListId/prices` | `addPriceToList` | Customer Prices Routes |
| <span class="badge badge-get">GET</span> | `/business/pricing/rules` | `getPricingRules` | Pricing Rules Routes |
| <span class="badge badge-post">POST</span> | `/business/pricing/rules` | `createPricingRule` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/rules/:id` | `getPricingRule` | — |
| <span class="badge badge-put">PUT</span> | `/business/pricing/rules/:id` | `updatePricingRule` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/pricing/rules/:id` | `deletePricingRule` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/tier-prices` | `getTierPrices` | Tier Pricing Routes |
| <span class="badge badge-post">POST</span> | `/business/pricing/tier-prices` | `createTierPrice` | — |
| <span class="badge badge-get">GET</span> | `/business/pricing/tier-prices/:id` | `getTierPrice` | — |
| <span class="badge badge-put">PUT</span> | `/business/pricing/tier-prices/:id` | `updateTierPrice` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/pricing/tier-prices/:id` | `deleteTierPrice` | — |
| <span class="badge badge-get">GET</span> | `/business/product-types` | `isOrganizationLoggedIn` | List all product types |
| <span class="badge badge-post">POST</span> | `/business/product-types` | `isOrganizationLoggedIn` | Create product type |
| <span class="badge badge-get">GET</span> | `/business/product-types` | `bind` | — |
| <span class="badge badge-post">POST</span> | `/business/product-types` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/product-types/:id` | `isOrganizationLoggedIn` | Get product type by ID |
| <span class="badge badge-put">PUT</span> | `/business/product-types/:id` | `isOrganizationLoggedIn` | Update product type |
| <span class="badge badge-delete">DELETE</span> | `/business/product-types/:id` | `isOrganizationLoggedIn` | Delete product type |
| <span class="badge badge-get">GET</span> | `/business/product-types/:id` | `bind` | — |
| <span class="badge badge-put">PUT</span> | `/business/product-types/:id` | `bind` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/product-types/:id` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/product-types/:id/attributes` | `isOrganizationLoggedIn` | Get attributes for a product type |
| <span class="badge badge-get">GET</span> | `/business/product-types/:id/attributes` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/product-types/slug/:slug` | `isOrganizationLoggedIn` | Get product type by slug |
| <span class="badge badge-get">GET</span> | `/business/product-types/slug/:slug` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/products` | `listProducts` | List all products
GET /business/products |
| <span class="badge badge-post">POST</span> | `/business/products` | `createProduct` | Create a new product
POST /business/products |
| <span class="badge badge-get">GET</span> | `/business/products/:productId` | `getProduct` | Get product details
GET /business/products/:productId |
| <span class="badge badge-put">PUT</span> | `/business/products/:productId` | `updateProduct` | Update a product
PUT /business/products/:productId |
| <span class="badge badge-delete">DELETE</span> | `/business/products/:productId` | `deleteProduct` | Delete a product
DELETE /business/products/:productId |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/apply-attribute-set` | `applyAttributeSet` | — |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/attributes` | `isOrganizationLoggedIn` | Get product attributes |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/attributes` | `isOrganizationLoggedIn` | Set single product attribute |
| <span class="badge badge-put">PUT</span> | `/business/products/:productId/attributes` | `isOrganizationLoggedIn` | Set multiple product attributes |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/attributes` | `bind` | Product Attributes |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/attributes` | `bind` | — |
| <span class="badge badge-put">PUT</span> | `/business/products/:productId/attributes` | `bind` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/products/:productId/attributes/:attributeId` | `isOrganizationLoggedIn` | Remove product attribute |
| <span class="badge badge-delete">DELETE</span> | `/business/products/:productId/attributes/:attributeId` | `bind` | — |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/configure` | `configureVariant` | — |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/downloads` | `listDownloads` | — |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/downloads` | `createDownload` | — |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/grouped-children` | `listGroupedChildren` | — |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/images` | `getProductImages` | — |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/images` | `addProductImage` | — |
| <span class="badge badge-put">PUT</span> | `/business/products/:productId/images/:imageId` | `updateProductImage` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/products/:productId/images/:imageId` | `deleteProductImage` | — |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/images/reorder` | `reorderProductImages` | — |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/publish` | `publishProduct` | Publish a product
POST /business/products/:productId/publish |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/qa` | `listProductQa` | — |
| <span class="badge badge-patch">PATCH</span> | `/business/products/:productId/qa/:qaId/status` | `updateQaStatus` | — |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/relationships` | `listRelationships` | — |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/relationships` | `createRelationship` | — |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/reviews/media` | `listReviewMedia` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/products/:productId/reviews/media/:mediaId` | `deleteReviewMedia` | — |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/similar` | `bind` | Find similar products |
| <span class="badge badge-put">PUT</span> | `/business/products/:productId/status` | `updateProductStatus` | Update product status
PUT /business/products/:productId/status |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/store-availability` | `getProductStoreAvailability` | Get product store availability
GET /business/products/:productId/store-availability |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/unpublish` | `unpublishProduct` | Unpublish a product
POST /business/products/:productId/unpublish |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/variant-matrix` | `getVariantMatrix` | — |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/variants` | `getProductVariants` | — |
| <span class="badge badge-post">POST</span> | `/business/products/:productId/variants` | `createProductVariant` | — |
| <span class="badge badge-get">GET</span> | `/business/products/:productId/variants/:variantId` | `getProductVariant` | — |
| <span class="badge badge-put">PUT</span> | `/business/products/:productId/variants/:variantId` | `updateProductVariant` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/products/:productId/variants/:variantId` | `deleteProductVariant` | — |
| <span class="badge badge-put">PUT</span> | `/business/products/:productId/visibility` | `updateProductVisibility` | Update product visibility
PUT /business/products/:productId/visibility |
| <span class="badge badge-get">GET</span> | `/business/products/barcode/:barcode` | `findByBarcode` | Find product by variant barcode
GET /business/products/barcode/:barcode |
| <span class="badge badge-get">GET</span> | `/business/products/by-attribute/:code/:value` | `bind` | Find products by attribute |
| <span class="badge badge-get">GET</span> | `/business/products/search` | `bind` | Search products with filters and facets |
| <span class="badge badge-post">POST</span> | `/business/products/search` | `bind` | — |
| <span class="badge badge-get">GET</span> | `/business/products/search/suggestions` | `bind` | Get search suggestions for autocomplete |
| <span class="badge badge-get">GET</span> | `/business/products/variants/:variantId` | `getProductVariant` | Flat variant routes — must be before /:productId to avoid collision |
| <span class="badge badge-put">PUT</span> | `/business/products/variants/:variantId` | `updateProductVariant` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/products/variants/:variantId` | `deleteProductVariant` | — |
| <span class="badge badge-patch">PATCH</span> | `/business/products/variants/:variantId/inventory` | `updateVariantInventory` | — |
| <span class="badge badge-get">GET</span> | `/business/promotions` | `getPromotions` | Promotion routes |
| <span class="badge badge-post">POST</span> | `/business/promotions` | `createPromotion` | — |
| <span class="badge badge-get">GET</span> | `/business/promotions/:id` | `getPromotionById` | — |
| <span class="badge badge-put">PUT</span> | `/business/promotions/:id` | `updatePromotion` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/promotions/:id` | `deletePromotion` | — |
| <span class="badge badge-post">POST</span> | `/business/promotions/:id/activate` | `activatePromotion` | — |
| <span class="badge badge-post">POST</span> | `/business/promotions/:id/pause` | `pausePromotion` | — |
| <span class="badge badge-get">GET</span> | `/business/promotions/active` | `getActivePromotions` | — |
| <span class="badge badge-put">PUT</span> | `/business/purchase-order-items/:id` | `updatePurchaseOrderItem` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/purchase-order-items/:id` | `deletePurchaseOrderItem` | — |
| <span class="badge badge-get">GET</span> | `/business/purchase-orders` | `getPurchaseOrders` | Purchase order CRUD |
| <span class="badge badge-post">POST</span> | `/business/purchase-orders` | `createPurchaseOrder` | — |
| <span class="badge badge-get">GET</span> | `/business/purchase-orders/:id` | `getPurchaseOrderById` | — |
| <span class="badge badge-put">PUT</span> | `/business/purchase-orders/:id` | `updatePurchaseOrder` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/purchase-orders/:id` | `deletePurchaseOrder` | — |
| <span class="badge badge-post">POST</span> | `/business/purchase-orders/:id/approve` | `approvePurchaseOrder` | Purchase order workflow |
| <span class="badge badge-post">POST</span> | `/business/purchase-orders/:id/cancel` | `cancelPurchaseOrder` | — |
| <span class="badge badge-get">GET</span> | `/business/purchase-orders/:id/items` | `getPurchaseOrderItems` | Purchase order items |
| <span class="badge badge-post">POST</span> | `/business/purchase-orders/:id/items` | `addPurchaseOrderItem` | — |
| <span class="badge badge-get">GET</span> | `/business/purchase-orders/:id/receiving` | `getReceivingByPurchaseOrder` | — |
| <span class="badge badge-post">POST</span> | `/business/purchase-orders/:id/send` | `sendPurchaseOrder` | — |
| <span class="badge badge-get">GET</span> | `/business/rates` | `getRates` | — |
| <span class="badge badge-post">POST</span> | `/business/rates` | `createRate` | — |
| <span class="badge badge-get">GET</span> | `/business/rates/:id` | `getRateById` | — |
| <span class="badge badge-put">PUT</span> | `/business/rates/:id` | `updateRate` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/rates/:id` | `deleteRate` | — |
| <span class="badge badge-get">GET</span> | `/business/receiving` | `getReceivingRecords` | Receiving record CRUD |
| <span class="badge badge-post">POST</span> | `/business/receiving` | `createReceivingRecord` | — |
| <span class="badge badge-put">PUT</span> | `/business/receiving-items/:id` | `updateReceivingItem` | — |
| <span class="badge badge-post">POST</span> | `/business/receiving-items/:id/accept` | `acceptReceivingItem` | — |
| <span class="badge badge-post">POST</span> | `/business/receiving-items/:id/reject` | `rejectReceivingItem` | — |
| <span class="badge badge-get">GET</span> | `/business/receiving/:id` | `getReceivingRecordById` | — |
| <span class="badge badge-put">PUT</span> | `/business/receiving/:id` | `updateReceivingRecord` | — |
| <span class="badge badge-post">POST</span> | `/business/receiving/:id/complete` | `completeReceiving` | — |
| <span class="badge badge-get">GET</span> | `/business/receiving/:id/items` | `getReceivingItems` | Receiving items |
| <span class="badge badge-post">POST</span> | `/business/receiving/:id/items` | `createReceivingItem` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/relationships/:relationshipId` | `deleteRelationship` | — |
| <span class="badge badge-post">POST</span> | `/business/reports/generate` | `generateReport` | Report generation (on-demand) |
| <span class="badge badge-get">GET</span> | `/business/reports/schedules` | `listSchedules` | Report schedule CRUD |
| <span class="badge badge-post">POST</span> | `/business/reports/schedules` | `createSchedule` | — |
| <span class="badge badge-get">GET</span> | `/business/reports/schedules/:scheduleId` | `getSchedule` | — |
| <span class="badge badge-put">PUT</span> | `/business/reports/schedules/:scheduleId` | `updateSchedule` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/reports/schedules/:scheduleId` | `deleteSchedule` | — |
| <span class="badge badge-get">GET</span> | `/business/reports/schedules/:scheduleId/executions` | `listExecutions` | Report executions (history) |
| <span class="badge badge-get">GET</span> | `/business/reports/templates` | `getReportTemplates` | Report templates |
| <span class="badge badge-get">GET</span> | `/business/reviews` | `listReviews` | — |
| <span class="badge badge-get">GET</span> | `/business/reviews/:reviewId` | `getReview` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/reviews/:reviewId` | `deleteReview` | — |
| <span class="badge badge-put">PUT</span> | `/business/reviews/:reviewId/approve` | `approveReview` | — |
| <span class="badge badge-put">PUT</span> | `/business/reviews/:reviewId/reject` | `rejectReview` | — |
| <span class="badge badge-post">POST</span> | `/business/reviews/:reviewId/respond` | `respondToReview` | — |
| <span class="badge badge-get">GET</span> | `/business/subscriptions` | `getCustomerSubscriptions` | — |
| <span class="badge badge-get">GET</span> | `/business/subscriptions/:id` | `getCustomerSubscription` | — |
| <span class="badge badge-post">POST</span> | `/business/subscriptions/:id/bill` | `processBillingCycle` | — |
| <span class="badge badge-post">POST</span> | `/business/subscriptions/:id/cancel` | `cancelSubscriptionAdmin` | — |
| <span class="badge badge-post">POST</span> | `/business/subscriptions/:id/pause` | `pauseSubscriptionAdmin` | — |
| <span class="badge badge-post">POST</span> | `/business/subscriptions/:id/resume` | `resumeSubscriptionAdmin` | — |
| <span class="badge badge-put">PUT</span> | `/business/subscriptions/:id/status` | `updateSubscriptionStatus` | — |
| <span class="badge badge-get">GET</span> | `/business/subscriptions/:subscriptionId/dunning` | `getDunningAttempts` | — |
| <span class="badge badge-get">GET</span> | `/business/subscriptions/:subscriptionId/orders` | `getSubscriptionOrders` | Subscription Orders |
| <span class="badge badge-get">GET</span> | `/business/subscriptions/billing/due` | `getSubscriptionsDueBilling` | — |
| <span class="badge badge-get">GET</span> | `/business/subscriptions/dunning/pending` | `getPendingDunning` | — |
| <span class="badge badge-post">POST</span> | `/business/subscriptions/orders/:orderId/retry` | `retrySubscriptionOrder` | — |
| <span class="badge badge-post">POST</span> | `/business/subscriptions/orders/:orderId/skip` | `skipSubscriptionOrder` | — |
| <span class="badge badge-get">GET</span> | `/business/subscriptions/products` | `getSubscriptionProducts` | — |
| <span class="badge badge-post">POST</span> | `/business/subscriptions/products` | `createSubscriptionProduct` | — |
| <span class="badge badge-get">GET</span> | `/business/subscriptions/products/:id` | `getSubscriptionProduct` | — |
| <span class="badge badge-put">PUT</span> | `/business/subscriptions/products/:id` | `updateSubscriptionProduct` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/subscriptions/products/:id` | `deleteSubscriptionProduct` | — |
| <span class="badge badge-get">GET</span> | `/business/subscriptions/products/:productId/plans` | `getSubscriptionPlans` | — |
| <span class="badge badge-post">POST</span> | `/business/subscriptions/products/:productId/plans` | `createSubscriptionPlan` | — |
| <span class="badge badge-get">GET</span> | `/business/subscriptions/products/:productId/plans/:planId` | `getSubscriptionPlan` | — |
| <span class="badge badge-put">PUT</span> | `/business/subscriptions/products/:productId/plans/:planId` | `updateSubscriptionPlan` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/subscriptions/products/:productId/plans/:planId` | `deleteSubscriptionPlan` | — |
| <span class="badge badge-put">PUT</span> | `/business/supplier-addresses/:id` | `updateSupplierAddress` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/supplier-addresses/:id` | `deleteSupplierAddress` | — |
| <span class="badge badge-put">PUT</span> | `/business/supplier-products/:id` | `updateSupplierProduct` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/supplier-products/:id` | `removeProductFromSupplier` | — |
| <span class="badge badge-get">GET</span> | `/business/suppliers` | `getSuppliers` | Supplier CRUD |
| <span class="badge badge-post">POST</span> | `/business/suppliers` | `createSupplier` | — |
| <span class="badge badge-get">GET</span> | `/business/suppliers/:id` | `getSupplierById` | — |
| <span class="badge badge-put">PUT</span> | `/business/suppliers/:id` | `updateSupplier` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/suppliers/:id` | `deleteSupplier` | — |
| <span class="badge badge-get">GET</span> | `/business/suppliers/:id/addresses` | `getSupplierAddresses` | Supplier addresses |
| <span class="badge badge-post">POST</span> | `/business/suppliers/:id/addresses` | `createSupplierAddress` | — |
| <span class="badge badge-post">POST</span> | `/business/suppliers/:id/approve` | `approveSupplier` | — |
| <span class="badge badge-get">GET</span> | `/business/suppliers/:id/products` | `getSupplierProducts` | Supplier products |
| <span class="badge badge-post">POST</span> | `/business/suppliers/:id/products` | `addProductToSupplier` | — |
| <span class="badge badge-get">GET</span> | `/business/suppliers/:id/purchase-orders` | `getPurchaseOrdersBySupplierId` | — |
| <span class="badge badge-patch">PATCH</span> | `/business/suppliers/:id/status` | `updateSupplierStatus` | Supplier status management |
| <span class="badge badge-post">POST</span> | `/business/suppliers/:id/suspend` | `suspendSupplier` | — |
| <span class="badge badge-patch">PATCH</span> | `/business/suppliers/:id/visibility` | `updateSupplierVisibility` | — |
| <span class="badge badge-get">GET</span> | `/business/suppliers/code/:code` | `getSupplierByCode` | — |
| <span class="badge badge-get">GET</span> | `/business/suppliers/statistics` | `getSupplierStatistics` | — |
| <span class="badge badge-get">GET</span> | `/business/support/agents` | `getAgents` | — |
| <span class="badge badge-post">POST</span> | `/business/support/agents` | `createAgent` | — |
| <span class="badge badge-get">GET</span> | `/business/support/agents/:id` | `getAgent` | — |
| <span class="badge badge-put">PUT</span> | `/business/support/agents/:id` | `updateAgent` | — |
| <span class="badge badge-get">GET</span> | `/business/support/alerts/price` | `getPriceAlerts` | — |
| <span class="badge badge-post">POST</span> | `/business/support/alerts/price/notify` | `notifyPriceAlerts` | — |
| <span class="badge badge-get">GET</span> | `/business/support/alerts/stock` | `getStockAlerts` | — |
| <span class="badge badge-post">POST</span> | `/business/support/alerts/stock/notify` | `notifyStockAlerts` | — |
| <span class="badge badge-get">GET</span> | `/business/support/faq/articles` | `getFaqArticles` | — |
| <span class="badge badge-post">POST</span> | `/business/support/faq/articles` | `createFaqArticle` | — |
| <span class="badge badge-get">GET</span> | `/business/support/faq/articles/:id` | `getFaqArticle` | — |
| <span class="badge badge-put">PUT</span> | `/business/support/faq/articles/:id` | `updateFaqArticle` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/support/faq/articles/:id` | `deleteFaqArticle` | — |
| <span class="badge badge-post">POST</span> | `/business/support/faq/articles/:id/publish` | `publishFaqArticle` | — |
| <span class="badge badge-post">POST</span> | `/business/support/faq/articles/:id/unpublish` | `unpublishFaqArticle` | — |
| <span class="badge badge-get">GET</span> | `/business/support/faq/categories` | `getFaqCategories` | — |
| <span class="badge badge-post">POST</span> | `/business/support/faq/categories` | `createFaqCategory` | — |
| <span class="badge badge-get">GET</span> | `/business/support/faq/categories/:id` | `getFaqCategory` | — |
| <span class="badge badge-put">PUT</span> | `/business/support/faq/categories/:id` | `updateFaqCategory` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/support/faq/categories/:id` | `deleteFaqCategory` | — |
| <span class="badge badge-get">GET</span> | `/business/support/tickets` | `getTickets` | — |
| <span class="badge badge-get">GET</span> | `/business/support/tickets/:id` | `getTicket` | — |
| <span class="badge badge-put">PUT</span> | `/business/support/tickets/:id` | `updateTicket` | — |
| <span class="badge badge-post">POST</span> | `/business/support/tickets/:id/assign` | `assignTicket` | — |
| <span class="badge badge-post">POST</span> | `/business/support/tickets/:id/close` | `closeTicket` | — |
| <span class="badge badge-post">POST</span> | `/business/support/tickets/:id/escalate` | `escalateTicket` | — |
| <span class="badge badge-post">POST</span> | `/business/support/tickets/:id/messages` | `addAgentMessage` | — |
| <span class="badge badge-post">POST</span> | `/business/support/tickets/:id/resolve` | `resolveTicket` | — |
| <span class="badge badge-get">GET</span> | `/business/tax/categories` | `getAllTaxCategories` | -------------------- Tax Category Routes -------------------- |
| <span class="badge badge-post">POST</span> | `/business/tax/categories` | `createTaxCategory` | — |
| <span class="badge badge-get">GET</span> | `/business/tax/categories/:id` | `getTaxCategory` | — |
| <span class="badge badge-put">PUT</span> | `/business/tax/categories/:id` | `updateTaxCategory` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/tax/categories/:id` | `deleteTaxCategory` | — |
| <span class="badge badge-get">GET</span> | `/business/tax/rates` | `getAllTaxRates` | -------------------- Tax Rate Routes -------------------- |
| <span class="badge badge-post">POST</span> | `/business/tax/rates` | `createTaxRate` | — |
| <span class="badge badge-get">GET</span> | `/business/tax/rates/:id` | `getTaxRate` | — |
| <span class="badge badge-put">PUT</span> | `/business/tax/rates/:id` | `updateTaxRate` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/tax/rates/:id` | `deleteTaxRate` | — |
| <span class="badge badge-get">GET</span> | `/business/tax/zones` | `getAllTaxZones` | -------------------- Tax Zone Routes -------------------- |
| <span class="badge badge-post">POST</span> | `/business/tax/zones` | `createTaxZone` | — |
| <span class="badge badge-get">GET</span> | `/business/tax/zones/:id` | `getTaxZoneById` | — |
| <span class="badge badge-put">PUT</span> | `/business/tax/zones/:id` | `updateTaxZone` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/tax/zones/:id` | `deleteTaxZone` | — |
| <span class="badge badge-get">GET</span> | `/business/track` | `trackShipment` | — |
| <span class="badge badge-get">GET</span> | `/business/track/:id` | `trackShipment` | — |
| <span class="badge badge-get">GET</span> | `/business/transactions` | `listTransactions` | ============================================================================ Transaction Routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/business/transactions` | `initiatePayment` | — |
| <span class="badge badge-get">GET</span> | `/business/transactions/:transactionId` | `getTransaction` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/transactions/:transactionId` | `deleteTransaction` | — |
| <span class="badge badge-post">POST</span> | `/business/transactions/:transactionId/refund` | `processRefund` | — |
| <span class="badge badge-get">GET</span> | `/business/transactions/:transactionId/refunds` | `getRefunds` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses` | `getWarehouses` | Warehouse listing with various filters |
| <span class="badge badge-post">POST</span> | `/business/warehouses` | `createWarehouse` | Warehouse CRUD operations |
| <span class="badge badge-get">GET</span> | `/business/warehouses/:id` | `getWarehouseById` | — |
| <span class="badge badge-put">PUT</span> | `/business/warehouses/:id` | `updateWarehouse` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/warehouses/:id` | `deleteWarehouse` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/activate` | `activateWarehouse` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/bins` | `createBin` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/:id/bins` | `getBins` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/:id/bins/:binId` | `getBinById` | — |
| <span class="badge badge-put">PUT</span> | `/business/warehouses/:id/bins/:binId` | `updateBin` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/warehouses/:id/bins/:binId` | `deleteBin` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/deactivate` | `deactivateWarehouse` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/default` | `setDefaultWarehouse` | Warehouse status management |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/pick-pack` | `createPickPack` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/:id/pick-pack` | `getPickPacks` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/:id/pick-pack/:pickPackId` | `getPickPackById` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/pick-pack/:pickPackId/assign` | `assignPickPack` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/pick-pack/:pickPackId/complete-packing` | `completePacking` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/pick-pack/:pickPackId/complete-picking` | `completePicking` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/pick-pack/:pickPackId/start-packing` | `startPacking` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/pick-pack/:pickPackId/start-picking` | `startPicking` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/receiving` | `createReceiving` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/:id/receiving` | `getReceiving` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/:id/receiving/:receivingId` | `getReceivingById` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/receiving/:receivingId/complete` | `completeReceiving` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/shipping-methods` | `addShippingMethod` | Shipping method management |
| <span class="badge badge-delete">DELETE</span> | `/business/warehouses/:id/shipping-methods/:method` | `removeShippingMethod` | — |
| <span class="badge badge-post">POST</span> | `/business/warehouses/:id/zones` | `createZone` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/:id/zones` | `getZones` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/:id/zones/:zoneId` | `getZoneById` | — |
| <span class="badge badge-put">PUT</span> | `/business/warehouses/:id/zones/:zoneId` | `updateZone` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/warehouses/:id/zones/:zoneId` | `deleteZone` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/code/:code` | `getWarehouseByCode` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/country/:country` | `getWarehousesByCountry` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/default` | `getDefaultWarehouse` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/fulfillment-centers` | `getFulfillmentCenters` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/nearest` | `findNearestWarehouses` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/return-centers` | `getReturnCenters` | — |
| <span class="badge badge-get">GET</span> | `/business/warehouses/statistics` | `getWarehouseStatistics` | — |
| <span class="badge badge-get">GET</span> | `/business/webhooks` | `listWebhooks` | List webhook endpoints
GET /business/webhooks |
| <span class="badge badge-post">POST</span> | `/business/webhooks` | `registerWebhook` | Register a new webhook endpoint
POST /business/webhooks |
| <span class="badge badge-get">GET</span> | `/business/webhooks/:webhookEndpointId` | `getWebhook` | Get a single webhook endpoint
GET /business/webhooks/:webhookEndpointId |
| <span class="badge badge-put">PUT</span> | `/business/webhooks/:webhookEndpointId` | `updateWebhook` | Update a webhook endpoint
PUT /business/webhooks/:webhookEndpointId |
| <span class="badge badge-delete">DELETE</span> | `/business/webhooks/:webhookEndpointId` | `unregisterWebhook` | Delete a webhook endpoint
DELETE /business/webhooks/:webhookEndpointId |
| <span class="badge badge-get">GET</span> | `/business/webhooks/:webhookEndpointId/deliveries` | `getDeliveries` | Get deliveries for a webhook endpoint
GET /business/webhooks/:webhookEndpointId/deliveries |
| <span class="badge badge-post">POST</span> | `/business/webhooks/:webhookEndpointId/test` | `testWebhook` | Test a webhook endpoint
POST /business/webhooks/:webhookEndpointId/test |
| <span class="badge badge-get">GET</span> | `/business/webhooks/events` | `getAvailableEvents` | Get available event types
GET /business/webhooks/events |
| <span class="badge badge-get">GET</span> | `/business/zones` | `getZones` | — |
| <span class="badge badge-post">POST</span> | `/business/zones` | `createZone` | — |
| <span class="badge badge-get">GET</span> | `/business/zones/:id` | `getZoneById` | — |
| <span class="badge badge-put">PUT</span> | `/business/zones/:id` | `updateZone` | — |
| <span class="badge badge-delete">DELETE</span> | `/business/zones/:id` | `deleteZone` | — |

## /customer

| Method | Path | Controller | Description |
|---|---|---|---|
| <span class="badge badge-get">GET</span> | `/customer/active` | `(_req, res) => {
  res.json({ success: true, message: 'Get a` | — |
| <span class="badge badge-post">POST</span> | `/customer/basket` | `getOrCreateBasket` | Get or create basket for current user/session
POST /basket |
| <span class="badge badge-get">GET</span> | `/customer/basket/:basketId` | `getBasket` | Get basket by ID
GET /basket/:basketId |
| <span class="badge badge-delete">DELETE</span> | `/customer/basket/:basketId` | `deleteBasket` | Delete basket
DELETE /basket/:basketId |
| <span class="badge badge-post">POST</span> | `/customer/basket/:basketId/assign` | `assignToCustomer` | Assign basket to customer
POST /basket/:basketId/assign |
| <span class="badge badge-post">POST</span> | `/customer/basket/:basketId/coupon` | `applyCoupon` | Apply coupon to basket
POST /basket/:basketId/coupon |
| <span class="badge badge-delete">DELETE</span> | `/customer/basket/:basketId/coupon` | `removeCoupon` | Remove coupon from basket
DELETE /basket/:basketId/coupon |
| <span class="badge badge-put">PUT</span> | `/customer/basket/:basketId/expiration` | `extendExpiration` | Extend basket expiration
PUT /basket/:basketId/expiration |
| <span class="badge badge-post">POST</span> | `/customer/basket/:basketId/items` | `addItem` | Add item to basket
POST /basket/:basketId/items |
| <span class="badge badge-delete">DELETE</span> | `/customer/basket/:basketId/items` | `clearBasket` | Clear all items from basket
DELETE /basket/:basketId/items |
| <span class="badge badge-patch">PATCH</span> | `/customer/basket/:basketId/items/:basketItemId` | `updateItemQuantity` | Update item quantity
PATCH /basket/:basketId/items/:basketItemId |
| <span class="badge badge-delete">DELETE</span> | `/customer/basket/:basketId/items/:basketItemId` | `removeItem` | Remove item from basket
DELETE /basket/:basketId/items/:basketItemId |
| <span class="badge badge-post">POST</span> | `/customer/basket/:basketId/items/:basketItemId/gift` | `setItemAsGift` | Set item as gift
POST /basket/:basketId/items/:basketItemId/gift |
| <span class="badge badge-get">GET</span> | `/customer/basket/:basketId/summary` | `getBasketSummary` | Get basket summary (lightweight response)
GET /basket/:basketId/summary |
| <span class="badge badge-get">GET</span> | `/customer/basket/me` | `getMyBasket` | Get current user's basket
GET /basket/me |
| <span class="badge badge-post">POST</span> | `/customer/basket/merge` | `mergeBaskets` | Merge baskets (typically when guest logs in)
POST /basket/merge |
| <span class="badge badge-post">POST</span> | `/customer/calculate-rates` | `calculateRates` | Calculate shipping rates for an order |
| <span class="badge badge-get">GET</span> | `/customer/categories` | `listCategories` | List all active categories
GET /customer/categories
Query params: ?featured=true | ?menu=true | ?root=true |
| <span class="badge badge-get">GET</span> | `/customer/categories/:categoryId/children` | `getCategoryChildren` | Get subcategories of a parent category
GET /customer/categories/:categoryId/children |
| <span class="badge badge-get">GET</span> | `/customer/categories/:identifier` | `getCategory` | Get category by ID or slug
GET /customer/categories/:identifier |
| <span class="badge badge-post">POST</span> | `/customer/checkout` | `initiateCheckout` | Initiate checkout session
POST /checkout |
| <span class="badge badge-get">GET</span> | `/customer/checkout/:checkoutId` | `getCheckout` | Get checkout session
GET /checkout/:checkoutId |
| <span class="badge badge-post">POST</span> | `/customer/checkout/:checkoutId/abandon` | `abandonCheckout` | Abandon checkout
POST /checkout/:checkoutId/abandon |
| <span class="badge badge-put">PUT</span> | `/customer/checkout/:checkoutId/billing-address` | `setBillingAddress` | Set billing address
PUT /checkout/:checkoutId/billing-address |
| <span class="badge badge-post">POST</span> | `/customer/checkout/:checkoutId/complete` | `completeCheckout` | Complete checkout and create order
POST /checkout/:checkoutId/complete |
| <span class="badge badge-post">POST</span> | `/customer/checkout/:checkoutId/coupon` | `applyCoupon` | Apply coupon code
POST /checkout/:checkoutId/coupon |
| <span class="badge badge-delete">DELETE</span> | `/customer/checkout/:checkoutId/coupon` | `removeCoupon` | Remove coupon code
DELETE /checkout/:checkoutId/coupon |
| <span class="badge badge-put">PUT</span> | `/customer/checkout/:checkoutId/fulfillment-method` | `setFulfillmentMethod` | Set fulfillment method (shipping, pickup, local_delivery, digital)
PUT /checkout/:checkoutId/fulfillment-method |
| <span class="badge badge-get">GET</span> | `/customer/checkout/:checkoutId/fulfillment-options` | `getFulfillmentOptions` | Get all fulfillment options (unified)
GET /checkout/:checkoutId/fulfillment-options |
| <span class="badge badge-get">GET</span> | `/customer/checkout/:checkoutId/local-delivery-options` | `getLocalDeliveryOptions` | Get local delivery options
GET /checkout/:checkoutId/local-delivery-options |
| <span class="badge badge-post">POST</span> | `/customer/checkout/:checkoutId/payment-intent` | `createPaymentIntent` | Create payment intent and draft order
POST /checkout/:checkoutId/payment-intent |
| <span class="badge badge-put">PUT</span> | `/customer/checkout/:checkoutId/payment-method` | `setPaymentMethod` | Set payment method
PUT /checkout/:checkoutId/payment-method |
| <span class="badge badge-put">PUT</span> | `/customer/checkout/:checkoutId/pickup-location` | `setPickupLocation` | Set pickup location (BOPIS)
PUT /checkout/:checkoutId/pickup-location |
| <span class="badge badge-get">GET</span> | `/customer/checkout/:checkoutId/pickup-slots` | `getPickupSlots` | Get available pickup time slots
GET /checkout/:checkoutId/pickup-slots |
| <span class="badge badge-put">PUT</span> | `/customer/checkout/:checkoutId/shipping-address` | `setShippingAddress` | Set shipping address
PUT /checkout/:checkoutId/shipping-address |
| <span class="badge badge-put">PUT</span> | `/customer/checkout/:checkoutId/shipping-method` | `setShippingMethod` | Set shipping method
PUT /checkout/:checkoutId/shipping-method |
| <span class="badge badge-get">GET</span> | `/customer/checkout/:checkoutId/shipping-methods` | `getShippingMethods` | Get available shipping methods
GET /checkout/:checkoutId/shipping-methods |
| <span class="badge badge-get">GET</span> | `/customer/checkout/:checkoutId/summary` | `getCheckoutSummary` | Get checkout summary
GET /checkout/:checkoutId/summary |
| <span class="badge badge-get">GET</span> | `/customer/checkout/payment-methods` | `getPaymentMethods` | Get available payment methods (no checkout required)
GET /checkout/payment-methods |
| <span class="badge badge-get">GET</span> | `/customer/checkout/pickup-locations` | `getPickupLocations` | Get available pickup locations
GET /checkout/pickup-locations |
| <span class="badge badge-get">GET</span> | `/customer/content/pages` | `getPublishedPages` | Public content routes (no auth required, only published/active content) |
| <span class="badge badge-get">GET</span> | `/customer/content/pages/:slug` | `getPublishedPageBySlug` | — |
| <span class="badge badge-get">GET</span> | `/customer/content/types` | `getActiveContentTypes` | — |
| <span class="badge badge-post">POST</span> | `/customer/coupons/apply` | `applyCoupon` | — |
| <span class="badge badge-post">POST</span> | `/customer/coupons/validate` | `validateCoupon` | — |
| <span class="badge badge-get">GET</span> | `/customer/coupons/validate/:code` | `validateCoupon` | — |
| <span class="badge badge-post">POST</span> | `/customer/estimate-delivery` | `estimateDelivery` | Estimate delivery time for a shipping method |
| <span class="badge badge-post">POST</span> | `/customer/gdpr/cookies/accept-all` | `acceptAllCookies` | Accept all cookies |
| <span class="badge badge-post">POST</span> | `/customer/gdpr/cookies/consent` | `recordCookieConsent` | Record cookie consent |
| <span class="badge badge-get">GET</span> | `/customer/gdpr/cookies/consent` | `getCookieConsent` | Get current consent |
| <span class="badge badge-put">PUT</span> | `/customer/gdpr/cookies/consent/:cookieConsentId` | `updateCookieConsent` | Update cookie preferences |
| <span class="badge badge-post">POST</span> | `/customer/gdpr/cookies/reject-all` | `rejectAllCookies` | Reject all optional cookies |
| <span class="badge badge-post">POST</span> | `/customer/gdpr/requests` | `isCustomerLoggedIn` | Create a new data request |
| <span class="badge badge-get">GET</span> | `/customer/gdpr/requests` | `isCustomerLoggedIn` | Get my data requests |
| <span class="badge badge-post">POST</span> | `/customer/gdpr/requests/:gdprDataRequestId/cancel` | `isCustomerLoggedIn` | Cancel a request |
| <span class="badge badge-get">GET</span> | `/customer/gift-cards/balance/:code` | `checkGiftCardBalance` | Gift Card routes |
| <span class="badge badge-get">GET</span> | `/customer/gift-cards/mine` | `getMyGiftCards` | — |
| <span class="badge badge-post">POST</span> | `/customer/gift-cards/redeem` | `redeemGiftCard` | — |
| <span class="badge badge-post">POST</span> | `/customer/gift-cards/reload` | `reloadGiftCard` | — |
| <span class="badge badge-get">GET</span> | `/customer/identity/2fa/status` | `isCustomerLoggedIn` | 2FA status (requires auth) |
| <span class="badge badge-post">POST</span> | `/customer/identity/forgot-password` | `requestPasswordReset` | Password reset flow |
| <span class="badge badge-post">POST</span> | `/customer/identity/login` | `loginCustomer` | Simple login (returns access token only) |
| <span class="badge badge-post">POST</span> | `/customer/identity/logout` | `isCustomerLoggedIn` | Logout (requires auth to blacklist token) |
| <span class="badge badge-post">POST</span> | `/customer/identity/refresh` | `renewAccessToken` | Refresh access token |
| <span class="badge badge-post">POST</span> | `/customer/identity/register` | `registerCustomer` | Register new customer account |
| <span class="badge badge-post">POST</span> | `/customer/identity/reset-password` | `resetPassword` | — |
| <span class="badge badge-post">POST</span> | `/customer/identity/token` | `issueTokenPair` | Token-based auth (returns access + refresh tokens) |
| <span class="badge badge-post">POST</span> | `/customer/identity/validate` | `checkTokenValidity` | Validate token |
| <span class="badge badge-get">GET</span> | `/customer/inventory/availability/:sku` | `checkAvailability` | Check product availability by SKU |
| <span class="badge badge-get">GET</span> | `/customer/inventory/availability/product/:productId` | `checkProductAvailability` | Check product availability by productId |
| <span class="badge badge-get">GET</span> | `/customer/localization/countries` | `getActiveCountries` | — |
| <span class="badge badge-get">GET</span> | `/customer/localization/countries/:code` | `getCountryByCode` | — |
| <span class="badge badge-get">GET</span> | `/customer/localization/detect` | `detectLocale` | — |
| <span class="badge badge-get">GET</span> | `/customer/localization/locales` | `getActiveLocales` | Public routes (no auth required) |
| <span class="badge badge-get">GET</span> | `/customer/localization/locales/:code` | `getLocaleByCode` | — |
| <span class="badge badge-get">GET</span> | `/customer/loyalty/my-redemptions` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/customer/loyalty/my-status` | `isCustomerLoggedIn` | Customer authenticated routes |
| <span class="badge badge-get">GET</span> | `/customer/loyalty/my-transactions` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/customer/loyalty/redeem` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/customer/loyalty/rewards` | `getPublicRewards` | — |
| <span class="badge badge-get">GET</span> | `/customer/loyalty/tiers` | `getPublicTiers` | Public routes (no authentication required) |
| <span class="badge badge-get">GET</span> | `/customer/membership/tiers` | `getMembershipTiers` | Get all active membership tiers |
| <span class="badge badge-get">GET</span> | `/customer/membership/tiers/:id` | `getMembershipTierById` | Get specific membership tier details |
| <span class="badge badge-get">GET</span> | `/customer/membership/tiers/:tierId/benefits` | `getTierBenefits` | Get benefits for a specific tier |
| <span class="badge badge-get">GET</span> | `/customer/membership/user/:userId` | `getUserMembershipByUserId` | Get current user's membership |
| <span class="badge badge-get">GET</span> | `/customer/membership/user/:userId/benefits` | `getUserMembershipBenefits` | Get current user's membership benefits |
| <span class="badge badge-get">GET</span> | `/customer/methods` | `getMethods` | Get available shipping methods (for checkout) |
| <span class="badge badge-get">GET</span> | `/customer/notifications` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-get">GET</span> | `/customer/notifications/:id` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-put">PUT</span> | `/customer/notifications/:notificationId/read` | `async (req, res) => {
  try {
    const useCase = new MarkAs` | — |
| <span class="badge badge-patch">PATCH</span> | `/customer/notifications/:notificationId/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-get">GET</span> | `/customer/notifications/count` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-get">GET</span> | `/customer/notifications/devices` | `listDevices` | — |
| <span class="badge badge-post">POST</span> | `/customer/notifications/devices` | `registerDevice` | — |
| <span class="badge badge-delete">DELETE</span> | `/customer/notifications/devices/:deviceToken` | `deleteDevice` | — |
| <span class="badge badge-get">GET</span> | `/customer/notifications/preferences` | `getPreferences` | — |
| <span class="badge badge-post">POST</span> | `/customer/notifications/preferences` | `createPreference` | — |
| <span class="badge badge-get">GET</span> | `/customer/notifications/preferences/:id` | `getPreferenceById` | — |
| <span class="badge badge-put">PUT</span> | `/customer/notifications/preferences/:id` | `updatePreference` | — |
| <span class="badge badge-delete">DELETE</span> | `/customer/notifications/preferences/:id` | `deletePreference` | — |
| <span class="badge badge-put">PUT</span> | `/customer/notifications/preferences/:id/schedule` | `updateSchedule` | — |
| <span class="badge badge-post">POST</span> | `/customer/notifications/preferences/bulk` | `bulkUpdatePreferences` | — |
| <span class="badge badge-get">GET</span> | `/customer/notifications/preferences/type/:type` | `getPreferenceByType` | — |
| <span class="badge badge-put">PUT</span> | `/customer/notifications/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-post">POST</span> | `/customer/notifications/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-get">GET</span> | `/customer/notifications/unread-count` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-get">GET</span> | `/customer/order` | `getMyOrders` | Get customer's orders
GET /orders |
| <span class="badge badge-post">POST</span> | `/customer/order` | `createOrder` | Create a new order
POST /orders |
| <span class="badge badge-get">GET</span> | `/customer/order/:orderId` | `getOrder` | Get order by ID
GET /orders/:orderId |
| <span class="badge badge-post">POST</span> | `/customer/order/:orderId/cancel` | `cancelOrder` | Cancel an order
POST /orders/:orderId/cancel |
| <span class="badge badge-get">GET</span> | `/customer/order/number/:orderNumber` | `getOrderByNumber` | Get order by order number
GET /orders/number/:orderNumber |
| <span class="badge badge-get">GET</span> | `/customer/packaging-types` | `getPackagingTypes` | Get packaging types (for reference) |
| <span class="badge badge-get">GET</span> | `/customer/payment-methods` | `listStoredMethods` | — |
| <span class="badge badge-post">POST</span> | `/customer/payment-methods` | `saveStoredMethod` | — |
| <span class="badge badge-delete">DELETE</span> | `/customer/payment-methods/:methodId` | `deleteStoredMethod` | — |
| <span class="badge badge-post">POST</span> | `/customer/payment-methods/:methodId/default` | `setDefaultMethod` | — |
| <span class="badge badge-get">GET</span> | `/customer/payment/methods` | `getPaymentMethods` | Get available payment methods
GET /payments/methods |
| <span class="badge badge-get">GET</span> | `/customer/payment/orders/:orderId` | `getTransactionByOrder` | Get transactions for an order
GET /payments/orders/:orderId |
| <span class="badge badge-get">GET</span> | `/customer/payment/transactions` | `getMyTransactions` | Get my transactions
GET /payments/transactions |
| <span class="badge badge-get">GET</span> | `/customer/products` | `listProducts` | List products
GET /products |
| <span class="badge badge-get">GET</span> | `/customer/products/:identifier` | `getProduct` | Get product by ID or slug
GET /products/:identifier |
| <span class="badge badge-get">GET</span> | `/customer/products/:productId/availability` | `getProductAvailability` | Get product availability
GET /products/:productId/availability |
| <span class="badge badge-post">POST</span> | `/customer/products/:productId/configure` | `configureVariant` | — |
| <span class="badge badge-get">GET</span> | `/customer/products/:productId/downloads` | `getProductDownloads` | — |
| <span class="badge badge-get">GET</span> | `/customer/products/:productId/qa` | `listProductQaCustomer` | — |
| <span class="badge badge-post">POST</span> | `/customer/products/:productId/qa` | `submitProductQa` | — |
| <span class="badge badge-get">GET</span> | `/customer/products/:productId/related` | `getRelatedProducts` | Get related products
GET /products/:productId/related |
| <span class="badge badge-get">GET</span> | `/customer/products/:productId/reviews` | `getProductReviews` | — |
| <span class="badge badge-post">POST</span> | `/customer/products/:productId/reviews` | `optionalCustomerAuth` | — |
| <span class="badge badge-post">POST</span> | `/customer/products/:productId/reviews/:reviewId/vote` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/customer/products/:productId/similar` | `bind` | Find similar products
GET /customer/products/:productId/similar |
| <span class="badge badge-get">GET</span> | `/customer/products/barcode/:barcode` | `findByBarcode` | Find product by variant barcode
GET /customer/products/barcode/:barcode |
| <span class="badge badge-get">GET</span> | `/customer/products/bundles` | `getActiveBundles` | — |
| <span class="badge badge-get">GET</span> | `/customer/products/bundles/:id` | `getBundleDetails` | — |
| <span class="badge badge-post">POST</span> | `/customer/products/bundles/:id/calculate` | `calculateBundlePrice` | — |
| <span class="badge badge-get">GET</span> | `/customer/products/bundles/product/:productId` | `getBundleByProduct` | — |
| <span class="badge badge-get">GET</span> | `/customer/products/by-attribute/:code/:value` | `bind` | Find products by attribute
GET /customer/products/by-attribute/:code/:value |
| <span class="badge badge-get">GET</span> | `/customer/products/category/:categoryId` | `getProductsByCategory` | Get products by category
GET /products/category/:categoryId |
| <span class="badge badge-get">GET</span> | `/customer/products/featured` | `getFeaturedProducts` | Get featured products
GET /products/featured |
| <span class="badge badge-get">GET</span> | `/customer/products/search` | `bind` | Search products with advanced filters and facets
GET /customer/products/search |
| <span class="badge badge-post">POST</span> | `/customer/products/search` | `bind` | Search products (POST for complex queries)
POST /customer/products/search |
| <span class="badge badge-get">GET</span> | `/customer/products/search/suggestions` | `bind` | Get search suggestions for autocomplete
GET /customer/products/search/suggestions |
| <span class="badge badge-post">POST</span> | `/customer/reviews/:reviewId/helpful` | `optionalCustomerAuth` | — |
| <span class="badge badge-post">POST</span> | `/customer/reviews/:reviewId/report` | `optionalCustomerAuth` | — |
| <span class="badge badge-get">GET</span> | `/customer/stores` | `async (req: TypedRequest, res: Response) => {
  try {
    co` | — |
| <span class="badge badge-get">GET</span> | `/customer/stores/:storeId` | `async (req: TypedRequest, res: Response) => {
  try {
    co` | — |
| <span class="badge badge-get">GET</span> | `/customer/subscriptions/mine` | `isCustomerLoggedIn` | List and view subscriptions |
| <span class="badge badge-get">GET</span> | `/customer/subscriptions/mine/:id` | `isCustomerLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/customer/subscriptions/mine/:id` | `isCustomerLoggedIn` | Manage subscription |
| <span class="badge badge-post">POST</span> | `/customer/subscriptions/mine/:id/cancel` | `cancelMySubscription` | — |
| <span class="badge badge-post">POST</span> | `/customer/subscriptions/mine/:id/change-plan` | `changePlan` | — |
| <span class="badge badge-get">GET</span> | `/customer/subscriptions/mine/:id/orders` | `getMySubscriptionOrders` | Billing history |
| <span class="badge badge-post">POST</span> | `/customer/subscriptions/mine/:id/pause` | `pauseMySubscription` | — |
| <span class="badge badge-post">POST</span> | `/customer/subscriptions/mine/:id/reactivate` | `reactivateMySubscription` | — |
| <span class="badge badge-post">POST</span> | `/customer/subscriptions/mine/:id/resume` | `resumeMySubscription` | — |
| <span class="badge badge-post">POST</span> | `/customer/subscriptions/mine/:id/skip` | `skipNextDelivery` | Skip delivery |
| <span class="badge badge-get">GET</span> | `/customer/subscriptions/plans/:planId` | `getSubscriptionPlanDetails` | — |
| <span class="badge badge-get">GET</span> | `/customer/subscriptions/products` | `getAvailableSubscriptionProducts` | — |
| <span class="badge badge-get">GET</span> | `/customer/subscriptions/products/:productId` | `getSubscriptionProductDetails` | — |
| <span class="badge badge-post">POST</span> | `/customer/subscriptions/subscribe` | `isCustomerLoggedIn` | Create subscription |
| <span class="badge badge-post">POST</span> | `/customer/support/alerts/price` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/customer/support/alerts/price/mine` | `isCustomerLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/customer/support/alerts/price/mine/:id` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/customer/support/alerts/stock` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/customer/support/alerts/stock/mine` | `isCustomerLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/customer/support/alerts/stock/mine/:id` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/customer/support/faq/articles/:id/feedback` | `submitFaqFeedback` | — |
| <span class="badge badge-get">GET</span> | `/customer/support/faq/articles/:slug` | `getFaqArticleBySlug` | — |
| <span class="badge badge-get">GET</span> | `/customer/support/faq/articles/popular` | `getPopularFaqArticles` | — |
| <span class="badge badge-get">GET</span> | `/customer/support/faq/categories` | `getFaqCategories` | — |
| <span class="badge badge-get">GET</span> | `/customer/support/faq/categories/:slug` | `getFaqCategoryBySlug` | — |
| <span class="badge badge-get">GET</span> | `/customer/support/faq/categories/featured` | `getFeaturedFaqCategories` | — |
| <span class="badge badge-get">GET</span> | `/customer/support/faq/search` | `searchFaq` | — |
| <span class="badge badge-post">POST</span> | `/customer/support/tickets` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/customer/support/tickets/mine` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/customer/support/tickets/mine/:id` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/customer/support/tickets/mine/:id/feedback` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/customer/support/tickets/mine/:id/messages` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/customer/tax/calculate` | `calculateTaxForLineItem` | Public tax calculation endpoints |
| <span class="badge badge-post">POST</span> | `/customer/tax/calculate/basket/:basketId` | `isCustomerLoggedIn` | Protected routes require authentication |
| <span class="badge badge-get">GET</span> | `/customer/tax/categories/:code` | `getTaxCategoryByCode` | — |
| <span class="badge badge-get">GET</span> | `/customer/tax/exemption/:customerId` | `isCustomerLoggedIn` | Customer exemption check (requires authentication) |
| <span class="badge badge-get">GET</span> | `/customer/tax/rates` | `getTaxRates` | Public tax information endpoints |
| <span class="badge badge-get">GET</span> | `/customer/tax/settings/:organizationId` | `getCustomerTaxSettings` | NEW: Get public tax settings for storefront |
| <span class="badge badge-post">POST</span> | `/customer/tax/zones/find` | `findTaxZoneForAddress` | NEW: Tax zone finder endpoint |
| <span class="badge badge-post">POST</span> | `/customer/validate` | `(_req, res) => {
  res.json({ success: true, message: 'Valid` | Placeholder routes - implement with DDD controllers |
| <span class="badge badge-get">GET</span> | `/customer/warehouse/:id` | `getStoreById` | — |
| <span class="badge badge-get">GET</span> | `/customer/warehouse/:id/availability/:productId` | `checkStoreAvailability` | — |
| <span class="badge badge-get">GET</span> | `/customer/warehouse/city/:city` | `getStoresByCity` | — |
| <span class="badge badge-get">GET</span> | `/customer/warehouse/country/:country` | `getStoresByCountry` | — |
| <span class="badge badge-get">GET</span> | `/customer/warehouse/nearest` | `findNearestStores` | Store Locator Routes (Public) |

