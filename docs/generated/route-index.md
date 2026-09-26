# Route Index

> Auto-generated from router source files. Do not edit manually.
> Run `yarn docs:routes` to regenerate.

**Total routes:** 1212

## (unmounted)

| Method | Path | Controller | Description |
|---|---|---|---|
| <span class="badge badge-get">GET</span> | `/:fulfillmentId` | `asyncHandler(getFulfillment)` | Get fulfillment by ID (customer view) |
| <span class="badge badge-get">GET</span> | `/:fulfillmentId/track` | `asyncHandler(getTrackingInfo)` | Track fulfillment |
| <span class="badge badge-get">GET</span> | `/analytics/customers/cohorts` | `asyncHandler(analyticsController.getCustomerCohorts)` | GET /business/analytics/customers/cohorts - Get customer cohort analysis |
| <span class="badge badge-get">GET</span> | `/analytics/dashboards` | `asyncHandler(analyticsController.getDashboards)` | GET /business/analytics/dashboards - List dashboards |
| <span class="badge badge-post">POST</span> | `/analytics/dashboards` | `asyncHandler(analyticsController.createDashboard)` | POST /business/analytics/dashboards - Create dashboard |
| <span class="badge badge-get">GET</span> | `/analytics/dashboards/:id` | `asyncHandler(analyticsController.getDashboard)` | GET /business/analytics/dashboards/:id - Get dashboard |
| <span class="badge badge-put">PUT</span> | `/analytics/dashboards/:id` | `asyncHandler(analyticsController.updateDashboard)` | PUT /business/analytics/dashboards/:id - Update dashboard |
| <span class="badge badge-delete">DELETE</span> | `/analytics/dashboards/:id` | `asyncHandler(analyticsController.deleteDashboard)` | DELETE /business/analytics/dashboards/:id - Delete dashboard |
| <span class="badge badge-get">GET</span> | `/analytics/events` | `asyncHandler(analyticsController.getEvents)` | GET /business/analytics/events - Get tracked events |
| <span class="badge badge-get">GET</span> | `/analytics/events/counts` | `asyncHandler(analyticsController.getEventCounts)` | GET /business/analytics/events/counts - Get event counts by period |
| <span class="badge badge-get">GET</span> | `/analytics/products` | `asyncHandler(analyticsController.getProductPerformance)` | GET /business/analytics/products - Get product performance data |
| <span class="badge badge-get">GET</span> | `/analytics/products/top` | `asyncHandler(analyticsController.getTopProducts)` | GET /business/analytics/products/top - Get top performing products |
| <span class="badge badge-get">GET</span> | `/analytics/realtime` | `asyncHandler(analyticsController.getRealTimeMetrics)` | GET /business/analytics/realtime - Get real-time metrics |
| <span class="badge badge-get">GET</span> | `/analytics/sales/daily` | `asyncHandler(analyticsController.getSalesDaily)` | GET /business/analytics/sales/daily - Get daily sales data |
| <span class="badge badge-get">GET</span> | `/analytics/sales/dashboard` | `asyncHandler(analyticsController.getSalesDashboard)` | GET /business/analytics/sales/dashboard - Get sales dashboard with summary |
| <span class="badge badge-get">GET</span> | `/analytics/search` | `asyncHandler(analyticsController.getSearchAnalytics)` | GET /business/analytics/search - Get search analytics |
| <span class="badge badge-get">GET</span> | `/analytics/search/zero-results` | `asyncHandler(analyticsController.getZeroResultSearches)` | GET /business/analytics/search/zero-results - Get zero result searches |
| <span class="badge badge-get">GET</span> | `/analytics/snapshots` | `asyncHandler(analyticsController.getSnapshots)` | GET /business/analytics/snapshots - Get historical snapshots |
| <span class="badge badge-get">GET</span> | `/analytics/snapshots/latest` | `asyncHandler(analyticsController.getLatestSnapshot)` | GET /business/analytics/snapshots/latest - Get latest snapshot |
| <span class="badge badge-get">GET</span> | `/approvals` | `isOrganizationLoggedIn` | Approval workflows |
| <span class="badge badge-post">POST</span> | `/approvals` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/approvals/:workflowId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/approvals/:workflowId/approve` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/approvals/:workflowId/cancel` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/approvals/:workflowId/escalate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/approvals/:workflowId/reject` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/attribute-groups` | `asyncHandler(attributeGroupController.listAttributeGroups.bi` | — |
| <span class="badge badge-post">POST</span> | `/attribute-groups` | `asyncHandler(attributeGroupController.createAttributeGroup.b` | — |
| <span class="badge badge-get">GET</span> | `/attribute-groups/:id` | `asyncHandler(attributeGroupController.getAttributeGroup.bind` | — |
| <span class="badge badge-put">PUT</span> | `/attribute-groups/:id` | `asyncHandler(attributeGroupController.updateAttributeGroup.b` | — |
| <span class="badge badge-delete">DELETE</span> | `/attribute-groups/:id` | `asyncHandler(attributeGroupController.deleteAttributeGroup.b` | — |
| <span class="badge badge-get">GET</span> | `/attribute-groups/code/:code` | `asyncHandler(attributeGroupController.getAttributeGroupByCod` | — |
| <span class="badge badge-post">POST</span> | `/attribute-options` | `asyncHandler(attributeOptionController.createAttributeOption` | — |
| <span class="badge badge-get">GET</span> | `/attribute-options/:id` | `asyncHandler(attributeOptionController.getAttributeOption.bi` | — |
| <span class="badge badge-put">PUT</span> | `/attribute-options/:id` | `asyncHandler(attributeOptionController.updateAttributeOption` | — |
| <span class="badge badge-delete">DELETE</span> | `/attribute-options/:id` | `asyncHandler(attributeOptionController.deleteAttributeOption` | — |
| <span class="badge badge-get">GET</span> | `/attribute-options/attribute/:attributeId` | `asyncHandler(attributeOptionController.getOptionsByAttribute` | — |
| <span class="badge badge-get">GET</span> | `/attribute-options/attribute/:attributeId/value/:value` | `asyncHandler(attributeOptionController.getOptionByValue.bind` | — |
| <span class="badge badge-get">GET</span> | `/attribute-sets` | `asyncHandler(attributeSetController.listAttributeSets.bind(a` | — |
| <span class="badge badge-post">POST</span> | `/attribute-sets` | `asyncHandler(attributeSetController.createAttributeSet.bind(` | — |
| <span class="badge badge-get">GET</span> | `/attribute-sets/:id` | `asyncHandler(attributeSetController.getAttributeSet.bind(att` | — |
| <span class="badge badge-put">PUT</span> | `/attribute-sets/:id` | `asyncHandler(attributeSetController.updateAttributeSet.bind(` | — |
| <span class="badge badge-delete">DELETE</span> | `/attribute-sets/:id` | `asyncHandler(attributeSetController.deleteAttributeSet.bind(` | — |
| <span class="badge badge-post">POST</span> | `/attribute-sets/:id/attributes` | `asyncHandler(attributeSetController.addAttributeToSet.bind(a` | — |
| <span class="badge badge-delete">DELETE</span> | `/attribute-sets/:id/attributes/:attributeId` | `asyncHandler(attributeSetController.removeAttributeFromSet.b` | — |
| <span class="badge badge-post">POST</span> | `/attribute-sets/:id/attributes/reorder` | `asyncHandler(attributeSetController.reorderAttributes.bind(a` | — |
| <span class="badge badge-get">GET</span> | `/attributes` | `isOrganizationLoggedIn` | List all attributes |
| <span class="badge badge-post">POST</span> | `/attributes` | `isOrganizationLoggedIn` | Create attribute |
| <span class="badge badge-get">GET</span> | `/attributes` | `asyncHandler(attributeController.listAttributes.bind(attribu` | — |
| <span class="badge badge-post">POST</span> | `/attributes` | `asyncHandler(attributeController.createAttribute.bind(attrib` | — |
| <span class="badge badge-get">GET</span> | `/attributes/:id` | `isOrganizationLoggedIn` | Get attribute by ID |
| <span class="badge badge-put">PUT</span> | `/attributes/:id` | `isOrganizationLoggedIn` | Update attribute |
| <span class="badge badge-delete">DELETE</span> | `/attributes/:id` | `isOrganizationLoggedIn` | Delete attribute |
| <span class="badge badge-get">GET</span> | `/attributes/:id` | `asyncHandler(attributeController.getAttribute.bind(attribute` | — |
| <span class="badge badge-put">PUT</span> | `/attributes/:id` | `asyncHandler(attributeController.updateAttribute.bind(attrib` | — |
| <span class="badge badge-delete">DELETE</span> | `/attributes/:id` | `asyncHandler(attributeController.deleteAttribute.bind(attrib` | — |
| <span class="badge badge-get">GET</span> | `/attributes/:id/values` | `isOrganizationLoggedIn` | Get attribute values |
| <span class="badge badge-post">POST</span> | `/attributes/:id/values` | `isOrganizationLoggedIn` | Add attribute value |
| <span class="badge badge-get">GET</span> | `/attributes/:id/values` | `asyncHandler(attributeController.getAttributeValues.bind(att` | Attribute Values |
| <span class="badge badge-post">POST</span> | `/attributes/:id/values` | `asyncHandler(attributeController.addAttributeValue.bind(attr` | — |
| <span class="badge badge-delete">DELETE</span> | `/attributes/:id/values/:valueId` | `isOrganizationLoggedIn` | Remove attribute value |
| <span class="badge badge-delete">DELETE</span> | `/attributes/:id/values/:valueId` | `asyncHandler(attributeController.removeAttributeValue.bind(a` | — |
| <span class="badge badge-get">GET</span> | `/attributes/code/:code` | `isOrganizationLoggedIn` | Get attribute by code |
| <span class="badge badge-get">GET</span> | `/attributes/code/:code` | `asyncHandler(attributeController.getAttributeByCode.bind(att` | — |
| <span class="badge badge-get">GET</span> | `/attributes/group/:groupId` | `asyncHandler(attributeController.listAttributesByGroup.bind(` | — |
| <span class="badge badge-post">POST</span> | `/auth/cleanup-tokens` | `asyncHandler(cleanupExpiredTokens)` | — |
| <span class="badge badge-post">POST</span> | `/auth/force-reset` | `asyncHandler(forceResetPassword)` | — |
| <span class="badge badge-post">POST</span> | `/auth/forgot-password` | `asyncHandler(requestPasswordReset)` | Password reset flow |
| <span class="badge badge-post">POST</span> | `/auth/login` | `asyncHandler(loginOrganization)` | Simple login (returns access token only) |
| <span class="badge badge-post">POST</span> | `/auth/refresh` | `asyncHandler(renewAccessToken)` | Refresh access token |
| <span class="badge badge-post">POST</span> | `/auth/register` | `asyncHandler(registerOrganization)` | Register new merchant account |
| <span class="badge badge-post">POST</span> | `/auth/reset-password` | `asyncHandler(resetPassword)` | — |
| <span class="badge badge-post">POST</span> | `/auth/revoke-tokens` | `asyncHandler(revokeUserTokens)` | — |
| <span class="badge badge-get">GET</span> | `/auth/stores/:storeId/users` | `asyncHandler(listStoreUsers)` | — |
| <span class="badge badge-post">POST</span> | `/auth/token` | `asyncHandler(issueTokenPair)` | Token-based auth (returns access + refresh tokens) |
| <span class="badge badge-get">GET</span> | `/auth/user/:userId` | `asyncHandler(getUserAuthDetails)` | — |
| <span class="badge badge-post">POST</span> | `/auth/users/:userId/stores` | `asyncHandler(assignUserToStore)` | — |
| <span class="badge badge-get">GET</span> | `/auth/users/:userId/stores` | `asyncHandler(getUserStores)` | — |
| <span class="badge badge-delete">DELETE</span> | `/auth/users/:userId/stores/:storeId` | `asyncHandler(removeUserFromStore)` | — |
| <span class="badge badge-post">POST</span> | `/auth/validate` | `asyncHandler(checkTokenValidity)` | Validate token |
| <span class="badge badge-get">GET</span> | `/automation` | `isOrganizationLoggedIn` | Rule CRUD |
| <span class="badge badge-post">POST</span> | `/automation` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/automation/:ruleId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/automation/:ruleId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/automation/:ruleId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/automation/:ruleId/logs` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/automation/:ruleId/trigger` | `isOrganizationLoggedIn` | Manual trigger & execution logs |
| <span class="badge badge-get">GET</span> | `/basket` | `asyncHandler(basketController.listBaskets)` | List/search baskets (admin) |
| <span class="badge badge-post">POST</span> | `/basket` | `asyncHandler(basketController.getOrCreateBasket)` | Get or create basket for current user/session
POST /basket |
| <span class="badge badge-get">GET</span> | `/basket/:basketId` | `asyncHandler(basketController.getBasket)` | Get basket by ID |
| <span class="badge badge-delete">DELETE</span> | `/basket/:basketId` | `asyncHandler(basketController.deleteBasket)` | Delete basket |
| <span class="badge badge-get">GET</span> | `/basket/:basketId` | `asyncHandler(basketController.getBasket)` | Get basket by ID
GET /basket/:basketId |
| <span class="badge badge-delete">DELETE</span> | `/basket/:basketId` | `asyncHandler(basketController.deleteBasket)` | Delete basket
DELETE /basket/:basketId |
| <span class="badge badge-post">POST</span> | `/basket/:basketId/assign` | `asyncHandler(basketController.assignToCustomer)` | Assign basket to customer |
| <span class="badge badge-post">POST</span> | `/basket/:basketId/assign` | `asyncHandler(basketController.assignToCustomer)` | Assign basket to customer
POST /basket/:basketId/assign |
| <span class="badge badge-post">POST</span> | `/basket/:basketId/coupon` | `asyncHandler(basketController.applyCouponAdmin)` | Apply coupon (admin override) |
| <span class="badge badge-delete">DELETE</span> | `/basket/:basketId/coupon` | `asyncHandler(basketController.removeCoupon)` | Remove coupon |
| <span class="badge badge-post">POST</span> | `/basket/:basketId/coupon` | `asyncHandler(basketController.applyCoupon)` | Apply coupon to basket
POST /basket/:basketId/coupon |
| <span class="badge badge-delete">DELETE</span> | `/basket/:basketId/coupon` | `asyncHandler(basketController.removeCoupon)` | Remove coupon from basket
DELETE /basket/:basketId/coupon |
| <span class="badge badge-put">PUT</span> | `/basket/:basketId/expiration` | `asyncHandler(basketController.extendExpiration)` | Extend expiration |
| <span class="badge badge-put">PUT</span> | `/basket/:basketId/expiration` | `asyncHandler(basketController.extendExpiration)` | Extend basket expiration
PUT /basket/:basketId/expiration |
| <span class="badge badge-post">POST</span> | `/basket/:basketId/items` | `asyncHandler(basketController.addItem)` | Add item to basket
POST /basket/:basketId/items |
| <span class="badge badge-delete">DELETE</span> | `/basket/:basketId/items` | `asyncHandler(basketController.clearBasket)` | Clear all items from basket
DELETE /basket/:basketId/items |
| <span class="badge badge-patch">PATCH</span> | `/basket/:basketId/items/:basketItemId` | `asyncHandler(basketController.updateItemQuantity)` | Update item quantity
PATCH /basket/:basketId/items/:basketItemId |
| <span class="badge badge-delete">DELETE</span> | `/basket/:basketId/items/:basketItemId` | `asyncHandler(basketController.removeItem)` | Remove item from basket
DELETE /basket/:basketId/items/:basketItemId |
| <span class="badge badge-post">POST</span> | `/basket/:basketId/items/:basketItemId/gift` | `asyncHandler(basketController.setItemAsGift)` | Set item as gift
POST /basket/:basketId/items/:basketItemId/gift |
| <span class="badge badge-get">GET</span> | `/basket/:basketId/summary` | `asyncHandler(basketController.getBasketSummary)` | Get basket summary |
| <span class="badge badge-get">GET</span> | `/basket/:basketId/summary` | `asyncHandler(basketController.getBasketSummary)` | Get basket summary (lightweight response)
GET /basket/:basketId/summary |
| <span class="badge badge-get">GET</span> | `/basket/me` | `asyncHandler(basketController.getMyBasket)` | Get current user's basket
GET /basket/me |
| <span class="badge badge-post">POST</span> | `/basket/merge` | `asyncHandler(basketController.mergeBaskets)` | Merge baskets (typically when guest logs in)
POST /basket/merge |
| <span class="badge badge-get">GET</span> | `/bundles` | `asyncHandler(bundleController.getBundles)` | — |
| <span class="badge badge-post">POST</span> | `/bundles` | `asyncHandler(bundleController.createBundle)` | — |
| <span class="badge badge-get">GET</span> | `/bundles/:id` | `asyncHandler(bundleController.getBundle)` | — |
| <span class="badge badge-put">PUT</span> | `/bundles/:id` | `asyncHandler(bundleController.updateBundle)` | — |
| <span class="badge badge-delete">DELETE</span> | `/bundles/:id` | `asyncHandler(bundleController.deleteBundle)` | — |
| <span class="badge badge-post">POST</span> | `/bundles/:id/items` | `asyncHandler(bundleController.addBundleItem)` | — |
| <span class="badge badge-put">PUT</span> | `/bundles/:id/items/:itemId` | `asyncHandler(bundleController.updateBundleItem)` | — |
| <span class="badge badge-delete">DELETE</span> | `/bundles/:id/items/:itemId` | `asyncHandler(bundleController.deleteBundleItem)` | — |
| <span class="badge badge-post">POST</span> | `/calculate-rates` | `asyncHandler(shippingController.calculateRates)` | — |
| <span class="badge badge-post">POST</span> | `/calculate-rates` | `asyncHandler(shippingController.calculateRates)` | Calculate shipping rates for an order |
| <span class="badge badge-get">GET</span> | `/carriers` | `asyncHandler(shippingController.getCarriers)` | — |
| <span class="badge badge-post">POST</span> | `/carriers` | `asyncHandler(shippingController.createCarrier)` | — |
| <span class="badge badge-get">GET</span> | `/carriers/:id` | `asyncHandler(shippingController.getCarrierById)` | — |
| <span class="badge badge-put">PUT</span> | `/carriers/:id` | `asyncHandler(shippingController.updateCarrier)` | — |
| <span class="badge badge-delete">DELETE</span> | `/carriers/:id` | `asyncHandler(shippingController.deleteCarrier)` | — |
| <span class="badge badge-post">POST</span> | `/cart-promotions` | `asyncHandler(cartPromotionController.applyPromotion)` | — |
| <span class="badge badge-get">GET</span> | `/cart-promotions/:id` | `asyncHandler(cartPromotionController.getCartPromotionById)` | Cart Promotion routes |
| <span class="badge badge-put">PUT</span> | `/cart-promotions/:id` | `asyncHandler(cartPromotionController.updateCartPromotion)` | — |
| <span class="badge badge-delete">DELETE</span> | `/cart-promotions/:id` | `asyncHandler(cartPromotionController.removePromotion)` | — |
| <span class="badge badge-get">GET</span> | `/cart-promotions/cart/:cartId` | `asyncHandler(cartPromotionController.getPromotionsByCartId)` | — |
| <span class="badge badge-get">GET</span> | `/categories` | `asyncHandler(categoryController.listCategories)` | List all active categories
GET /customer/categories
Query params: ?featured=true | ?menu=true | ?root=true |
| <span class="badge badge-get">GET</span> | `/categories` | `asyncHandler(categoryController.listCategories)` | — |
| <span class="badge badge-post">POST</span> | `/categories` | `asyncHandler(categoryController.createCategory)` | — |
| <span class="badge badge-get">GET</span> | `/categories/:categoryId/children` | `asyncHandler(categoryController.getCategoryChildren)` | Get subcategories of a parent category
GET /customer/categories/:categoryId/children |
| <span class="badge badge-get">GET</span> | `/categories/:id` | `asyncHandler(categoryController.getCategory)` | — |
| <span class="badge badge-put">PUT</span> | `/categories/:id` | `asyncHandler(categoryController.updateCategory)` | — |
| <span class="badge badge-delete">DELETE</span> | `/categories/:id` | `asyncHandler(categoryController.deleteCategory)` | — |
| <span class="badge badge-get">GET</span> | `/categories/:id/children` | `asyncHandler(categoryController.getCategoryChildren)` | — |
| <span class="badge badge-get">GET</span> | `/categories/:identifier` | `asyncHandler(categoryController.getCategory)` | Get category by ID or slug
GET /customer/categories/:identifier |
| <span class="badge badge-get">GET</span> | `/categories/root` | `asyncHandler(categoryController.getRootCategories)` | — |
| <span class="badge badge-get">GET</span> | `/categories/slug/:slug` | `asyncHandler(categoryController.getCategoryBySlug)` | — |
| <span class="badge badge-post">POST</span> | `/category-promotions` | `asyncHandler(categoryPromotionController.createCategoryPromo` | — |
| <span class="badge badge-get">GET</span> | `/category-promotions/:id` | `asyncHandler(categoryPromotionController.getCategoryPromotio` | — |
| <span class="badge badge-put">PUT</span> | `/category-promotions/:id` | `asyncHandler(categoryPromotionController.updateCategoryPromo` | — |
| <span class="badge badge-delete">DELETE</span> | `/category-promotions/:id` | `asyncHandler(categoryPromotionController.deleteCategoryPromo` | — |
| <span class="badge badge-get">GET</span> | `/category-promotions/active` | `asyncHandler(categoryPromotionController.getActiveCategoryPr` | Category Promotion routes |
| <span class="badge badge-get">GET</span> | `/category-promotions/category/:categoryId` | `asyncHandler(categoryPromotionController.getPromotionsByCate` | — |
| <span class="badge badge-post">POST</span> | `/checkout` | `asyncHandler(checkoutController.initiateCheckout)` | Initiate checkout session
POST /checkout |
| <span class="badge badge-get">GET</span> | `/checkout/:checkoutId` | `asyncHandler(checkoutController.getCheckout)` | Get checkout session
GET /checkout/:checkoutId |
| <span class="badge badge-post">POST</span> | `/checkout/:checkoutId/abandon` | `asyncHandler(checkoutController.abandonCheckout)` | Abandon checkout
POST /checkout/:checkoutId/abandon |
| <span class="badge badge-put">PUT</span> | `/checkout/:checkoutId/billing-address` | `asyncHandler(checkoutController.setBillingAddress)` | Set billing address
PUT /checkout/:checkoutId/billing-address |
| <span class="badge badge-post">POST</span> | `/checkout/:checkoutId/complete` | `asyncHandler(checkoutController.completeCheckout)` | Complete checkout and create order
POST /checkout/:checkoutId/complete |
| <span class="badge badge-post">POST</span> | `/checkout/:checkoutId/coupon` | `asyncHandler(checkoutController.applyCoupon)` | Apply coupon code
POST /checkout/:checkoutId/coupon |
| <span class="badge badge-delete">DELETE</span> | `/checkout/:checkoutId/coupon` | `asyncHandler(checkoutController.removeCoupon)` | Remove coupon code
DELETE /checkout/:checkoutId/coupon |
| <span class="badge badge-put">PUT</span> | `/checkout/:checkoutId/fulfillment-method` | `asyncHandler(checkoutController.setFulfillmentMethod)` | Set fulfillment method (shipping, pickup, local_delivery, digital)
PUT /checkout/:checkoutId/fulfillment-method |
| <span class="badge badge-get">GET</span> | `/checkout/:checkoutId/fulfillment-options` | `asyncHandler(checkoutController.getFulfillmentOptions)` | Get all fulfillment options (unified)
GET /checkout/:checkoutId/fulfillment-options |
| <span class="badge badge-get">GET</span> | `/checkout/:checkoutId/local-delivery-options` | `asyncHandler(checkoutController.getLocalDeliveryOptions)` | Get local delivery options
GET /checkout/:checkoutId/local-delivery-options |
| <span class="badge badge-post">POST</span> | `/checkout/:checkoutId/payment-intent` | `asyncHandler(checkoutController.createPaymentIntent)` | Create payment intent and draft order
POST /checkout/:checkoutId/payment-intent |
| <span class="badge badge-put">PUT</span> | `/checkout/:checkoutId/payment-method` | `asyncHandler(checkoutController.setPaymentMethod)` | Set payment method
PUT /checkout/:checkoutId/payment-method |
| <span class="badge badge-put">PUT</span> | `/checkout/:checkoutId/pickup-location` | `asyncHandler(checkoutController.setPickupLocation)` | Set pickup location (BOPIS)
PUT /checkout/:checkoutId/pickup-location |
| <span class="badge badge-get">GET</span> | `/checkout/:checkoutId/pickup-slots` | `asyncHandler(checkoutController.getPickupSlots)` | Get available pickup time slots
GET /checkout/:checkoutId/pickup-slots |
| <span class="badge badge-put">PUT</span> | `/checkout/:checkoutId/shipping-address` | `asyncHandler(checkoutController.setShippingAddress)` | Set shipping address
PUT /checkout/:checkoutId/shipping-address |
| <span class="badge badge-put">PUT</span> | `/checkout/:checkoutId/shipping-method` | `asyncHandler(checkoutController.setShippingMethod)` | Set shipping method
PUT /checkout/:checkoutId/shipping-method |
| <span class="badge badge-get">GET</span> | `/checkout/:checkoutId/shipping-methods` | `asyncHandler(checkoutController.getShippingMethods)` | Get available shipping methods
GET /checkout/:checkoutId/shipping-methods |
| <span class="badge badge-get">GET</span> | `/checkout/:checkoutId/summary` | `asyncHandler(checkoutController.getCheckoutSummary)` | Get checkout summary
GET /checkout/:checkoutId/summary |
| <span class="badge badge-get">GET</span> | `/checkout/payment-methods` | `asyncHandler(checkoutController.getPaymentMethods)` | Get available payment methods (no checkout required)
GET /checkout/payment-methods |
| <span class="badge badge-get">GET</span> | `/checkout/pickup-locations` | `asyncHandler(checkoutController.getPickupLocations)` | Get available pickup locations
GET /checkout/pickup-locations |
| <span class="badge badge-get">GET</span> | `/collections` | `asyncHandler(productController.listCollections)` | — |
| <span class="badge badge-post">POST</span> | `/collections` | `asyncHandler(productController.createCollection)` | — |
| <span class="badge badge-put">PUT</span> | `/collections/:collectionId` | `asyncHandler(productController.updateCollection)` | — |
| <span class="badge badge-delete">DELETE</span> | `/collections/:collectionId` | `asyncHandler(productController.deleteCollection)` | — |
| <span class="badge badge-get">GET</span> | `/commission-rules` | `isOrganizationLoggedIn` | Commission rules |
| <span class="badge badge-post">POST</span> | `/commission-rules` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/commission-rules/:ruleId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/commission-rules/:ruleId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/commission-rules/:ruleId/activate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/commission-rules/:ruleId/deactivate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/commission-rules/:ruleId/priority` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/commission-rules/:ruleId/rate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/commission-rules/:ruleId/validity` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/commission-rules/calculate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/companies` | `isOrganizationLoggedIn` | Company CRUD + lifecycle |
| <span class="badge badge-post">POST</span> | `/companies` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/companies/:companyId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/companies/:companyId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/companies/:companyId/approve` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/companies/:companyId/credit-limit` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/companies/:companyId/payment-terms` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/companies/:companyId/reactivate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/companies/:companyId/subsidiaries` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/companies/:companyId/suspend` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/companies/:companyId/terminate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/configuration` | `asyncHandler(systemConfigurationController.createSystemConfi` | Create system configuration |
| <span class="badge badge-get">GET</span> | `/configuration` | `asyncHandler(systemConfigurationController.listSystemConfigu` | List all system configurations |
| <span class="badge badge-put">PUT</span> | `/configuration/:configId` | `asyncHandler(systemConfigurationController.updateSystemConfi` | Update system configuration |
| <span class="badge badge-get">GET</span> | `/configuration/:configId` | `asyncHandler(systemConfigurationController.getSystemConfigur` | Get system configuration by ID |
| <span class="badge badge-get">GET</span> | `/configuration/active` | `asyncHandler(systemConfigurationController.getActiveSystemCo` | Get active system configuration (must be before /:configId to avoid matching "active" as an ID) |
| <span class="badge badge-post">POST</span> | `/content/blocks` | `asyncHandler(contentController.createBlock)` | — |
| <span class="badge badge-get">GET</span> | `/content/blocks/:id` | `asyncHandler(contentController.getBlockById)` | — |
| <span class="badge badge-put">PUT</span> | `/content/blocks/:id` | `asyncHandler(contentController.updateBlock)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/blocks/:id` | `asyncHandler(contentController.deleteBlock)` | — |
| <span class="badge badge-get">GET</span> | `/content/categories` | `asyncHandler(contentController.getCategories)` | Content Category routes |
| <span class="badge badge-post">POST</span> | `/content/categories` | `asyncHandler(contentController.createCategory)` | — |
| <span class="badge badge-get">GET</span> | `/content/categories/:categoryId/pages` | `asyncHandler(contentController.getPagesByCategory)` | — |
| <span class="badge badge-get">GET</span> | `/content/categories/:id` | `asyncHandler(contentController.getCategoryById)` | — |
| <span class="badge badge-put">PUT</span> | `/content/categories/:id` | `asyncHandler(contentController.updateCategory)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/categories/:id` | `asyncHandler(contentController.deleteCategory)` | — |
| <span class="badge badge-post">POST</span> | `/content/categories/:id/move` | `asyncHandler(contentController.moveCategory)` | — |
| <span class="badge badge-get">GET</span> | `/content/categories/tree` | `asyncHandler(contentController.getCategoryTree)` | — |
| <span class="badge badge-get">GET</span> | `/content/media` | `asyncHandler(contentController.getMedia)` | Content Media routes |
| <span class="badge badge-post">POST</span> | `/content/media` | `asyncHandler(contentController.uploadMedia)` | — |
| <span class="badge badge-get">GET</span> | `/content/media-folders` | `asyncHandler(contentController.getMediaFolders)` | Media Folder routes |
| <span class="badge badge-post">POST</span> | `/content/media-folders` | `asyncHandler(contentController.createMediaFolder)` | — |
| <span class="badge badge-put">PUT</span> | `/content/media-folders/:id` | `asyncHandler(contentController.updateMediaFolder)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/media-folders/:id` | `asyncHandler(contentController.deleteMediaFolder)` | — |
| <span class="badge badge-get">GET</span> | `/content/media-folders/tree` | `asyncHandler(contentController.getMediaFolderTree)` | — |
| <span class="badge badge-get">GET</span> | `/content/media/:id` | `asyncHandler(contentController.getMediaById)` | — |
| <span class="badge badge-put">PUT</span> | `/content/media/:id` | `asyncHandler(contentController.updateMedia)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/media/:id` | `asyncHandler(contentController.deleteMedia)` | — |
| <span class="badge badge-get">GET</span> | `/content/media/:mediaId/usage` | `asyncHandler(contentController.getMediaUsage)` | Media Usage routes |
| <span class="badge badge-get">GET</span> | `/content/media/:mediaId/usage/count` | `asyncHandler(contentController.getMediaUsageCount)` | — |
| <span class="badge badge-post">POST</span> | `/content/media/move` | `asyncHandler(contentController.moveMediaToFolder)` | — |
| <span class="badge badge-post">POST</span> | `/content/media/usage` | `asyncHandler(contentController.trackMediaUsage)` | — |
| <span class="badge badge-get">GET</span> | `/content/media/usage/:entityType/:entityId` | `asyncHandler(contentController.getMediaUsageByEntity)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/media/usage/:usageId` | `asyncHandler(contentController.untrackMediaUsage)` | — |
| <span class="badge badge-put">PUT</span> | `/content/navigation-items/:id` | `asyncHandler(contentController.updateNavigationItem)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/navigation-items/:id` | `asyncHandler(contentController.deleteNavigationItem)` | — |
| <span class="badge badge-get">GET</span> | `/content/navigations` | `asyncHandler(contentController.getNavigations)` | Content Navigation routes |
| <span class="badge badge-post">POST</span> | `/content/navigations` | `asyncHandler(contentController.createNavigation)` | — |
| <span class="badge badge-get">GET</span> | `/content/navigations/:id` | `asyncHandler(contentController.getNavigationById)` | — |
| <span class="badge badge-put">PUT</span> | `/content/navigations/:id` | `asyncHandler(contentController.updateNavigation)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/navigations/:id` | `asyncHandler(contentController.deleteNavigation)` | — |
| <span class="badge badge-get">GET</span> | `/content/navigations/:id/items` | `asyncHandler(contentController.getNavigationWithItems)` | — |
| <span class="badge badge-post">POST</span> | `/content/navigations/:navigationId/items` | `asyncHandler(contentController.addNavigationItem)` | Navigation Item routes |
| <span class="badge badge-post">POST</span> | `/content/navigations/:navigationId/items/reorder` | `asyncHandler(contentController.reorderNavigationItems)` | — |
| <span class="badge badge-get">GET</span> | `/content/pages` | `asyncHandler(contentController.getPages)` | Content Page routes |
| <span class="badge badge-post">POST</span> | `/content/pages` | `asyncHandler(contentController.createPage)` | — |
| <span class="badge badge-get">GET</span> | `/content/pages` | `asyncHandler(getPublishedPages)` | Public content routes (no auth required, only published/active content) |
| <span class="badge badge-get">GET</span> | `/content/pages/:id` | `asyncHandler(contentController.getPageById)` | — |
| <span class="badge badge-put">PUT</span> | `/content/pages/:id` | `asyncHandler(contentController.updatePage)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/pages/:id` | `asyncHandler(contentController.deletePage)` | — |
| <span class="badge badge-post">POST</span> | `/content/pages/:id/duplicate` | `asyncHandler(contentController.duplicatePage)` | — |
| <span class="badge badge-get">GET</span> | `/content/pages/:id/full` | `asyncHandler(contentController.getFullPageById)` | — |
| <span class="badge badge-post">POST</span> | `/content/pages/:id/publish` | `asyncHandler(contentController.publishPage)` | Page Actions routes |
| <span class="badge badge-post">POST</span> | `/content/pages/:id/schedule` | `asyncHandler(contentController.schedulePage)` | — |
| <span class="badge badge-post">POST</span> | `/content/pages/:id/unpublish` | `asyncHandler(contentController.unpublishPage)` | — |
| <span class="badge badge-get">GET</span> | `/content/pages/:pageId/blocks` | `asyncHandler(contentController.getPageBlocks)` | Content Block routes |
| <span class="badge badge-post">POST</span> | `/content/pages/:pageId/blocks/reorder` | `asyncHandler(contentController.reorderBlocks)` | — |
| <span class="badge badge-get">GET</span> | `/content/pages/:pageId/categories` | `asyncHandler(contentController.getPageCategories)` | Categorization routes |
| <span class="badge badge-post">POST</span> | `/content/pages/:pageId/categories` | `asyncHandler(contentController.assignPageToCategory)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/pages/:pageId/categories/:categoryId` | `asyncHandler(contentController.removePageFromCategory)` | — |
| <span class="badge badge-post">POST</span> | `/content/pages/:pageId/categories/primary` | `asyncHandler(contentController.setPrimaryCategory)` | — |
| <span class="badge badge-get">GET</span> | `/content/pages/:pageId/translations` | `asyncHandler(contentController.getPageTranslations)` | Page Translation routes |
| <span class="badge badge-post">POST</span> | `/content/pages/:pageId/translations` | `asyncHandler(contentController.createPageTranslation)` | — |
| <span class="badge badge-get">GET</span> | `/content/pages/:pageId/translations/:localeId` | `asyncHandler(contentController.getPageTranslationByLocale)` | — |
| <span class="badge badge-get">GET</span> | `/content/pages/:pageId/versions` | `asyncHandler(contentController.getPageVersions)` | Page Version routes |
| <span class="badge badge-post">POST</span> | `/content/pages/:pageId/versions` | `asyncHandler(contentController.createPageVersion)` | — |
| <span class="badge badge-post">POST</span> | `/content/pages/:pageId/versions/:versionId/restore` | `asyncHandler(contentController.restorePageVersion)` | — |
| <span class="badge badge-get">GET</span> | `/content/pages/:slug` | `asyncHandler(getPublishedPageBySlug)` | — |
| <span class="badge badge-get">GET</span> | `/content/redirects` | `asyncHandler(contentController.getRedirects)` | Content Redirect routes |
| <span class="badge badge-post">POST</span> | `/content/redirects` | `asyncHandler(contentController.createRedirect)` | — |
| <span class="badge badge-get">GET</span> | `/content/redirects/:id` | `asyncHandler(contentController.getRedirectById)` | — |
| <span class="badge badge-put">PUT</span> | `/content/redirects/:id` | `asyncHandler(contentController.updateRedirect)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/redirects/:id` | `asyncHandler(contentController.deleteRedirect)` | — |
| <span class="badge badge-get">GET</span> | `/content/templates` | `asyncHandler(contentController.getTemplates)` | Content Template routes |
| <span class="badge badge-post">POST</span> | `/content/templates` | `asyncHandler(contentController.createTemplate)` | — |
| <span class="badge badge-get">GET</span> | `/content/templates/:id` | `asyncHandler(contentController.getTemplateById)` | — |
| <span class="badge badge-put">PUT</span> | `/content/templates/:id` | `asyncHandler(contentController.updateTemplate)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/templates/:id` | `asyncHandler(contentController.deleteTemplate)` | — |
| <span class="badge badge-post">POST</span> | `/content/templates/:id/duplicate` | `asyncHandler(contentController.duplicateTemplate)` | — |
| <span class="badge badge-put">PUT</span> | `/content/translations/:translationId` | `asyncHandler(contentController.updatePageTranslation)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/translations/:translationId` | `asyncHandler(contentController.deletePageTranslation)` | — |
| <span class="badge badge-get">GET</span> | `/content/types` | `asyncHandler(contentController.getContentTypes)` | Content Type routes |
| <span class="badge badge-post">POST</span> | `/content/types` | `asyncHandler(contentController.createContentType)` | — |
| <span class="badge badge-get">GET</span> | `/content/types` | `asyncHandler(getActiveContentTypes)` | — |
| <span class="badge badge-get">GET</span> | `/content/types/:id` | `asyncHandler(contentController.getContentTypeById)` | — |
| <span class="badge badge-put">PUT</span> | `/content/types/:id` | `asyncHandler(contentController.updateContentType)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/types/:id` | `asyncHandler(contentController.deleteContentType)` | — |
| <span class="badge badge-get">GET</span> | `/content/types/slug/:slug` | `asyncHandler(contentController.getContentTypeBySlug)` | — |
| <span class="badge badge-delete">DELETE</span> | `/content/versions/:versionId` | `asyncHandler(contentController.deletePageVersion)` | — |
| <span class="badge badge-get">GET</span> | `/countries` | `asyncHandler(localizationController.getCountries)` | Country CRUD |
| <span class="badge badge-post">POST</span> | `/countries` | `asyncHandler(localizationController.createCountry)` | — |
| <span class="badge badge-get">GET</span> | `/countries/:id` | `asyncHandler(localizationController.getCountryById)` | — |
| <span class="badge badge-put">PUT</span> | `/countries/:id` | `asyncHandler(localizationController.updateCountry)` | — |
| <span class="badge badge-delete">DELETE</span> | `/countries/:id` | `asyncHandler(localizationController.deleteCountry)` | — |
| <span class="badge badge-post">POST</span> | `/countries/:id/activate` | `asyncHandler(localizationController.activateCountry)` | Country status management |
| <span class="badge badge-post">POST</span> | `/countries/:id/deactivate` | `asyncHandler(localizationController.deactivateCountry)` | — |
| <span class="badge badge-get">GET</span> | `/countries/code/:code` | `asyncHandler(localizationController.getCountryByCode)` | — |
| <span class="badge badge-get">GET</span> | `/countries/region/:region` | `asyncHandler(localizationController.getCountriesByRegion)` | — |
| <span class="badge badge-get">GET</span> | `/coupons` | `asyncHandler(listCoupons)` | — |
| <span class="badge badge-post">POST</span> | `/coupons` | `asyncHandler(createCoupon)` | — |
| <span class="badge badge-get">GET</span> | `/coupons` | `asyncHandler(couponController.getActiveCoupons)` | Coupon routes |
| <span class="badge badge-post">POST</span> | `/coupons` | `asyncHandler(couponController.createCoupon)` | — |
| <span class="badge badge-get">GET</span> | `/coupons/:couponId` | `asyncHandler(getCoupon)` | — |
| <span class="badge badge-delete">DELETE</span> | `/coupons/:couponId` | `asyncHandler(deleteCoupon)` | — |
| <span class="badge badge-get">GET</span> | `/coupons/:id` | `asyncHandler(couponController.getCouponById)` | — |
| <span class="badge badge-put">PUT</span> | `/coupons/:id` | `asyncHandler(couponController.updateCoupon)` | — |
| <span class="badge badge-delete">DELETE</span> | `/coupons/:id` | `asyncHandler(couponController.deleteCoupon)` | — |
| <span class="badge badge-get">GET</span> | `/coupons/:id/usage` | `asyncHandler(couponController.getCouponUsage)` | — |
| <span class="badge badge-post">POST</span> | `/coupons/apply` | `asyncHandler(applyCoupon)` | — |
| <span class="badge badge-post">POST</span> | `/coupons/apply` | `asyncHandler(applyCoupon)` | — |
| <span class="badge badge-post">POST</span> | `/coupons/calculate` | `asyncHandler(couponController.calculateCouponDiscount)` | — |
| <span class="badge badge-get">GET</span> | `/coupons/code/:code` | `asyncHandler(couponController.getCouponByCode)` | — |
| <span class="badge badge-post">POST</span> | `/coupons/redeem` | `asyncHandler(redeemCoupon)` | — |
| <span class="badge badge-post">POST</span> | `/coupons/validate` | `asyncHandler(validateCoupon)` | — |
| <span class="badge badge-post">POST</span> | `/coupons/validate` | `asyncHandler(validateCoupon)` | — |
| <span class="badge badge-post">POST</span> | `/coupons/validate` | `asyncHandler(couponController.validateCoupon)` | — |
| <span class="badge badge-get">GET</span> | `/coupons/validate/:code` | `asyncHandler(validateCoupon)` | — |
| <span class="badge badge-get">GET</span> | `/coupons/validate/:code` | `asyncHandler(validateCoupon)` | — |
| <span class="badge badge-get">GET</span> | `/customer-groups/:customerGroupId` | `asyncHandler(customerController.getCustomerGroup)` | — |
| <span class="badge badge-get">GET</span> | `/customer-groups/:customerGroupId/customers` | `asyncHandler(customerController.getCustomersInGroup)` | — |
| <span class="badge badge-get">GET</span> | `/customers` | `asyncHandler(customerController.listCustomers)` | List all customers
GET /business/customers |
| <span class="badge badge-post">POST</span> | `/customers` | `asyncHandler(customerController.createCustomer)` | Create a new customer
POST /business/customers |
| <span class="badge badge-get">GET</span> | `/customers/:customerId` | `asyncHandler(customerController.getCustomer)` | Get customer by ID
GET /business/customers/:customerId |
| <span class="badge badge-put">PUT</span> | `/customers/:customerId` | `asyncHandler(customerController.updateCustomer)` | Update customer
PUT /business/customers/:customerId |
| <span class="badge badge-delete">DELETE</span> | `/customers/:customerId` | `asyncHandler(customerController.deleteCustomer)` | Delete customer
DELETE /business/customers/:customerId |
| <span class="badge badge-get">GET</span> | `/customers/:customerId/addresses` | `asyncHandler(customerController.getCustomerAddresses)` | Get customer addresses
GET /business/customers/:customerId/addresses |
| <span class="badge badge-post">POST</span> | `/customers/:customerId/addresses` | `asyncHandler(customerController.addCustomerAddress)` | Add customer address
POST /business/customers/:customerId/addresses |
| <span class="badge badge-post">POST</span> | `/customers/:customerId/deactivate` | `asyncHandler(customerController.deactivateCustomer)` | Deactivate customer
POST /business/customers/:customerId/deactivate |
| <span class="badge badge-post">POST</span> | `/customers/:customerId/reactivate` | `asyncHandler(customerController.reactivateCustomer)` | Reactivate customer
POST /business/customers/:customerId/reactivate |
| <span class="badge badge-post">POST</span> | `/customers/:customerId/verify` | `asyncHandler(customerController.verifyCustomer)` | Verify customer
POST /business/customers/:customerId/verify |
| <span class="badge badge-get">GET</span> | `/discounts` | `asyncHandler(discountController.getActiveDiscounts)` | Discount routes |
| <span class="badge badge-post">POST</span> | `/discounts` | `asyncHandler(discountController.createDiscount)` | — |
| <span class="badge badge-get">GET</span> | `/discounts/:id` | `asyncHandler(discountController.getDiscountById)` | — |
| <span class="badge badge-put">PUT</span> | `/discounts/:id` | `asyncHandler(discountController.updateDiscount)` | — |
| <span class="badge badge-delete">DELETE</span> | `/discounts/:id` | `asyncHandler(discountController.deleteDiscount)` | — |
| <span class="badge badge-get">GET</span> | `/discounts/category/:categoryId` | `asyncHandler(discountController.getDiscountsByCategoryId)` | — |
| <span class="badge badge-get">GET</span> | `/discounts/product/:productId` | `asyncHandler(discountController.getDiscountsByProductId)` | — |
| <span class="badge badge-post">POST</span> | `/dispatches` | `asyncHandler(createStoreDispatch)` | — |
| <span class="badge badge-get">GET</span> | `/dispatches` | `asyncHandler(listStoreDispatches)` | — |
| <span class="badge badge-get">GET</span> | `/dispatches/:dispatchId` | `asyncHandler(getStoreDispatch)` | — |
| <span class="badge badge-put">PUT</span> | `/dispatches/:dispatchId/approve` | `asyncHandler(approveStoreDispatch)` | — |
| <span class="badge badge-put">PUT</span> | `/dispatches/:dispatchId/cancel` | `asyncHandler(cancelStoreDispatch)` | — |
| <span class="badge badge-put">PUT</span> | `/dispatches/:dispatchId/dispatch` | `asyncHandler(dispatchFromStore)` | — |
| <span class="badge badge-put">PUT</span> | `/dispatches/:dispatchId/receive` | `asyncHandler(receiveStoreDispatch)` | — |
| <span class="badge badge-put">PUT</span> | `/downloads/:downloadId` | `asyncHandler(productController.updateDownload)` | — |
| <span class="badge badge-delete">DELETE</span> | `/downloads/:downloadId` | `asyncHandler(productController.deleteDownload)` | — |
| <span class="badge badge-post">POST</span> | `/errors/:importErrorId/resolve` | `asyncHandler(migrationController.resolveError.bind(migration` | — |
| <span class="badge badge-post">POST</span> | `/estimate-delivery` | `asyncHandler(shippingController.estimateDelivery)` | Estimate delivery time for a shipping method |
| <span class="badge badge-get">GET</span> | `/fraud/blacklist` | `asyncHandler(fraudController.getBlacklist)` | — |
| <span class="badge badge-post">POST</span> | `/fraud/blacklist` | `asyncHandler(fraudController.addToBlacklist)` | — |
| <span class="badge badge-delete">DELETE</span> | `/fraud/blacklist/:id` | `asyncHandler(fraudController.removeFromBlacklist)` | — |
| <span class="badge badge-get">GET</span> | `/fraud/checks` | `asyncHandler(fraudController.getFraudChecks)` | — |
| <span class="badge badge-get">GET</span> | `/fraud/checks/:id` | `asyncHandler(fraudController.getFraudCheck)` | — |
| <span class="badge badge-post">POST</span> | `/fraud/checks/:id/review` | `asyncHandler(fraudController.reviewFraudCheck)` | — |
| <span class="badge badge-get">GET</span> | `/fraud/reviews` | `asyncHandler(fraudController.getPendingReviews)` | — |
| <span class="badge badge-get">GET</span> | `/fraud/rules` | `asyncHandler(fraudController.getFraudRules)` | Fraud Prevention routes |
| <span class="badge badge-post">POST</span> | `/fraud/rules` | `asyncHandler(fraudController.createFraudRule)` | — |
| <span class="badge badge-get">GET</span> | `/fraud/rules/:id` | `asyncHandler(fraudController.getFraudRule)` | — |
| <span class="badge badge-put">PUT</span> | `/fraud/rules/:id` | `asyncHandler(fraudController.updateFraudRule)` | — |
| <span class="badge badge-delete">DELETE</span> | `/fraud/rules/:id` | `asyncHandler(fraudController.deleteFraudRule)` | — |
| <span class="badge badge-get">GET</span> | `/fulfillment/locations` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/fulfillment/locations` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/fulfillment/locations/:locationId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/fulfillment/locations/:locationId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/fulfillment/locations/:locationId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/fulfillment/locations/:locationId/activate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/fulfillment/locations/:locationId/deactivate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/fulfillment/locations/nearest` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/fulfillment/partners` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/fulfillment/partners` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/fulfillment/partners/:partnerId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/fulfillment/partners/:partnerId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/fulfillment/partners/:partnerId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/fulfillments` | `asyncHandler(listFulfillments)` | List all fulfillments (with filters/pagination) |
| <span class="badge badge-post">POST</span> | `/fulfillments` | `asyncHandler(createFulfillment)` | Create fulfillment |
| <span class="badge badge-get">GET</span> | `/fulfillments/:fulfillmentId` | `asyncHandler(getFulfillment)` | Get fulfillment by ID |
| <span class="badge badge-post">POST</span> | `/fulfillments/:fulfillmentId/assign` | `asyncHandler(assignFulfillment)` | Assign fulfillment |
| <span class="badge badge-post">POST</span> | `/fulfillments/:fulfillmentId/cancel` | `asyncHandler(cancelFulfillment)` | Cancel fulfillment |
| <span class="badge badge-post">POST</span> | `/fulfillments/:fulfillmentId/deliver` | `asyncHandler(markDelivered)` | Mark delivered |
| <span class="badge badge-post">POST</span> | `/fulfillments/:fulfillmentId/pack` | `asyncHandler(processPacking)` | Process packing |
| <span class="badge badge-post">POST</span> | `/fulfillments/:fulfillmentId/pick` | `asyncHandler(processPicking)` | Process picking |
| <span class="badge badge-post">POST</span> | `/fulfillments/:fulfillmentId/return` | `asyncHandler(initiateReturn)` | Initiate return |
| <span class="badge badge-post">POST</span> | `/fulfillments/:fulfillmentId/ship` | `asyncHandler(shipOrder)` | Ship order |
| <span class="badge badge-put">PUT</span> | `/fulfillments/:fulfillmentId/tracking` | `asyncHandler(updateTracking)` | Update tracking info |
| <span class="badge badge-get">GET</span> | `/fulfillments/order/:orderId` | `asyncHandler(listFulfillmentsByOrder)` | List by order |
| <span class="badge badge-get">GET</span> | `/gateways` | `asyncHandler(paymentController.listGateways)` | ============================================================================ Gateway Routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/gateways` | `asyncHandler(paymentController.createGateway)` | — |
| <span class="badge badge-get">GET</span> | `/gateways/:gatewayId` | `asyncHandler(paymentController.getGateway)` | — |
| <span class="badge badge-put">PUT</span> | `/gateways/:gatewayId` | `asyncHandler(paymentController.updateGateway)` | — |
| <span class="badge badge-delete">DELETE</span> | `/gateways/:gatewayId` | `asyncHandler(paymentController.deleteGateway)` | — |
| <span class="badge badge-post">POST</span> | `/gdpr/cookies/accept-all` | `asyncHandler(acceptAllCookies)` | Accept all cookies |
| <span class="badge badge-post">POST</span> | `/gdpr/cookies/consent` | `asyncHandler(recordCookieConsent)` | Record cookie consent |
| <span class="badge badge-get">GET</span> | `/gdpr/cookies/consent` | `asyncHandler(getCookieConsent)` | Get current consent |
| <span class="badge badge-put">PUT</span> | `/gdpr/cookies/consent/:cookieConsentId` | `asyncHandler(updateCookieConsent)` | Update cookie preferences |
| <span class="badge badge-post">POST</span> | `/gdpr/cookies/reject-all` | `asyncHandler(rejectAllCookies)` | Reject all optional cookies |
| <span class="badge badge-get">GET</span> | `/gdpr/cookies/statistics` | `asyncHandler(getCookieConsentStatistics)` | Get cookie consent statistics |
| <span class="badge badge-get">GET</span> | `/gdpr/requests` | `asyncHandler(listDataRequests)` | List all GDPR requests |
| <span class="badge badge-post">POST</span> | `/gdpr/requests` | `isCustomerLoggedIn` | Create a new data request |
| <span class="badge badge-get">GET</span> | `/gdpr/requests` | `isCustomerLoggedIn` | Get my data requests |
| <span class="badge badge-get">GET</span> | `/gdpr/requests/:gdprDataRequestId` | `asyncHandler(getDataRequest)` | Get a specific request |
| <span class="badge badge-post">POST</span> | `/gdpr/requests/:gdprDataRequestId/cancel` | `isCustomerLoggedIn` | Cancel a request |
| <span class="badge badge-post">POST</span> | `/gdpr/requests/:gdprDataRequestId/delete` | `asyncHandler(processDeletionRequest)` | Process deletion request |
| <span class="badge badge-post">POST</span> | `/gdpr/requests/:gdprDataRequestId/export` | `asyncHandler(processExportRequest)` | Process export request |
| <span class="badge badge-post">POST</span> | `/gdpr/requests/:gdprDataRequestId/reject` | `asyncHandler(rejectRequest)` | Reject a request |
| <span class="badge badge-post">POST</span> | `/gdpr/requests/:gdprDataRequestId/verify` | `asyncHandler(verifyIdentity)` | Verify customer identity |
| <span class="badge badge-get">GET</span> | `/gdpr/requests/overdue` | `asyncHandler(getOverdueRequests)` | Get overdue requests |
| <span class="badge badge-get">GET</span> | `/gdpr/statistics` | `asyncHandler(getGdprStatistics)` | Get GDPR statistics |
| <span class="badge badge-get">GET</span> | `/gift-cards` | `asyncHandler(giftCardController.getGiftCards)` | Gift Card routes |
| <span class="badge badge-post">POST</span> | `/gift-cards` | `asyncHandler(giftCardController.createGiftCard)` | — |
| <span class="badge badge-get">GET</span> | `/gift-cards/:id` | `asyncHandler(giftCardController.getGiftCard)` | — |
| <span class="badge badge-post">POST</span> | `/gift-cards/:id/activate` | `asyncHandler(giftCardController.activateGiftCard)` | — |
| <span class="badge badge-post">POST</span> | `/gift-cards/:id/assign` | `asyncHandler(giftCardController.assignGiftCard)` | — |
| <span class="badge badge-post">POST</span> | `/gift-cards/:id/cancel` | `asyncHandler(giftCardController.cancelGiftCard)` | — |
| <span class="badge badge-post">POST</span> | `/gift-cards/:id/refund` | `asyncHandler(giftCardController.refundToGiftCard)` | — |
| <span class="badge badge-get">GET</span> | `/gift-cards/balance/:code` | `asyncHandler(giftCardController.checkGiftCardBalance)` | Gift Card routes |
| <span class="badge badge-get">GET</span> | `/gift-cards/mine` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/gift-cards/redeem` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/gift-cards/reload` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/identity/:provider/config` | `asyncHandler(getOAuthConfig)` | GET /identity/social/:provider/config
Get OAuth configuration for a provider (client ID, auth URL, scopes) |
| <span class="badge badge-post">POST</span> | `/identity/:provider/customer` | `asyncHandler(customerSocialLogin)` | POST /identity/social/:provider/customer
Authenticate or register a customer via social login
Body: { accessToken, idToken?, profile: { id, email, name?, ... } } |
| <span class="badge badge-post">POST</span> | `/identity/:provider/customer/link` | `isCustomerLoggedIn` | POST /identity/social/:provider/customer/link
Link a social account to an existing customer (requires auth)
Body: { accessToken, profile: { id, email?, ... } } |
| <span class="badge badge-delete">DELETE</span> | `/identity/:provider/customer/unlink` | `isCustomerLoggedIn` | DELETE /identity/social/:provider/customer/unlink
Unlink a social account from a customer (requires auth) |
| <span class="badge badge-post">POST</span> | `/identity/:provider/merchant` | `asyncHandler(merchantSocialLogin)` | POST /identity/social/:provider/merchant
Authenticate or register a merchant via social login
Body: { accessToken, idToken?, profile: { id, email, name?, ... } } |
| <span class="badge badge-post">POST</span> | `/identity/:provider/organization` | `asyncHandler(merchantSocialLogin)` | — |
| <span class="badge badge-get">GET</span> | `/identity/2fa/status` | `isCustomerLoggedIn` | 2FA status (requires auth) |
| <span class="badge badge-get">GET</span> | `/identity/customer/accounts` | `isCustomerLoggedIn` | GET /identity/social/customer/accounts
Get all linked social accounts for a customer (requires auth) |
| <span class="badge badge-post">POST</span> | `/identity/forgot-password` | `asyncHandler(requestPasswordReset)` | Password reset flow |
| <span class="badge badge-post">POST</span> | `/identity/login` | `asyncHandler(loginCustomer)` | Simple login (returns access token only) |
| <span class="badge badge-post">POST</span> | `/identity/logout` | `isCustomerLoggedIn` | Logout (requires auth to blacklist token) |
| <span class="badge badge-get">GET</span> | `/identity/merchant/accounts` | `isOrganizationLoggedIn` | GET /identity/social/merchant/accounts
Get all linked social accounts for a merchant (requires auth) |
| <span class="badge badge-get">GET</span> | `/identity/organization/accounts` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/identity/refresh` | `asyncHandler(renewAccessToken)` | Refresh access token |
| <span class="badge badge-post">POST</span> | `/identity/register` | `asyncHandler(registerCustomer)` | Register new customer account |
| <span class="badge badge-post">POST</span> | `/identity/request-verification` | `asyncHandler(requestEmailVerification)` | — |
| <span class="badge badge-post">POST</span> | `/identity/reset-password` | `asyncHandler(resetPassword)` | — |
| <span class="badge badge-post">POST</span> | `/identity/token` | `asyncHandler(issueTokenPair)` | Token-based auth (returns access + refresh tokens) |
| <span class="badge badge-post">POST</span> | `/identity/validate` | `asyncHandler(checkTokenValidity)` | Validate token |
| <span class="badge badge-get">GET</span> | `/identity/verify-email` | `asyncHandler(verifyEmail)` | — |
| <span class="badge badge-post">POST</span> | `/integration` | `asyncHandler(integrationController.createIntegration.bind(in` | Integration CRUD |
| <span class="badge badge-get">GET</span> | `/integration` | `asyncHandler(integrationController.listIntegrations.bind(int` | — |
| <span class="badge badge-get">GET</span> | `/integration/:integrationId` | `asyncHandler(integrationController.getIntegration.bind(integ` | — |
| <span class="badge badge-put">PUT</span> | `/integration/:integrationId` | `asyncHandler(integrationController.updateIntegration.bind(in` | — |
| <span class="badge badge-delete">DELETE</span> | `/integration/:integrationId` | `asyncHandler(integrationController.deleteIntegration.bind(in` | — |
| <span class="badge badge-post">POST</span> | `/integration/:integrationId/activate` | `asyncHandler(integrationController.activateIntegration.bind(` | — |
| <span class="badge badge-post">POST</span> | `/integration/:integrationId/credentials` | `asyncHandler(integrationController.addCredential.bind(integr` | Credentials |
| <span class="badge badge-get">GET</span> | `/integration/:integrationId/credentials` | `asyncHandler(integrationController.listCredentials.bind(inte` | — |
| <span class="badge badge-put">PUT</span> | `/integration/:integrationId/credentials/:credentialId` | `asyncHandler(integrationController.updateCredential.bind(int` | — |
| <span class="badge badge-delete">DELETE</span> | `/integration/:integrationId/credentials/:credentialId` | `asyncHandler(integrationController.deleteCredential.bind(int` | — |
| <span class="badge badge-post">POST</span> | `/integration/:integrationId/deactivate` | `asyncHandler(integrationController.deactivateIntegration.bin` | — |
| <span class="badge badge-get">GET</span> | `/integration/:integrationId/logs` | `asyncHandler(integrationController.listLogs.bind(integration` | Logs |
| <span class="badge badge-delete">DELETE</span> | `/integration/:integrationId/logs` | `asyncHandler(integrationController.deleteLogs.bind(integrati` | — |
| <span class="badge badge-post">POST</span> | `/integration/:integrationId/subscriptions` | `asyncHandler(integrationController.createSubscription.bind(i` | Event subscriptions |
| <span class="badge badge-get">GET</span> | `/integration/:integrationId/subscriptions` | `asyncHandler(integrationController.listSubscriptions.bind(in` | — |
| <span class="badge badge-put">PUT</span> | `/integration/:integrationId/subscriptions/:subscriptionId` | `asyncHandler(integrationController.updateSubscription.bind(i` | — |
| <span class="badge badge-delete">DELETE</span> | `/integration/:integrationId/subscriptions/:subscriptionId` | `asyncHandler(integrationController.deleteSubscription.bind(i` | — |
| <span class="badge badge-get">GET</span> | `/inventory` | `asyncHandler(inventoryController.listInventoryLocations)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/:inventoryId` | `asyncHandler(inventoryController.getInventoryLocation)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/:inventoryId/adjust` | `asyncHandler(inventoryController.adjustStock)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/:inventoryId/reserve` | `asyncHandler(inventoryController.reserveStock)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/:inventoryId/restock` | `asyncHandler(inventoryController.adjustStock)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/availability/:sku` | `asyncHandler(checkAvailability)` | Check product availability by SKU |
| <span class="badge badge-get">GET</span> | `/inventory/availability/product/:productId` | `asyncHandler(checkProductAvailability)` | Check product availability by productId |
| <span class="badge badge-post">POST</span> | `/inventory/items` | `asyncHandler(inventoryController.createInventoryItem)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/items` | `asyncHandler(inventoryController.listInventoryItems)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/items/lookup` | `asyncHandler(inventoryController.getInventoryItem)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/locations` | `asyncHandler(inventoryController.listInventoryLocations)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/locations` | `asyncHandler(inventoryController.createInventoryLocation)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/locations/:inventoryLocationId` | `asyncHandler(inventoryController.getInventoryLocation)` | — |
| <span class="badge badge-put">PUT</span> | `/inventory/locations/:inventoryLocationId` | `asyncHandler(inventoryController.updateInventoryLocation)` | — |
| <span class="badge badge-delete">DELETE</span> | `/inventory/locations/:inventoryLocationId` | `asyncHandler(inventoryController.deleteInventoryLocation)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/locations/:inventoryLocationId/adjust` | `asyncHandler(inventoryController.adjustStock)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/locations/:inventoryLocationId/release` | `asyncHandler(inventoryController.releaseReservation)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/locations/:inventoryLocationId/reserve` | `asyncHandler(inventoryController.reserveStock)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/locations/low-stock` | `asyncHandler(inventoryController.getLowStock)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/locations/out-of-stock` | `asyncHandler(inventoryController.getOutOfStock)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/low-stock` | `asyncHandler(inventoryController.getLowStock)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/pools` | `asyncHandler(inventoryController.createInventoryPool)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/pools/allocate` | `asyncHandler(inventoryController.allocateFromPool)` | — |
| <span class="badge badge-put">PUT</span> | `/inventory/products/:productId/threshold` | `asyncHandler(inventoryController.setLowStockThreshold)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/reservations/:reservationId/confirm` | `asyncHandler(inventoryController.confirmReservation)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/transactions/product/:productId` | `asyncHandler(inventoryController.getTransactionHistory)` | — |
| <span class="badge badge-get">GET</span> | `/inventory/transactions/types` | `asyncHandler(inventoryController.getTransactionTypes)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/transfer` | `asyncHandler(inventoryController.transferStock)` | — |
| <span class="badge badge-post">POST</span> | `/inventory/transfer-between-stores` | `asyncHandler(inventoryController.transferBetweenStores)` | — |
| <span class="badge badge-post">POST</span> | `/jobs` | `asyncHandler(migrationController.createJob.bind(migrationCon` | Import job CRUD |
| <span class="badge badge-get">GET</span> | `/jobs` | `asyncHandler(migrationController.listJobs.bind(migrationCont` | — |
| <span class="badge badge-get">GET</span> | `/jobs/:importJobId` | `asyncHandler(migrationController.getJob.bind(migrationContro` | — |
| <span class="badge badge-delete">DELETE</span> | `/jobs/:importJobId` | `asyncHandler(migrationController.deleteJob.bind(migrationCon` | — |
| <span class="badge badge-post">POST</span> | `/jobs/:importJobId/cancel` | `asyncHandler(migrationController.cancelJob.bind(migrationCon` | — |
| <span class="badge badge-post">POST</span> | `/jobs/:importJobId/complete` | `asyncHandler(migrationController.completeJob.bind(migrationC` | — |
| <span class="badge badge-get">GET</span> | `/jobs/:importJobId/errors` | `asyncHandler(migrationController.getErrors.bind(migrationCon` | Import errors |
| <span class="badge badge-post">POST</span> | `/jobs/:importJobId/fail` | `asyncHandler(migrationController.failJob.bind(migrationContr` | — |
| <span class="badge badge-get">GET</span> | `/jobs/:importJobId/mappings` | `asyncHandler(migrationController.getMappings.bind(migrationC` | Import mappings |
| <span class="badge badge-post">POST</span> | `/jobs/:importJobId/mappings` | `asyncHandler(migrationController.createMapping.bind(migratio` | — |
| <span class="badge badge-get">GET</span> | `/jobs/:importJobId/mappings/lookup` | `asyncHandler(migrationController.lookupMapping.bind(migratio` | — |
| <span class="badge badge-post">POST</span> | `/jobs/:importJobId/pause` | `asyncHandler(migrationController.pauseJob.bind(migrationCont` | — |
| <span class="badge badge-post">POST</span> | `/jobs/:importJobId/start` | `asyncHandler(migrationController.startJob.bind(migrationCont` | — |
| <span class="badge badge-post">POST</span> | `/labels` | `asyncHandler(shippingController.createLabel)` | — |
| <span class="badge badge-get">GET</span> | `/labels/:id` | `asyncHandler(shippingController.getLabel)` | — |
| <span class="badge badge-post">POST</span> | `/labels/:id/void` | `asyncHandler(shippingController.voidLabel)` | — |
| <span class="badge badge-get">GET</span> | `/labels/order/:orderId` | `asyncHandler(shippingController.getLabelsByOrder)` | — |
| <span class="badge badge-get">GET</span> | `/locales` | `asyncHandler(localizationController.getLocales)` | Locale CRUD |
| <span class="badge badge-post">POST</span> | `/locales` | `asyncHandler(localizationController.createLocale)` | — |
| <span class="badge badge-get">GET</span> | `/locales/:id` | `asyncHandler(localizationController.getLocaleById)` | — |
| <span class="badge badge-put">PUT</span> | `/locales/:id` | `asyncHandler(localizationController.updateLocale)` | — |
| <span class="badge badge-delete">DELETE</span> | `/locales/:id` | `asyncHandler(localizationController.deleteLocale)` | — |
| <span class="badge badge-post">POST</span> | `/locales/:id/activate` | `asyncHandler(localizationController.activateLocale)` | — |
| <span class="badge badge-post">POST</span> | `/locales/:id/deactivate` | `asyncHandler(localizationController.deactivateLocale)` | — |
| <span class="badge badge-post">POST</span> | `/locales/:id/default` | `asyncHandler(localizationController.setDefaultLocale)` | Locale status management |
| <span class="badge badge-get">GET</span> | `/locales/code/:code` | `asyncHandler(localizationController.getLocaleByCode)` | — |
| <span class="badge badge-get">GET</span> | `/locales/country/:countryCode` | `asyncHandler(localizationController.getLocalesByCountry)` | — |
| <span class="badge badge-get">GET</span> | `/locales/default` | `asyncHandler(localizationController.getDefaultLocale)` | — |
| <span class="badge badge-get">GET</span> | `/locales/language/:language` | `asyncHandler(localizationController.getLocalesByLanguage)` | — |
| <span class="badge badge-get">GET</span> | `/locales/statistics` | `asyncHandler(localizationController.getLocaleStatistics)` | — |
| <span class="badge badge-get">GET</span> | `/localization/countries` | `asyncHandler(getActiveCountries)` | — |
| <span class="badge badge-get">GET</span> | `/localization/countries/:code` | `asyncHandler(getCountryByCode)` | — |
| <span class="badge badge-get">GET</span> | `/localization/detect` | `asyncHandler(detectLocale)` | — |
| <span class="badge badge-get">GET</span> | `/localization/locales` | `asyncHandler(getActiveLocales)` | Public routes (no auth required) |
| <span class="badge badge-get">GET</span> | `/localization/locales/:code` | `asyncHandler(getLocaleByCode)` | — |
| <span class="badge badge-get">GET</span> | `/loyalty/customers/:customerId/points` | `asyncHandler(getCustomerPoints)` | Customer Management |
| <span class="badge badge-post">POST</span> | `/loyalty/customers/:customerId/points/adjust` | `asyncHandler(adjustCustomerPoints)` | — |
| <span class="badge badge-get">GET</span> | `/loyalty/customers/:customerId/redemptions` | `asyncHandler(getCustomerRedemptions)` | — |
| <span class="badge badge-get">GET</span> | `/loyalty/customers/:customerId/transactions` | `asyncHandler(getCustomerPointsTransactions)` | — |
| <span class="badge badge-get">GET</span> | `/loyalty/my-redemptions` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/loyalty/my-status` | `isCustomerLoggedIn` | Customer authenticated routes |
| <span class="badge badge-get">GET</span> | `/loyalty/my-transactions` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/loyalty/orders/:orderId/points` | `asyncHandler(processOrderPoints)` | Order Processing |
| <span class="badge badge-post">POST</span> | `/loyalty/redeem` | `isCustomerLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/loyalty/redemptions/:id/status` | `asyncHandler(updateRedemptionStatus)` | Redemption Management |
| <span class="badge badge-get">GET</span> | `/loyalty/rewards` | `asyncHandler(getRewards)` | Reward Management |
| <span class="badge badge-post">POST</span> | `/loyalty/rewards` | `asyncHandler(createReward)` | — |
| <span class="badge badge-get">GET</span> | `/loyalty/rewards` | `asyncHandler(loyaltyController.getPublicRewards)` | — |
| <span class="badge badge-get">GET</span> | `/loyalty/rewards/:id` | `asyncHandler(getRewardById)` | — |
| <span class="badge badge-put">PUT</span> | `/loyalty/rewards/:id` | `asyncHandler(updateReward)` | — |
| <span class="badge badge-get">GET</span> | `/loyalty/tiers` | `asyncHandler(getTiers)` | Tier Management |
| <span class="badge badge-post">POST</span> | `/loyalty/tiers` | `asyncHandler(createTier)` | — |
| <span class="badge badge-get">GET</span> | `/loyalty/tiers` | `asyncHandler(loyaltyController.getPublicTiers)` | Public routes (no authentication required) |
| <span class="badge badge-get">GET</span> | `/loyalty/tiers/:id` | `asyncHandler(getTierById)` | — |
| <span class="badge badge-put">PUT</span> | `/loyalty/tiers/:id` | `asyncHandler(updateTier)` | — |
| <span class="badge badge-get">GET</span> | `/me` | `asyncHandler(customerController.getMyProfile)` | Get my profile
GET /customers/me |
| <span class="badge badge-put">PUT</span> | `/me` | `asyncHandler(customerController.updateMyProfile)` | Update my profile
PUT /customers/me |
| <span class="badge badge-get">GET</span> | `/me/addresses` | `asyncHandler(customerController.getAddresses)` | Get my addresses
GET /customers/me/addresses |
| <span class="badge badge-post">POST</span> | `/me/addresses` | `asyncHandler(customerController.addAddress)` | Add a new address
POST /customers/me/addresses |
| <span class="badge badge-put">PUT</span> | `/me/addresses/:addressId` | `asyncHandler(customerController.updateAddress)` | Update an address
PUT /customers/me/addresses/:addressId |
| <span class="badge badge-delete">DELETE</span> | `/me/addresses/:addressId` | `asyncHandler(customerController.deleteAddress)` | Delete an address
DELETE /customers/me/addresses/:addressId |
| <span class="badge badge-post">POST</span> | `/me/addresses/:addressId/default` | `asyncHandler(customerController.setDefaultAddress)` | Set default address
POST /customers/me/addresses/:addressId/default |
| <span class="badge badge-post">POST</span> | `/media/download` | `asyncHandler(mediaController.downloadImage)` | Download remote image by URL |
| <span class="badge badge-post">POST</span> | `/media/upload` | `uploadSingle` | Upload single image |
| <span class="badge badge-post">POST</span> | `/media/upload/batch` | `uploadMultiple` | Upload multiple images |
| <span class="badge badge-get">GET</span> | `/membership/benefits` | `asyncHandler(getMembershipBenefits)` | Admin routes for membership benefit management |
| <span class="badge badge-post">POST</span> | `/membership/benefits` | `asyncHandler(createMembershipBenefit)` | — |
| <span class="badge badge-get">GET</span> | `/membership/benefits/:id` | `asyncHandler(getMembershipBenefitById)` | — |
| <span class="badge badge-put">PUT</span> | `/membership/benefits/:id` | `asyncHandler(updateMembershipBenefit)` | — |
| <span class="badge badge-delete">DELETE</span> | `/membership/benefits/:id` | `asyncHandler(deleteMembershipBenefit)` | — |
| <span class="badge badge-get">GET</span> | `/membership/tiers` | `asyncHandler(getMembershipTiers)` | Admin routes for membership tier management |
| <span class="badge badge-post">POST</span> | `/membership/tiers` | `asyncHandler(createMembershipTier)` | — |
| <span class="badge badge-get">GET</span> | `/membership/tiers` | `asyncHandler(getMembershipTiers)` | Get all active membership tiers |
| <span class="badge badge-get">GET</span> | `/membership/tiers/:id` | `asyncHandler(getMembershipTierById)` | — |
| <span class="badge badge-put">PUT</span> | `/membership/tiers/:id` | `asyncHandler(updateMembershipTier)` | — |
| <span class="badge badge-delete">DELETE</span> | `/membership/tiers/:id` | `asyncHandler(deleteMembershipTier)` | — |
| <span class="badge badge-get">GET</span> | `/membership/tiers/:id` | `asyncHandler(getMembershipTierById)` | Get specific membership tier details |
| <span class="badge badge-get">GET</span> | `/membership/tiers/:tierId/benefits` | `asyncHandler(getTierBenefits)` | Get benefits for a specific tier |
| <span class="badge badge-get">GET</span> | `/membership/user-memberships` | `asyncHandler(getUserMemberships)` | Admin routes for user membership management |
| <span class="badge badge-post">POST</span> | `/membership/user-memberships` | `asyncHandler(createUserMembership)` | — |
| <span class="badge badge-get">GET</span> | `/membership/user-memberships/:id` | `asyncHandler(getUserMembershipById)` | — |
| <span class="badge badge-put">PUT</span> | `/membership/user-memberships/:id` | `asyncHandler(updateUserMembership)` | — |
| <span class="badge badge-post">POST</span> | `/membership/user-memberships/:id/cancel` | `asyncHandler(cancelUserMembership)` | — |
| <span class="badge badge-get">GET</span> | `/membership/user/:userId` | `isCustomerLoggedIn` | Get current user's membership |
| <span class="badge badge-get">GET</span> | `/membership/user/:userId/benefits` | `isCustomerLoggedIn` | Get current user's membership benefits |
| <span class="badge badge-get">GET</span> | `/membership/users/:userId/benefits` | `asyncHandler(getUserMembershipBenefits)` | — |
| <span class="badge badge-get">GET</span> | `/membership/users/:userId/membership` | `asyncHandler(getUserMembershipByUserId)` | Admin routes for fetching user-specific membership data |
| <span class="badge badge-get">GET</span> | `/method-configs` | `asyncHandler(paymentController.listMethodConfigs)` | ============================================================================ Method Config Routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/method-configs` | `asyncHandler(paymentController.createMethodConfig)` | — |
| <span class="badge badge-get">GET</span> | `/method-configs/:methodConfigId` | `asyncHandler(paymentController.getMethodConfig)` | — |
| <span class="badge badge-put">PUT</span> | `/method-configs/:methodConfigId` | `asyncHandler(paymentController.updateMethodConfig)` | — |
| <span class="badge badge-delete">DELETE</span> | `/method-configs/:methodConfigId` | `asyncHandler(paymentController.deleteMethodConfig)` | — |
| <span class="badge badge-get">GET</span> | `/methods` | `asyncHandler(shippingController.getMethods)` | — |
| <span class="badge badge-post">POST</span> | `/methods` | `asyncHandler(shippingController.createMethod)` | — |
| <span class="badge badge-get">GET</span> | `/methods` | `asyncHandler(shippingController.getMethods)` | Get available shipping methods (for checkout) |
| <span class="badge badge-get">GET</span> | `/methods/:id` | `asyncHandler(shippingController.getMethodById)` | — |
| <span class="badge badge-put">PUT</span> | `/methods/:id` | `asyncHandler(shippingController.updateMethod)` | — |
| <span class="badge badge-delete">DELETE</span> | `/methods/:id` | `asyncHandler(shippingController.deleteMethod)` | — |
| <span class="badge badge-get">GET</span> | `/notification-preferences` | `asyncHandler(getAllPreferences)` | ============================================================================ Admin preference routes ============================================================================ |
| <span class="badge badge-put">PUT</span> | `/notification-preferences/:id` | `asyncHandler(updatePreferenceAdmin)` | — |
| <span class="badge badge-get">GET</span> | `/notification-preferences/user/:userId` | `asyncHandler(getPreferencesByUser)` | — |
| <span class="badge badge-get">GET</span> | `/notification-templates` | `asyncHandler(getAllTemplates)` | ============================================================================ Template routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/notification-templates` | `asyncHandler(createTemplate)` | — |
| <span class="badge badge-get">GET</span> | `/notification-templates/:id` | `asyncHandler(getTemplateById)` | — |
| <span class="badge badge-put">PUT</span> | `/notification-templates/:id` | `asyncHandler(updateTemplate)` | — |
| <span class="badge badge-delete">DELETE</span> | `/notification-templates/:id` | `asyncHandler(deleteTemplate)` | — |
| <span class="badge badge-post">POST</span> | `/notification-templates/:id/preview` | `asyncHandler(previewTemplate)` | — |
| <span class="badge badge-get">GET</span> | `/notification-templates/type/:type` | `asyncHandler(getTemplatesByType)` | — |
| <span class="badge badge-get">GET</span> | `/notifications` | `asyncHandler(getAllNotifications)` | ============================================================================ Literal notification routes — must be registered before /notifications/:id ============================================================================ |
| <span class="badge badge-post">POST</span> | `/notifications` | `asyncHandler(createNotification)` | — |
| <span class="badge badge-get">GET</span> | `/notifications` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-get">GET</span> | `/notifications/:id` | `asyncHandler(getNotificationById)` | ============================================================================ Admin CRUD routes for notifications (parameterized — after all literals) ============================================================================ |
| <span class="badge badge-put">PUT</span> | `/notifications/:id` | `asyncHandler(updateNotification)` | — |
| <span class="badge badge-delete">DELETE</span> | `/notifications/:id` | `asyncHandler(deleteNotification)` | — |
| <span class="badge badge-get">GET</span> | `/notifications/:id` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-put">PUT</span> | `/notifications/:id/read` | `asyncHandler(markNotificationAsRead)` | — |
| <span class="badge badge-post">POST</span> | `/notifications/:id/send` | `asyncHandler(markNotificationAsSent)` | — |
| <span class="badge badge-put">PUT</span> | `/notifications/:notificationId/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-patch">PATCH</span> | `/notifications/:notificationId/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-get">GET</span> | `/notifications/batches` | `asyncHandler(listBatches)` | ============================================================================ Batch routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/notifications/batches` | `asyncHandler(sendBatch)` | — |
| <span class="badge badge-get">GET</span> | `/notifications/batches/:batchId` | `asyncHandler(getBatch)` | — |
| <span class="badge badge-get">GET</span> | `/notifications/count` | `asyncHandler(getUnreadCount)` | — |
| <span class="badge badge-get">GET</span> | `/notifications/count` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-get">GET</span> | `/notifications/devices` | `asyncHandler(notificationCustomerController.listDevices)` | — |
| <span class="badge badge-post">POST</span> | `/notifications/devices` | `asyncHandler(notificationCustomerController.registerDevice)` | — |
| <span class="badge badge-delete">DELETE</span> | `/notifications/devices/:deviceToken` | `asyncHandler(notificationCustomerController.deleteDevice)` | — |
| <span class="badge badge-get">GET</span> | `/notifications/preferences` | `asyncHandler(notificationCustomerController.getPreferences)` | — |
| <span class="badge badge-post">POST</span> | `/notifications/preferences` | `asyncHandler(notificationCustomerController.createPreference` | — |
| <span class="badge badge-get">GET</span> | `/notifications/preferences/:id` | `asyncHandler(notificationCustomerController.getPreferenceByI` | — |
| <span class="badge badge-put">PUT</span> | `/notifications/preferences/:id` | `asyncHandler(notificationCustomerController.updatePreference` | — |
| <span class="badge badge-delete">DELETE</span> | `/notifications/preferences/:id` | `asyncHandler(notificationCustomerController.deletePreference` | — |
| <span class="badge badge-put">PUT</span> | `/notifications/preferences/:id/schedule` | `asyncHandler(notificationCustomerController.updateSchedule)` | — |
| <span class="badge badge-post">POST</span> | `/notifications/preferences/bulk` | `asyncHandler(notificationCustomerController.bulkUpdatePrefer` | — |
| <span class="badge badge-get">GET</span> | `/notifications/preferences/type/:type` | `asyncHandler(notificationCustomerController.getPreferenceByT` | — |
| <span class="badge badge-put">PUT</span> | `/notifications/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-post">POST</span> | `/notifications/read` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-put">PUT</span> | `/notifications/read-all` | `asyncHandler(markAllNotificationsAsRead)` | — |
| <span class="badge badge-get">GET</span> | `/notifications/recent` | `asyncHandler(getRecentNotifications)` | — |
| <span class="badge badge-get">GET</span> | `/notifications/templates/:templateId/translations` | `asyncHandler(listTranslations)` | ============================================================================ Template translation routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/notifications/templates/:templateId/translations` | `asyncHandler(upsertTranslation)` | — |
| <span class="badge badge-get">GET</span> | `/notifications/unread` | `asyncHandler(getUnreadNotifications)` | — |
| <span class="badge badge-get">GET</span> | `/notifications/unread-count` | `async (req, res) => {
  try {
    const customerId = req.use` | — |
| <span class="badge badge-get">GET</span> | `/notifications/webhooks` | `asyncHandler(listWebhooks)` | ============================================================================ Webhook routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/notifications/webhooks` | `asyncHandler(createWebhook)` | — |
| <span class="badge badge-delete">DELETE</span> | `/notifications/webhooks/:webhookId` | `asyncHandler(deactivateWebhook)` | — |
| <span class="badge badge-get">GET</span> | `/order` | `asyncHandler(orderController.getMyOrders)` | Get customer's orders
GET /orders |
| <span class="badge badge-post">POST</span> | `/order` | `asyncHandler(orderController.createOrder)` | Create a new order
POST /orders |
| <span class="badge badge-post">POST</span> | `/order-items` | `asyncHandler(orderController.createOrderItem)` | — |
| <span class="badge badge-get">GET</span> | `/order-items/:orderItemId` | `asyncHandler(orderController.getOrderItemById)` | — |
| <span class="badge badge-put">PUT</span> | `/order-items/:orderItemId` | `asyncHandler(orderController.updateOrderItem)` | — |
| <span class="badge badge-delete">DELETE</span> | `/order-items/:orderItemId` | `asyncHandler(orderController.deleteOrderItem)` | — |
| <span class="badge badge-get">GET</span> | `/order/:orderId` | `asyncHandler(listFulfillmentsByOrder)` | List fulfillments by order (customer view) |
| <span class="badge badge-get">GET</span> | `/order/:orderId` | `asyncHandler(orderController.getOrder)` | Get order by ID
GET /orders/:orderId |
| <span class="badge badge-post">POST</span> | `/order/:orderId/cancel` | `asyncHandler(orderController.cancelOrder)` | Cancel an order
POST /orders/:orderId/cancel |
| <span class="badge badge-get">GET</span> | `/order/number/:orderNumber` | `asyncHandler(orderController.getOrderByNumber)` | Get order by order number
GET /orders/number/:orderNumber |
| <span class="badge badge-get">GET</span> | `/orders` | `asyncHandler(orderController.listOrders)` | List all orders with filters
GET /business/orders |
| <span class="badge badge-get">GET</span> | `/orders/:orderId` | `asyncHandler(orderController.getOrder)` | Get order details
GET /business/orders/:orderId |
| <span class="badge badge-post">POST</span> | `/orders/:orderId/cancel` | `asyncHandler(orderController.cancelOrder)` | Cancel an order
POST /business/orders/:orderId/cancel |
| <span class="badge badge-get">GET</span> | `/orders/:orderId/fulfillment-history` | `asyncHandler(orderController.getFulfillmentHistory)` | — |
| <span class="badge badge-put">PUT</span> | `/orders/:orderId/fulfillment-status` | `asyncHandler(orderController.updateFulfillmentStatus)` | — |
| <span class="badge badge-get">GET</span> | `/orders/:orderId/history` | `asyncHandler(orderController.getOrderHistory)` | Get order status history
GET /business/orders/:orderId/history |
| <span class="badge badge-get">GET</span> | `/orders/:orderId/items` | `asyncHandler(orderController.getOrderItems)` | ============================================================================ Order Items ============================================================================ |
| <span class="badge badge-get">GET</span> | `/orders/:orderId/notes` | `asyncHandler(orderController.listOrderNotes)` | — |
| <span class="badge badge-post">POST</span> | `/orders/:orderId/notes` | `asyncHandler(orderController.addOrderNote)` | — |
| <span class="badge badge-delete">DELETE</span> | `/orders/:orderId/notes/:noteId` | `asyncHandler(orderController.deleteOrderNote)` | — |
| <span class="badge badge-get">GET</span> | `/orders/:orderId/packages` | `asyncHandler(orderController.listFulfillmentPackages)` | — |
| <span class="badge badge-post">POST</span> | `/orders/:orderId/packages` | `asyncHandler(orderController.createFulfillmentPackage)` | — |
| <span class="badge badge-post">POST</span> | `/orders/:orderId/packages/:packageId/tracking` | `asyncHandler(orderController.trackFulfillmentPackage)` | — |
| <span class="badge badge-get">GET</span> | `/orders/:orderId/payment-history` | `asyncHandler(orderController.getPaymentHistory)` | — |
| <span class="badge badge-put">PUT</span> | `/orders/:orderId/payment-status` | `asyncHandler(orderController.updatePaymentStatus)` | ============================================================================ Payment & Fulfillment Status ============================================================================ |
| <span class="badge badge-post">POST</span> | `/orders/:orderId/refund` | `asyncHandler(orderController.processRefund)` | Process refund
POST /business/orders/:orderId/refund |
| <span class="badge badge-get">GET</span> | `/orders/:orderId/refunds` | `asyncHandler(orderController.listOrderRefunds)` | — |
| <span class="badge badge-post">POST</span> | `/orders/:orderId/refunds` | `asyncHandler(orderController.createOrderRefund)` | — |
| <span class="badge badge-put">PUT</span> | `/orders/:orderId/status` | `asyncHandler(orderController.updateOrderStatus)` | Update order status
PUT /business/orders/:orderId/status |
| <span class="badge badge-get">GET</span> | `/orders/:orderId/status-history` | `asyncHandler(orderController.getStatusHistory)` | ============================================================================ Status History ============================================================================ |
| <span class="badge badge-get">GET</span> | `/orders/number/:orderNumber` | `asyncHandler(orderController.getOrderByNumber)` | Get order by order number
GET /business/orders/number/:orderNumber |
| <span class="badge badge-get">GET</span> | `/orders/stats` | `asyncHandler(orderController.getOrderStats)` | Get order statistics
GET /business/orders/stats |
| <span class="badge badge-get">GET</span> | `/orders/store-summary` | `asyncHandler(orderController.getStoreSalesSummary)` | Get store sales summary
GET /business/orders/store-summary |
| <span class="badge badge-get">GET</span> | `/organizations` | `asyncHandler(getOrganizations)` | — |
| <span class="badge badge-post">POST</span> | `/organizations` | `asyncHandler(createOrganization)` | — |
| <span class="badge badge-get">GET</span> | `/organizations/:id` | `asyncHandler(getOrganizationById)` | — |
| <span class="badge badge-put">PUT</span> | `/organizations/:id` | `asyncHandler(updateOrganization)` | — |
| <span class="badge badge-delete">DELETE</span> | `/organizations/:id` | `asyncHandler(deleteOrganization)` | — |
| <span class="badge badge-get">GET</span> | `/organizations/:id/stores` | `asyncHandler(getOrganizationStores)` | — |
| <span class="badge badge-get">GET</span> | `/organizations/:organizationId/addresses` | `asyncHandler(getOrganizationAddresses)` | — |
| <span class="badge badge-post">POST</span> | `/organizations/:organizationId/addresses` | `asyncHandler(addOrganizationAddress)` | — |
| <span class="badge badge-put">PUT</span> | `/organizations/:organizationId/addresses/:addressId` | `asyncHandler(updateOrganizationAddress)` | — |
| <span class="badge badge-get">GET</span> | `/organizations/:organizationId/payment-info` | `asyncHandler(getOrganizationPaymentInfo)` | — |
| <span class="badge badge-post">POST</span> | `/organizations/:organizationId/payment-info` | `asyncHandler(addOrganizationPaymentInfo)` | — |
| <span class="badge badge-put">PUT</span> | `/organizations/:organizationId/payment-info/:paymentInfoId` | `asyncHandler(updateOrganizationPaymentInfo)` | — |
| <span class="badge badge-get">GET</span> | `/organizations/:organizationId/warehouses` | `asyncHandler(warehouseController.getWarehousesByMerchant)` | Organization warehouses |
| <span class="badge badge-get">GET</span> | `/packaging-types` | `asyncHandler(shippingController.getPackagingTypes)` | — |
| <span class="badge badge-post">POST</span> | `/packaging-types` | `asyncHandler(shippingController.createPackagingType)` | — |
| <span class="badge badge-get">GET</span> | `/packaging-types` | `asyncHandler(shippingController.getPackagingTypes)` | Get packaging types (for reference) |
| <span class="badge badge-get">GET</span> | `/packaging-types/:id` | `asyncHandler(shippingController.getPackagingTypeById)` | — |
| <span class="badge badge-put">PUT</span> | `/packaging-types/:id` | `asyncHandler(shippingController.updatePackagingType)` | — |
| <span class="badge badge-delete">DELETE</span> | `/packaging-types/:id` | `asyncHandler(shippingController.deletePackagingType)` | — |
| <span class="badge badge-get">GET</span> | `/page-builder/block-types` | `asyncHandler(pageBuilderController.listBlockTypes)` | Block types |
| <span class="badge badge-get">GET</span> | `/page-builder/block-types/:category` | `asyncHandler(pageBuilderController.listBlockTypesByCategory)` | — |
| <span class="badge badge-get">GET</span> | `/page-builder/drafts` | `asyncHandler(pageBuilderController.listDrafts)` | Drafts |
| <span class="badge badge-post">POST</span> | `/page-builder/drafts` | `asyncHandler(pageBuilderController.createDraft)` | — |
| <span class="badge badge-get">GET</span> | `/page-builder/drafts/:draftId` | `asyncHandler(pageBuilderController.getDraft)` | — |
| <span class="badge badge-delete">DELETE</span> | `/page-builder/drafts/:draftId` | `asyncHandler(pageBuilderController.deleteDraft)` | — |
| <span class="badge badge-post">POST</span> | `/page-builder/drafts/:draftId/blocks` | `asyncHandler(pageBuilderController.addBlock)` | Blocks |
| <span class="badge badge-patch">PATCH</span> | `/page-builder/drafts/:draftId/blocks/:blockId` | `asyncHandler(pageBuilderController.updateBlock)` | — |
| <span class="badge badge-delete">DELETE</span> | `/page-builder/drafts/:draftId/blocks/:blockId` | `asyncHandler(pageBuilderController.removeBlock)` | — |
| <span class="badge badge-patch">PATCH</span> | `/page-builder/drafts/:draftId/blocks/:blockId/move` | `asyncHandler(pageBuilderController.moveBlock)` | — |
| <span class="badge badge-get">GET</span> | `/page-builder/drafts/:draftId/preview` | `asyncHandler(pageBuilderController.previewDraft)` | Preview |
| <span class="badge badge-post">POST</span> | `/page-builder/drafts/:draftId/publish` | `asyncHandler(pageBuilderController.publishDraft)` | Publish |
| <span class="badge badge-post">POST</span> | `/page-builder/drafts/:draftId/regions/:region/reorder` | `asyncHandler(pageBuilderController.reorderBlocks)` | — |
| <span class="badge badge-patch">PATCH</span> | `/page-builder/drafts/:draftId/slug` | `asyncHandler(pageBuilderController.updateDraftSlug)` | — |
| <span class="badge badge-patch">PATCH</span> | `/page-builder/drafts/:draftId/theme` | `asyncHandler(pageBuilderController.updateDraftTheme)` | — |
| <span class="badge badge-patch">PATCH</span> | `/page-builder/drafts/:draftId/title` | `asyncHandler(pageBuilderController.updateDraftTitle)` | — |
| <span class="badge badge-post">POST</span> | `/page-builder/drafts/:draftId/unpublish` | `asyncHandler(pageBuilderController.unpublishDraft)` | — |
| <span class="badge badge-get">GET</span> | `/payment-methods` | `asyncHandler(paymentCustomerController.listStoredMethods)` | — |
| <span class="badge badge-post">POST</span> | `/payment-methods` | `asyncHandler(paymentCustomerController.saveStoredMethod)` | — |
| <span class="badge badge-delete">DELETE</span> | `/payment-methods/:methodId` | `asyncHandler(paymentCustomerController.deleteStoredMethod)` | — |
| <span class="badge badge-post">POST</span> | `/payment-methods/:methodId/default` | `asyncHandler(paymentCustomerController.setDefaultMethod)` | — |
| <span class="badge badge-get">GET</span> | `/payment/balance` | `asyncHandler(paymentBusinessController.getBalance)` | ============================================================================ Balance Routes ============================================================================ |
| <span class="badge badge-get">GET</span> | `/payment/disputes` | `asyncHandler(paymentBusinessController.listDisputes)` | ============================================================================ Dispute Routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/payment/disputes` | `asyncHandler(paymentBusinessController.listDisputes)` | — |
| <span class="badge badge-get">GET</span> | `/payment/disputes/:disputeId` | `asyncHandler(paymentBusinessController.getDispute)` | — |
| <span class="badge badge-patch">PATCH</span> | `/payment/disputes/:disputeId` | `asyncHandler(paymentBusinessController.updateDisputeStatus)` | — |
| <span class="badge badge-get">GET</span> | `/payment/fees` | `asyncHandler(paymentBusinessController.listFees)` | ============================================================================ Fee Routes ============================================================================ |
| <span class="badge badge-get">GET</span> | `/payment/methods` | `asyncHandler(paymentController.getPaymentMethods)` | Get available payment methods
GET /payments/methods |
| <span class="badge badge-get">GET</span> | `/payment/orders/:orderId` | `asyncHandler(paymentController.getTransactionByOrder)` | Get transactions for an order
GET /payments/orders/:orderId |
| <span class="badge badge-get">GET</span> | `/payment/reports` | `asyncHandler(paymentBusinessController.listReports)` | ============================================================================ Report Routes ============================================================================ |
| <span class="badge badge-get">GET</span> | `/payment/settings` | `asyncHandler(paymentBusinessController.getSettings)` | ============================================================================ Settings Routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/payment/settings` | `asyncHandler(paymentBusinessController.updateSettings)` | — |
| <span class="badge badge-get">GET</span> | `/payment/transactions` | `asyncHandler(paymentController.getMyTransactions)` | Get my transactions
GET /payments/transactions |
| <span class="badge badge-get">GET</span> | `/payouts` | `isOrganizationLoggedIn` | Payouts |
| <span class="badge badge-post">POST</span> | `/payouts` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/payouts/:payoutId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/payouts/:payoutId/cancel` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/payouts/:payoutId/complete` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/payouts/:payoutId/fail` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/payouts/:payoutId/line-items` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/payouts/:payoutId/method` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/payouts/:payoutId/process` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/payouts/:payoutId/retry` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/pricing/currencies` | `asyncHandler(getAllCurrencies)` | Currency Management Routes |
| <span class="badge badge-post">POST</span> | `/pricing/currencies` | `asyncHandler(saveCurrency)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/currencies/:code` | `asyncHandler(getCurrencyByCode)` | — |
| <span class="badge badge-delete">DELETE</span> | `/pricing/currencies/:code` | `asyncHandler(deleteCurrency)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/currencies/default` | `asyncHandler(getDefaultCurrency)` | — |
| <span class="badge badge-post">POST</span> | `/pricing/currencies/update-exchange-rates` | `asyncHandler(updateExchangeRates)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/currency-price-rules` | `asyncHandler(getAllPriceRules)` | Currency Price Rule Routes |
| <span class="badge badge-post">POST</span> | `/pricing/currency-price-rules` | `asyncHandler(createPriceRule)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/currency-price-rules/:id` | `asyncHandler(getPriceRuleById)` | — |
| <span class="badge badge-put">PUT</span> | `/pricing/currency-price-rules/:id` | `asyncHandler(updatePriceRule)` | — |
| <span class="badge badge-delete">DELETE</span> | `/pricing/currency-price-rules/:id` | `asyncHandler(deletePriceRule)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/currency-regions` | `asyncHandler(getAllCurrencyRegions)` | Currency Region Routes |
| <span class="badge badge-post">POST</span> | `/pricing/currency-regions` | `asyncHandler(createCurrencyRegion)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/currency-regions/:id` | `asyncHandler(getCurrencyRegionById)` | — |
| <span class="badge badge-put">PUT</span> | `/pricing/currency-regions/:id` | `asyncHandler(updateCurrencyRegion)` | — |
| <span class="badge badge-delete">DELETE</span> | `/pricing/currency-regions/:id` | `asyncHandler(deleteCurrencyRegion)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/price-lists` | `asyncHandler(getPriceLists)` | Customer Price List Routes |
| <span class="badge badge-post">POST</span> | `/pricing/price-lists` | `asyncHandler(createPriceList)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/price-lists/:id` | `asyncHandler(getPriceList)` | — |
| <span class="badge badge-put">PUT</span> | `/pricing/price-lists/:id` | `asyncHandler(updatePriceList)` | — |
| <span class="badge badge-delete">DELETE</span> | `/pricing/price-lists/:id` | `asyncHandler(deletePriceList)` | — |
| <span class="badge badge-post">POST</span> | `/pricing/price-lists/:priceListId/prices` | `asyncHandler(addPriceToList)` | Customer Prices Routes |
| <span class="badge badge-get">GET</span> | `/pricing/rules` | `asyncHandler(getPricingRules)` | Pricing Rules Routes |
| <span class="badge badge-post">POST</span> | `/pricing/rules` | `asyncHandler(createPricingRule)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/rules/:id` | `asyncHandler(getPricingRule)` | — |
| <span class="badge badge-put">PUT</span> | `/pricing/rules/:id` | `asyncHandler(updatePricingRule)` | — |
| <span class="badge badge-delete">DELETE</span> | `/pricing/rules/:id` | `asyncHandler(deletePricingRule)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/tier-prices` | `asyncHandler(getTierPrices)` | Tier Pricing Routes |
| <span class="badge badge-post">POST</span> | `/pricing/tier-prices` | `asyncHandler(createTierPrice)` | — |
| <span class="badge badge-get">GET</span> | `/pricing/tier-prices/:id` | `asyncHandler(getTierPrice)` | — |
| <span class="badge badge-put">PUT</span> | `/pricing/tier-prices/:id` | `asyncHandler(updateTierPrice)` | — |
| <span class="badge badge-delete">DELETE</span> | `/pricing/tier-prices/:id` | `asyncHandler(deleteTierPrice)` | — |
| <span class="badge badge-get">GET</span> | `/product-types` | `isOrganizationLoggedIn` | List all product types |
| <span class="badge badge-post">POST</span> | `/product-types` | `isOrganizationLoggedIn` | Create product type |
| <span class="badge badge-get">GET</span> | `/product-types` | `asyncHandler(productTypeController.listProductTypes.bind(pro` | — |
| <span class="badge badge-post">POST</span> | `/product-types` | `asyncHandler(productTypeController.createProductType.bind(pr` | — |
| <span class="badge badge-get">GET</span> | `/product-types/:id` | `isOrganizationLoggedIn` | Get product type by ID |
| <span class="badge badge-put">PUT</span> | `/product-types/:id` | `isOrganizationLoggedIn` | Update product type |
| <span class="badge badge-delete">DELETE</span> | `/product-types/:id` | `isOrganizationLoggedIn` | Delete product type |
| <span class="badge badge-get">GET</span> | `/product-types/:id` | `asyncHandler(productTypeController.getProductType.bind(produ` | — |
| <span class="badge badge-put">PUT</span> | `/product-types/:id` | `asyncHandler(productTypeController.updateProductType.bind(pr` | — |
| <span class="badge badge-delete">DELETE</span> | `/product-types/:id` | `asyncHandler(productTypeController.deleteProductType.bind(pr` | — |
| <span class="badge badge-get">GET</span> | `/product-types/:id/attributes` | `isOrganizationLoggedIn` | Get attributes for a product type |
| <span class="badge badge-get">GET</span> | `/product-types/:id/attributes` | `asyncHandler(productTypeController.getProductTypeAttributes.` | — |
| <span class="badge badge-get">GET</span> | `/product-types/slug/:slug` | `isOrganizationLoggedIn` | Get product type by slug |
| <span class="badge badge-get">GET</span> | `/product-types/slug/:slug` | `asyncHandler(productTypeController.getProductTypeBySlug.bind` | — |
| <span class="badge badge-get">GET</span> | `/products` | `asyncHandler(productController.listProducts)` | List all products
GET /business/products |
| <span class="badge badge-post">POST</span> | `/products` | `asyncHandler(productController.createProduct)` | Create a new product
POST /business/products |
| <span class="badge badge-get">GET</span> | `/products` | `asyncHandler(productController.listProducts)` | List products
GET /products |
| <span class="badge badge-get">GET</span> | `/products/:identifier` | `asyncHandler(productController.getProduct)` | Get product by ID or slug
GET /products/:identifier |
| <span class="badge badge-get">GET</span> | `/products/:productId` | `asyncHandler(productController.getProduct)` | Get product details
GET /business/products/:productId |
| <span class="badge badge-put">PUT</span> | `/products/:productId` | `asyncHandler(productController.updateProduct)` | Update a product
PUT /business/products/:productId |
| <span class="badge badge-delete">DELETE</span> | `/products/:productId` | `asyncHandler(productController.deleteProduct)` | Delete a product
DELETE /business/products/:productId |
| <span class="badge badge-post">POST</span> | `/products/:productId/apply-attribute-set` | `asyncHandler(productController.applyAttributeSet)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/attributes` | `isOrganizationLoggedIn` | Get product attributes |
| <span class="badge badge-post">POST</span> | `/products/:productId/attributes` | `isOrganizationLoggedIn` | Set single product attribute |
| <span class="badge badge-put">PUT</span> | `/products/:productId/attributes` | `isOrganizationLoggedIn` | Set multiple product attributes |
| <span class="badge badge-get">GET</span> | `/products/:productId/attributes` | `asyncHandler(attributeController.getProductAttributes.bind(a` | Product Attributes |
| <span class="badge badge-post">POST</span> | `/products/:productId/attributes` | `asyncHandler(attributeController.setProductAttribute.bind(at` | — |
| <span class="badge badge-put">PUT</span> | `/products/:productId/attributes` | `asyncHandler(attributeController.setProductAttributes.bind(a` | — |
| <span class="badge badge-delete">DELETE</span> | `/products/:productId/attributes/:attributeId` | `isOrganizationLoggedIn` | Remove product attribute |
| <span class="badge badge-delete">DELETE</span> | `/products/:productId/attributes/:attributeId` | `asyncHandler(attributeController.removeProductAttribute.bind` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/availability` | `asyncHandler(productController.getProductAvailability)` | Get product availability
GET /products/:productId/availability |
| <span class="badge badge-post">POST</span> | `/products/:productId/configure` | `asyncHandler(productController.configureVariant)` | — |
| <span class="badge badge-post">POST</span> | `/products/:productId/configure` | `asyncHandler(productController.configureVariant)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/downloads` | `asyncHandler(productController.listDownloads)` | — |
| <span class="badge badge-post">POST</span> | `/products/:productId/downloads` | `asyncHandler(productController.createDownload)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/downloads` | `asyncHandler(productController.getProductDownloads)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/grouped-children` | `asyncHandler(productController.listGroupedChildren)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/images` | `asyncHandler(productController.getProductImages)` | — |
| <span class="badge badge-post">POST</span> | `/products/:productId/images` | `asyncHandler(productController.addProductImage)` | — |
| <span class="badge badge-put">PUT</span> | `/products/:productId/images/:imageId` | `asyncHandler(productController.updateProductImage)` | — |
| <span class="badge badge-delete">DELETE</span> | `/products/:productId/images/:imageId` | `asyncHandler(productController.deleteProductImage)` | — |
| <span class="badge badge-post">POST</span> | `/products/:productId/images/reorder` | `asyncHandler(productController.reorderProductImages)` | — |
| <span class="badge badge-post">POST</span> | `/products/:productId/publish` | `asyncHandler(productController.publishProduct)` | Publish a product
POST /business/products/:productId/publish |
| <span class="badge badge-get">GET</span> | `/products/:productId/qa` | `asyncHandler(productController.listProductQa)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/qa` | `asyncHandler(productController.listProductQaCustomer)` | — |
| <span class="badge badge-post">POST</span> | `/products/:productId/qa` | `asyncHandler(productController.submitProductQa)` | — |
| <span class="badge badge-patch">PATCH</span> | `/products/:productId/qa/:qaId/status` | `asyncHandler(productController.updateQaStatus)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/related` | `asyncHandler(productController.getRelatedProducts)` | Get related products
GET /products/:productId/related |
| <span class="badge badge-get">GET</span> | `/products/:productId/relationships` | `asyncHandler(productController.listRelationships)` | — |
| <span class="badge badge-post">POST</span> | `/products/:productId/relationships` | `asyncHandler(productController.createRelationship)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/reviews` | `asyncHandler(productController.getProductReviews)` | — |
| <span class="badge badge-post">POST</span> | `/products/:productId/reviews` | `optionalCustomerAuth` | — |
| <span class="badge badge-post">POST</span> | `/products/:productId/reviews/:reviewId/vote` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/reviews/media` | `asyncHandler(productController.listReviewMedia)` | — |
| <span class="badge badge-delete">DELETE</span> | `/products/:productId/reviews/media/:mediaId` | `asyncHandler(productController.deleteReviewMedia)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/similar` | `asyncHandler(productSearchController.findSimilar.bind(produc` | Find similar products |
| <span class="badge badge-get">GET</span> | `/products/:productId/similar` | `asyncHandler(productSearchController.findSimilar.bind(produc` | Find similar products
GET /customer/products/:productId/similar |
| <span class="badge badge-put">PUT</span> | `/products/:productId/status` | `asyncHandler(productController.updateProductStatus)` | Update product status
PUT /business/products/:productId/status |
| <span class="badge badge-get">GET</span> | `/products/:productId/store-availability` | `asyncHandler(productController.getProductStoreAvailability)` | Get product store availability
GET /business/products/:productId/store-availability |
| <span class="badge badge-post">POST</span> | `/products/:productId/unpublish` | `asyncHandler(productController.unpublishProduct)` | Unpublish a product
POST /business/products/:productId/unpublish |
| <span class="badge badge-get">GET</span> | `/products/:productId/variant-matrix` | `asyncHandler(productController.getVariantMatrix)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/variants` | `asyncHandler(productController.getProductVariants)` | — |
| <span class="badge badge-post">POST</span> | `/products/:productId/variants` | `asyncHandler(productController.createProductVariant)` | — |
| <span class="badge badge-get">GET</span> | `/products/:productId/variants/:variantId` | `asyncHandler(productController.getProductVariant)` | — |
| <span class="badge badge-put">PUT</span> | `/products/:productId/variants/:variantId` | `asyncHandler(productController.updateProductVariant)` | — |
| <span class="badge badge-delete">DELETE</span> | `/products/:productId/variants/:variantId` | `asyncHandler(productController.deleteProductVariant)` | — |
| <span class="badge badge-put">PUT</span> | `/products/:productId/visibility` | `asyncHandler(productController.updateProductVisibility)` | Update product visibility
PUT /business/products/:productId/visibility |
| <span class="badge badge-get">GET</span> | `/products/barcode/:barcode` | `asyncHandler(productController.findByBarcode)` | Find product by variant barcode
GET /business/products/barcode/:barcode |
| <span class="badge badge-get">GET</span> | `/products/barcode/:barcode` | `asyncHandler(productController.findByBarcode)` | Find product by variant barcode
GET /customer/products/barcode/:barcode |
| <span class="badge badge-get">GET</span> | `/products/bundles` | `asyncHandler(bundleController.getActiveBundles)` | — |
| <span class="badge badge-get">GET</span> | `/products/bundles/:id` | `asyncHandler(bundleController.getBundleDetails)` | — |
| <span class="badge badge-post">POST</span> | `/products/bundles/:id/calculate` | `asyncHandler(bundleController.calculateBundlePrice)` | — |
| <span class="badge badge-get">GET</span> | `/products/bundles/product/:productId` | `asyncHandler(bundleController.getBundleByProduct)` | — |
| <span class="badge badge-get">GET</span> | `/products/by-attribute/:code/:value` | `asyncHandler(productSearchController.findByAttribute.bind(pr` | Find products by attribute |
| <span class="badge badge-get">GET</span> | `/products/by-attribute/:code/:value` | `asyncHandler(productSearchController.findByAttribute.bind(pr` | Find products by attribute
GET /customer/products/by-attribute/:code/:value |
| <span class="badge badge-get">GET</span> | `/products/category/:categoryId` | `asyncHandler(productController.getProductsByCategory)` | Get products by category
GET /products/category/:categoryId |
| <span class="badge badge-get">GET</span> | `/products/featured` | `asyncHandler(productController.getFeaturedProducts)` | Get featured products
GET /products/featured |
| <span class="badge badge-get">GET</span> | `/products/search` | `asyncHandler(productSearchController.search.bind(productSear` | Search products with filters and facets |
| <span class="badge badge-post">POST</span> | `/products/search` | `asyncHandler(productSearchController.searchPost.bind(product` | — |
| <span class="badge badge-get">GET</span> | `/products/search` | `asyncHandler(productSearchController.search.bind(productSear` | Search products with advanced filters and facets
GET /customer/products/search |
| <span class="badge badge-post">POST</span> | `/products/search` | `asyncHandler(productSearchController.searchPost.bind(product` | Search products (POST for complex queries)
POST /customer/products/search |
| <span class="badge badge-get">GET</span> | `/products/search/suggestions` | `asyncHandler(productSearchController.getSuggestions.bind(pro` | Get search suggestions for autocomplete |
| <span class="badge badge-get">GET</span> | `/products/search/suggestions` | `asyncHandler(productSearchController.getSuggestions.bind(pro` | Get search suggestions for autocomplete
GET /customer/products/search/suggestions |
| <span class="badge badge-get">GET</span> | `/products/variants/:variantId` | `asyncHandler(productController.getProductVariant)` | Flat variant routes — must be before /:productId to avoid collision |
| <span class="badge badge-put">PUT</span> | `/products/variants/:variantId` | `asyncHandler(productController.updateProductVariant)` | — |
| <span class="badge badge-delete">DELETE</span> | `/products/variants/:variantId` | `asyncHandler(productController.deleteProductVariant)` | — |
| <span class="badge badge-patch">PATCH</span> | `/products/variants/:variantId/inventory` | `asyncHandler(productController.updateVariantInventory)` | — |
| <span class="badge badge-get">GET</span> | `/promotions` | `asyncHandler(promotionController.getPromotions)` | Promotion routes |
| <span class="badge badge-post">POST</span> | `/promotions` | `asyncHandler(promotionController.createPromotion)` | — |
| <span class="badge badge-get">GET</span> | `/promotions/:id` | `asyncHandler(promotionController.getPromotionById)` | — |
| <span class="badge badge-put">PUT</span> | `/promotions/:id` | `asyncHandler(promotionController.updatePromotion)` | — |
| <span class="badge badge-delete">DELETE</span> | `/promotions/:id` | `asyncHandler(promotionController.deletePromotion)` | — |
| <span class="badge badge-post">POST</span> | `/promotions/:id/activate` | `asyncHandler(promotionController.activatePromotion)` | — |
| <span class="badge badge-post">POST</span> | `/promotions/:id/pause` | `asyncHandler(promotionController.pausePromotion)` | — |
| <span class="badge badge-get">GET</span> | `/promotions/active` | `asyncHandler(promotionController.getActivePromotions)` | — |
| <span class="badge badge-put">PUT</span> | `/purchase-order-items/:id` | `asyncHandler(purchaseOrderController.updatePurchaseOrderItem` | — |
| <span class="badge badge-delete">DELETE</span> | `/purchase-order-items/:id` | `asyncHandler(purchaseOrderController.deletePurchaseOrderItem` | — |
| <span class="badge badge-get">GET</span> | `/purchase-orders` | `asyncHandler(purchaseOrderController.getPurchaseOrders)` | Purchase order CRUD |
| <span class="badge badge-post">POST</span> | `/purchase-orders` | `asyncHandler(purchaseOrderController.createPurchaseOrder)` | — |
| <span class="badge badge-get">GET</span> | `/purchase-orders/:id` | `asyncHandler(purchaseOrderController.getPurchaseOrderById)` | — |
| <span class="badge badge-put">PUT</span> | `/purchase-orders/:id` | `asyncHandler(purchaseOrderController.updatePurchaseOrder)` | — |
| <span class="badge badge-delete">DELETE</span> | `/purchase-orders/:id` | `asyncHandler(purchaseOrderController.deletePurchaseOrder)` | — |
| <span class="badge badge-post">POST</span> | `/purchase-orders/:id/approve` | `asyncHandler(purchaseOrderController.approvePurchaseOrder)` | Purchase order workflow |
| <span class="badge badge-post">POST</span> | `/purchase-orders/:id/cancel` | `asyncHandler(purchaseOrderController.cancelPurchaseOrder)` | — |
| <span class="badge badge-get">GET</span> | `/purchase-orders/:id/items` | `asyncHandler(purchaseOrderController.getPurchaseOrderItems)` | Purchase order items |
| <span class="badge badge-post">POST</span> | `/purchase-orders/:id/items` | `asyncHandler(purchaseOrderController.addPurchaseOrderItem)` | — |
| <span class="badge badge-get">GET</span> | `/purchase-orders/:id/receiving` | `asyncHandler(receivingController.getReceivingByPurchaseOrder` | — |
| <span class="badge badge-post">POST</span> | `/purchase-orders/:id/send` | `asyncHandler(purchaseOrderController.sendPurchaseOrder)` | — |
| <span class="badge badge-get">GET</span> | `/quotes` | `isOrganizationLoggedIn` | Quote management |
| <span class="badge badge-post">POST</span> | `/quotes` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/quotes/:quoteId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/quotes/:quoteId/accept` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/quotes/:quoteId/convert` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/quotes/:quoteId/internal-notes` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/quotes/:quoteId/line-items` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/quotes/:quoteId/line-items/:lineItemId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/quotes/:quoteId/line-items/:lineItemId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/quotes/:quoteId/notes` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/quotes/:quoteId/reject` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/quotes/:quoteId/send` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/quotes/:quoteId/viewed` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/rates` | `asyncHandler(shippingController.getRates)` | — |
| <span class="badge badge-post">POST</span> | `/rates` | `asyncHandler(shippingController.createRate)` | — |
| <span class="badge badge-get">GET</span> | `/rates/:id` | `asyncHandler(shippingController.getRateById)` | — |
| <span class="badge badge-put">PUT</span> | `/rates/:id` | `asyncHandler(shippingController.updateRate)` | — |
| <span class="badge badge-delete">DELETE</span> | `/rates/:id` | `asyncHandler(shippingController.deleteRate)` | — |
| <span class="badge badge-get">GET</span> | `/rates/:rateId/surcharges` | `asyncHandler(shippingController.getSurchargesByRate)` | — |
| <span class="badge badge-get">GET</span> | `/receiving` | `asyncHandler(receivingController.getReceivingRecords)` | Receiving record CRUD |
| <span class="badge badge-post">POST</span> | `/receiving` | `asyncHandler(receivingController.createReceivingRecord)` | — |
| <span class="badge badge-put">PUT</span> | `/receiving-items/:id` | `asyncHandler(receivingController.updateReceivingItem)` | — |
| <span class="badge badge-post">POST</span> | `/receiving-items/:id/accept` | `asyncHandler(receivingController.acceptReceivingItem)` | — |
| <span class="badge badge-post">POST</span> | `/receiving-items/:id/reject` | `asyncHandler(receivingController.rejectReceivingItem)` | — |
| <span class="badge badge-get">GET</span> | `/receiving/:id` | `asyncHandler(receivingController.getReceivingRecordById)` | — |
| <span class="badge badge-put">PUT</span> | `/receiving/:id` | `asyncHandler(receivingController.updateReceivingRecord)` | — |
| <span class="badge badge-post">POST</span> | `/receiving/:id/complete` | `asyncHandler(receivingController.completeReceiving)` | — |
| <span class="badge badge-get">GET</span> | `/receiving/:id/items` | `asyncHandler(receivingController.getReceivingItems)` | Receiving items |
| <span class="badge badge-post">POST</span> | `/receiving/:id/items` | `asyncHandler(receivingController.createReceivingItem)` | — |
| <span class="badge badge-delete">DELETE</span> | `/relationships/:relationshipId` | `asyncHandler(productController.deleteRelationship)` | — |
| <span class="badge badge-post">POST</span> | `/reports/generate` | `asyncHandler(reportingController.generateReport)` | Report generation (on-demand) |
| <span class="badge badge-get">GET</span> | `/reports/schedules` | `asyncHandler(reportingController.listSchedules)` | Report schedule CRUD |
| <span class="badge badge-post">POST</span> | `/reports/schedules` | `asyncHandler(reportingController.createSchedule)` | — |
| <span class="badge badge-get">GET</span> | `/reports/schedules/:scheduleId` | `asyncHandler(reportingController.getSchedule)` | — |
| <span class="badge badge-put">PUT</span> | `/reports/schedules/:scheduleId` | `asyncHandler(reportingController.updateSchedule)` | — |
| <span class="badge badge-delete">DELETE</span> | `/reports/schedules/:scheduleId` | `asyncHandler(reportingController.deleteSchedule)` | — |
| <span class="badge badge-get">GET</span> | `/reports/schedules/:scheduleId/executions` | `asyncHandler(reportingController.listExecutions)` | Report executions (history) |
| <span class="badge badge-get">GET</span> | `/reports/templates` | `asyncHandler(reportingController.getReportTemplates)` | Report templates |
| <span class="badge badge-get">GET</span> | `/returns` | `isOrganizationLoggedIn` | Return request CRUD + workflow |
| <span class="badge badge-post">POST</span> | `/returns` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/returns/:returnId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/returns/:returnId/approve` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/returns/:returnId/cancel` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/returns/:returnId/complete` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/returns/:returnId/deny` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/returns/:returnId/in-transit` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/returns/:returnId/inspect` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/returns/:returnId/received` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/reviews` | `asyncHandler(productController.listReviews)` | — |
| <span class="badge badge-get">GET</span> | `/reviews/:reviewId` | `asyncHandler(productController.getReview)` | — |
| <span class="badge badge-delete">DELETE</span> | `/reviews/:reviewId` | `asyncHandler(productController.deleteReview)` | — |
| <span class="badge badge-put">PUT</span> | `/reviews/:reviewId/approve` | `asyncHandler(productController.approveReview)` | — |
| <span class="badge badge-post">POST</span> | `/reviews/:reviewId/helpful` | `optionalCustomerAuth` | — |
| <span class="badge badge-put">PUT</span> | `/reviews/:reviewId/reject` | `asyncHandler(productController.rejectReview)` | — |
| <span class="badge badge-post">POST</span> | `/reviews/:reviewId/report` | `optionalCustomerAuth` | — |
| <span class="badge badge-post">POST</span> | `/reviews/:reviewId/respond` | `asyncHandler(productController.respondToReview)` | — |
| <span class="badge badge-get">GET</span> | `/scim/v2/Users` | `asyncHandler(scimController.listUsers.bind(scimController))` | SCIM 2.0 /Users endpoints |
| <span class="badge badge-post">POST</span> | `/scim/v2/Users` | `asyncHandler(scimController.createUser.bind(scimController))` | — |
| <span class="badge badge-get">GET</span> | `/scim/v2/Users/:id` | `asyncHandler(scimController.getUser.bind(scimController))` | — |
| <span class="badge badge-put">PUT</span> | `/scim/v2/Users/:id` | `asyncHandler(scimController.replaceUser.bind(scimController)` | — |
| <span class="badge badge-patch">PATCH</span> | `/scim/v2/Users/:id` | `asyncHandler(scimController.patchUser.bind(scimController))` | — |
| <span class="badge badge-delete">DELETE</span> | `/scim/v2/Users/:id` | `asyncHandler(scimController.deleteUser.bind(scimController))` | — |
| <span class="badge badge-get">GET</span> | `/segment` | `isOrganizationLoggedIn` | Segment CRUD |
| <span class="badge badge-post">POST</span> | `/segment` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/segment/:segmentId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/segment/:segmentId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/segment/:segmentId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/segment/:segmentId/evaluate` | `isOrganizationLoggedIn` | Segment evaluation & members |
| <span class="badge badge-get">GET</span> | `/segment/:segmentId/members` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/segment/profiles` | `isOrganizationLoggedIn` | Customer profiles (must be before /segment/:segmentId to avoid param matching) |
| <span class="badge badge-get">GET</span> | `/segment/profiles/:customerId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/segment/profiles/:customerId/compute` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/segment/profiles/:customerId/segments` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/segment/profiles/recompute-all` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/sso/oidc/callback/:providerId` | `asyncHandler(ssoController.oidcCallback.bind(ssoController))` | — |
| <span class="badge badge-post">POST</span> | `/sso/oidc/login/:providerId` | `asyncHandler(ssoController.initiateOidcLogin.bind(ssoControl` | OIDC SSO |
| <span class="badge badge-post">POST</span> | `/sso/oidc/providers` | `asyncHandler(ssoController.createOidcProvider.bind(ssoContro` | OIDC provider CRUD |
| <span class="badge badge-get">GET</span> | `/sso/oidc/providers/:providerId` | `asyncHandler(ssoController.getOidcProvider.bind(ssoControlle` | — |
| <span class="badge badge-put">PUT</span> | `/sso/oidc/providers/:providerId` | `asyncHandler(ssoController.updateOidcProvider.bind(ssoContro` | — |
| <span class="badge badge-delete">DELETE</span> | `/sso/oidc/providers/:providerId` | `asyncHandler(ssoController.deleteOidcProvider.bind(ssoContro` | — |
| <span class="badge badge-post">POST</span> | `/sso/oidc/providers/:providerId/activate` | `asyncHandler(ssoController.activateOidcProvider.bind(ssoCont` | — |
| <span class="badge badge-post">POST</span> | `/sso/oidc/providers/:providerId/deactivate` | `asyncHandler(ssoController.deactivateOidcProvider.bind(ssoCo` | — |
| <span class="badge badge-get">GET</span> | `/sso/providers` | `asyncHandler(ssoController.listProviders.bind(ssoController)` | List all SSO providers |
| <span class="badge badge-post">POST</span> | `/sso/saml/callback/:providerId` | `asyncHandler(ssoController.samlCallback.bind(ssoController))` | — |
| <span class="badge badge-post">POST</span> | `/sso/saml/login/:providerId` | `asyncHandler(ssoController.initiateSamlLogin.bind(ssoControl` | SAML SSO |
| <span class="badge badge-post">POST</span> | `/sso/saml/providers` | `asyncHandler(ssoController.createSamlProvider.bind(ssoContro` | SAML provider CRUD |
| <span class="badge badge-get">GET</span> | `/sso/saml/providers/:providerId` | `asyncHandler(ssoController.getSamlProvider.bind(ssoControlle` | — |
| <span class="badge badge-put">PUT</span> | `/sso/saml/providers/:providerId` | `asyncHandler(ssoController.updateSamlProvider.bind(ssoContro` | — |
| <span class="badge badge-delete">DELETE</span> | `/sso/saml/providers/:providerId` | `asyncHandler(ssoController.deleteSamlProvider.bind(ssoContro` | — |
| <span class="badge badge-post">POST</span> | `/sso/saml/providers/:providerId/activate` | `asyncHandler(ssoController.activateSamlProvider.bind(ssoCont` | — |
| <span class="badge badge-post">POST</span> | `/sso/saml/providers/:providerId/deactivate` | `asyncHandler(ssoController.deactivateSamlProvider.bind(ssoCo` | — |
| <span class="badge badge-get">GET</span> | `/store-credit/balance` | `isOrganizationLoggedIn` | Store credit |
| <span class="badge badge-post">POST</span> | `/store-credit/debit` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/store-credit/ledger` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/stores` | `asyncHandler(storeController.createStore.bind(storeControlle` | Create store |
| <span class="badge badge-get">GET</span> | `/stores` | `asyncHandler(storeController.listStores.bind(storeController` | List stores with filtering and pagination |
| <span class="badge badge-get">GET</span> | `/stores` | `async (req: HttpRequest, res: HttpResponse) => {
  try {
   ` | — |
| <span class="badge badge-get">GET</span> | `/stores/:storeId` | `asyncHandler(storeController.getStore.bind(storeController))` | Get store by ID |
| <span class="badge badge-put">PUT</span> | `/stores/:storeId` | `asyncHandler(storeController.updateStore.bind(storeControlle` | Update store |
| <span class="badge badge-delete">DELETE</span> | `/stores/:storeId` | `asyncHandler(storeController.deleteStore.bind(storeControlle` | Delete store |
| <span class="badge badge-get">GET</span> | `/stores/:storeId` | `async (req: HttpRequest, res: HttpResponse) => {
  try {
   ` | — |
| <span class="badge badge-put">PUT</span> | `/stores/:storeId/local-delivery` | `asyncHandler(storeController.setLocalDelivery.bind(storeCont` | Set local delivery zone |
| <span class="badge badge-put">PUT</span> | `/stores/:storeId/pickup` | `asyncHandler(storeController.configurePickup.bind(storeContr` | Configure store pickup (BOPIS) |
| <span class="badge badge-get">GET</span> | `/stores/active` | `asyncHandler(storeController.getActiveStores.bind(storeContr` | Get active stores (must be before :storeId to avoid collision) |
| <span class="badge badge-get">GET</span> | `/stores/business/:organizationId` | `asyncHandler(storeController.getStoresByBusiness.bind(storeC` | Get stores by business |
| <span class="badge badge-post">POST</span> | `/stores/hierarchy` | `asyncHandler(storeController.createStoreHierarchy.bind(store` | Create store hierarchy |
| <span class="badge badge-get">GET</span> | `/stores/slug/:slug` | `asyncHandler(storeController.getStoreBySlug.bind(storeContro` | Get store by slug |
| <span class="badge badge-get">GET</span> | `/subscriptions` | `asyncHandler(getCustomerSubscriptions)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/:id` | `asyncHandler(getCustomerSubscription)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/:id/bill` | `asyncHandler(processBillingCycle)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/:id/cancel` | `asyncHandler(cancelSubscriptionAdmin)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/:id/pause` | `asyncHandler(pauseSubscriptionAdmin)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/:id/resume` | `asyncHandler(resumeSubscriptionAdmin)` | — |
| <span class="badge badge-put">PUT</span> | `/subscriptions/:id/status` | `asyncHandler(updateSubscriptionStatus)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/:subscriptionId/dunning` | `asyncHandler(getDunningAttempts)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/:subscriptionId/orders` | `asyncHandler(getSubscriptionOrders)` | Subscription Orders |
| <span class="badge badge-get">GET</span> | `/subscriptions/billing/due` | `asyncHandler(getSubscriptionsDueBilling)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/dunning/pending` | `asyncHandler(getPendingDunning)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/mine` | `isCustomerLoggedIn` | List and view subscriptions |
| <span class="badge badge-get">GET</span> | `/subscriptions/mine/:id` | `isCustomerLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/subscriptions/mine/:id` | `isCustomerLoggedIn` | Manage subscription |
| <span class="badge badge-post">POST</span> | `/subscriptions/mine/:id/cancel` | `asyncHandler(cancelMySubscription)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/mine/:id/change-plan` | `asyncHandler(changePlan)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/mine/:id/orders` | `asyncHandler(getMySubscriptionOrders)` | Billing history |
| <span class="badge badge-post">POST</span> | `/subscriptions/mine/:id/pause` | `asyncHandler(pauseMySubscription)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/mine/:id/reactivate` | `asyncHandler(reactivateMySubscription)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/mine/:id/resume` | `asyncHandler(resumeMySubscription)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/mine/:id/skip` | `asyncHandler(skipNextDelivery)` | Skip delivery |
| <span class="badge badge-post">POST</span> | `/subscriptions/orders/:orderId/retry` | `asyncHandler(retrySubscriptionOrder)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/orders/:orderId/skip` | `asyncHandler(skipSubscriptionOrder)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/plans/:planId` | `asyncHandler(getSubscriptionPlanDetails)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/products` | `asyncHandler(getSubscriptionProducts)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/products` | `asyncHandler(createSubscriptionProduct)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/products` | `asyncHandler(getAvailableSubscriptionProducts)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/products/:id` | `asyncHandler(getSubscriptionProduct)` | — |
| <span class="badge badge-put">PUT</span> | `/subscriptions/products/:id` | `asyncHandler(updateSubscriptionProduct)` | — |
| <span class="badge badge-delete">DELETE</span> | `/subscriptions/products/:id` | `asyncHandler(deleteSubscriptionProduct)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/products/:productId` | `asyncHandler(getSubscriptionProductDetails)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/products/:productId/plans` | `asyncHandler(getSubscriptionPlans)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/products/:productId/plans` | `asyncHandler(createSubscriptionPlan)` | — |
| <span class="badge badge-get">GET</span> | `/subscriptions/products/:productId/plans/:planId` | `asyncHandler(getSubscriptionPlan)` | — |
| <span class="badge badge-put">PUT</span> | `/subscriptions/products/:productId/plans/:planId` | `asyncHandler(updateSubscriptionPlan)` | — |
| <span class="badge badge-delete">DELETE</span> | `/subscriptions/products/:productId/plans/:planId` | `asyncHandler(deleteSubscriptionPlan)` | — |
| <span class="badge badge-post">POST</span> | `/subscriptions/subscribe` | `isCustomerLoggedIn` | Create subscription |
| <span class="badge badge-put">PUT</span> | `/supplier-addresses/:id` | `asyncHandler(supplierController.updateSupplierAddress)` | — |
| <span class="badge badge-delete">DELETE</span> | `/supplier-addresses/:id` | `asyncHandler(supplierController.deleteSupplierAddress)` | — |
| <span class="badge badge-put">PUT</span> | `/supplier-products/:id` | `asyncHandler(supplierController.updateSupplierProduct)` | — |
| <span class="badge badge-delete">DELETE</span> | `/supplier-products/:id` | `asyncHandler(supplierController.removeProductFromSupplier)` | — |
| <span class="badge badge-get">GET</span> | `/suppliers` | `asyncHandler(supplierController.getSuppliers)` | Supplier CRUD |
| <span class="badge badge-post">POST</span> | `/suppliers` | `asyncHandler(supplierController.createSupplier)` | — |
| <span class="badge badge-get">GET</span> | `/suppliers/:id` | `asyncHandler(supplierController.getSupplierById)` | — |
| <span class="badge badge-put">PUT</span> | `/suppliers/:id` | `asyncHandler(supplierController.updateSupplier)` | — |
| <span class="badge badge-delete">DELETE</span> | `/suppliers/:id` | `asyncHandler(supplierController.deleteSupplier)` | — |
| <span class="badge badge-get">GET</span> | `/suppliers/:id/addresses` | `asyncHandler(supplierController.getSupplierAddresses)` | Supplier addresses |
| <span class="badge badge-post">POST</span> | `/suppliers/:id/addresses` | `asyncHandler(supplierController.createSupplierAddress)` | — |
| <span class="badge badge-post">POST</span> | `/suppliers/:id/approve` | `asyncHandler(supplierController.approveSupplier)` | — |
| <span class="badge badge-get">GET</span> | `/suppliers/:id/products` | `asyncHandler(supplierController.getSupplierProducts)` | Supplier products |
| <span class="badge badge-post">POST</span> | `/suppliers/:id/products` | `asyncHandler(supplierController.addProductToSupplier)` | — |
| <span class="badge badge-get">GET</span> | `/suppliers/:id/purchase-orders` | `asyncHandler(purchaseOrderController.getPurchaseOrdersBySupp` | — |
| <span class="badge badge-patch">PATCH</span> | `/suppliers/:id/status` | `asyncHandler(supplierController.updateSupplierStatus)` | Supplier status management |
| <span class="badge badge-post">POST</span> | `/suppliers/:id/suspend` | `asyncHandler(supplierController.suspendSupplier)` | — |
| <span class="badge badge-patch">PATCH</span> | `/suppliers/:id/visibility` | `asyncHandler(supplierController.updateSupplierVisibility)` | — |
| <span class="badge badge-get">GET</span> | `/suppliers/code/:code` | `asyncHandler(supplierController.getSupplierByCode)` | — |
| <span class="badge badge-get">GET</span> | `/suppliers/statistics` | `asyncHandler(supplierController.getSupplierStatistics)` | — |
| <span class="badge badge-get">GET</span> | `/support/agents` | `asyncHandler(getAgents)` | — |
| <span class="badge badge-post">POST</span> | `/support/agents` | `asyncHandler(createAgent)` | — |
| <span class="badge badge-get">GET</span> | `/support/agents/:id` | `asyncHandler(getAgent)` | — |
| <span class="badge badge-put">PUT</span> | `/support/agents/:id` | `asyncHandler(updateAgent)` | — |
| <span class="badge badge-get">GET</span> | `/support/alerts/price` | `asyncHandler(getPriceAlerts)` | — |
| <span class="badge badge-post">POST</span> | `/support/alerts/price` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/support/alerts/price/mine` | `isCustomerLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/support/alerts/price/mine/:id` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/support/alerts/price/notify` | `asyncHandler(notifyPriceAlerts)` | — |
| <span class="badge badge-get">GET</span> | `/support/alerts/stock` | `asyncHandler(getStockAlerts)` | — |
| <span class="badge badge-post">POST</span> | `/support/alerts/stock` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/support/alerts/stock/mine` | `isCustomerLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/support/alerts/stock/mine/:id` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/support/alerts/stock/notify` | `asyncHandler(notifyStockAlerts)` | — |
| <span class="badge badge-get">GET</span> | `/support/faq/articles` | `asyncHandler(getFaqArticles)` | — |
| <span class="badge badge-post">POST</span> | `/support/faq/articles` | `asyncHandler(createFaqArticle)` | — |
| <span class="badge badge-get">GET</span> | `/support/faq/articles/:id` | `asyncHandler(getFaqArticle)` | — |
| <span class="badge badge-put">PUT</span> | `/support/faq/articles/:id` | `asyncHandler(updateFaqArticle)` | — |
| <span class="badge badge-delete">DELETE</span> | `/support/faq/articles/:id` | `asyncHandler(deleteFaqArticle)` | — |
| <span class="badge badge-post">POST</span> | `/support/faq/articles/:id/feedback` | `asyncHandler(submitFaqFeedback)` | — |
| <span class="badge badge-post">POST</span> | `/support/faq/articles/:id/publish` | `asyncHandler(publishFaqArticle)` | — |
| <span class="badge badge-post">POST</span> | `/support/faq/articles/:id/unpublish` | `asyncHandler(unpublishFaqArticle)` | — |
| <span class="badge badge-get">GET</span> | `/support/faq/articles/:slug` | `asyncHandler(getFaqArticleBySlug)` | — |
| <span class="badge badge-get">GET</span> | `/support/faq/articles/popular` | `asyncHandler(getPopularFaqArticles)` | — |
| <span class="badge badge-get">GET</span> | `/support/faq/categories` | `asyncHandler(getFaqCategories)` | — |
| <span class="badge badge-post">POST</span> | `/support/faq/categories` | `asyncHandler(createFaqCategory)` | — |
| <span class="badge badge-get">GET</span> | `/support/faq/categories` | `asyncHandler(getFaqCategories)` | — |
| <span class="badge badge-get">GET</span> | `/support/faq/categories/:id` | `asyncHandler(getFaqCategory)` | — |
| <span class="badge badge-put">PUT</span> | `/support/faq/categories/:id` | `asyncHandler(updateFaqCategory)` | — |
| <span class="badge badge-delete">DELETE</span> | `/support/faq/categories/:id` | `asyncHandler(deleteFaqCategory)` | — |
| <span class="badge badge-get">GET</span> | `/support/faq/categories/:slug` | `asyncHandler(getFaqCategoryBySlug)` | — |
| <span class="badge badge-get">GET</span> | `/support/faq/categories/featured` | `asyncHandler(getFeaturedFaqCategories)` | — |
| <span class="badge badge-get">GET</span> | `/support/faq/search` | `asyncHandler(searchFaq)` | — |
| <span class="badge badge-get">GET</span> | `/support/tickets` | `asyncHandler(getTickets)` | — |
| <span class="badge badge-post">POST</span> | `/support/tickets` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/support/tickets/:id` | `asyncHandler(getTicket)` | — |
| <span class="badge badge-put">PUT</span> | `/support/tickets/:id` | `asyncHandler(updateTicket)` | — |
| <span class="badge badge-post">POST</span> | `/support/tickets/:id/assign` | `asyncHandler(assignTicket)` | — |
| <span class="badge badge-post">POST</span> | `/support/tickets/:id/close` | `asyncHandler(closeTicket)` | — |
| <span class="badge badge-post">POST</span> | `/support/tickets/:id/escalate` | `asyncHandler(escalateTicket)` | — |
| <span class="badge badge-post">POST</span> | `/support/tickets/:id/messages` | `asyncHandler(addAgentMessage)` | — |
| <span class="badge badge-post">POST</span> | `/support/tickets/:id/resolve` | `asyncHandler(resolveTicket)` | — |
| <span class="badge badge-get">GET</span> | `/support/tickets/mine` | `isCustomerLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/support/tickets/mine/:id` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/support/tickets/mine/:id/feedback` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/support/tickets/mine/:id/messages` | `isCustomerLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/surcharges` | `asyncHandler(shippingController.createSurcharge)` | — |
| <span class="badge badge-get">GET</span> | `/surcharges/:id` | `asyncHandler(shippingController.getSurchargeById)` | — |
| <span class="badge badge-put">PUT</span> | `/surcharges/:id` | `asyncHandler(shippingController.updateSurcharge)` | — |
| <span class="badge badge-delete">DELETE</span> | `/surcharges/:id` | `asyncHandler(shippingController.deleteSurcharge)` | — |
| <span class="badge badge-post">POST</span> | `/tax/calculate` | `asyncHandler(calculateTaxForLineItem)` | Public tax calculation endpoints |
| <span class="badge badge-post">POST</span> | `/tax/calculate/basket/:basketId` | `isCustomerLoggedIn` | Protected routes require authentication |
| <span class="badge badge-get">GET</span> | `/tax/categories` | `asyncHandler(getAllTaxCategories)` | -------------------- Tax Category Routes -------------------- |
| <span class="badge badge-post">POST</span> | `/tax/categories` | `asyncHandler(createTaxCategory)` | — |
| <span class="badge badge-get">GET</span> | `/tax/categories/:code` | `asyncHandler(getTaxCategoryByCode)` | — |
| <span class="badge badge-get">GET</span> | `/tax/categories/:id` | `asyncHandler(getTaxCategory)` | — |
| <span class="badge badge-put">PUT</span> | `/tax/categories/:id` | `asyncHandler(updateTaxCategory)` | — |
| <span class="badge badge-delete">DELETE</span> | `/tax/categories/:id` | `asyncHandler(deleteTaxCategory)` | — |
| <span class="badge badge-get">GET</span> | `/tax/exemption/:customerId` | `isCustomerLoggedIn` | Customer exemption check (requires authentication) |
| <span class="badge badge-get">GET</span> | `/tax/rates` | `asyncHandler(getAllTaxRates)` | -------------------- Tax Rate Routes -------------------- |
| <span class="badge badge-post">POST</span> | `/tax/rates` | `asyncHandler(createTaxRate)` | — |
| <span class="badge badge-get">GET</span> | `/tax/rates` | `asyncHandler(getTaxRates)` | Public tax information endpoints |
| <span class="badge badge-get">GET</span> | `/tax/rates/:id` | `asyncHandler(getTaxRate)` | — |
| <span class="badge badge-put">PUT</span> | `/tax/rates/:id` | `asyncHandler(updateTaxRate)` | — |
| <span class="badge badge-delete">DELETE</span> | `/tax/rates/:id` | `asyncHandler(deleteTaxRate)` | — |
| <span class="badge badge-get">GET</span> | `/tax/settings/:organizationId` | `asyncHandler(getCustomerTaxSettings)` | NEW: Get public tax settings for storefront |
| <span class="badge badge-get">GET</span> | `/tax/zones` | `asyncHandler(getAllTaxZones)` | -------------------- Tax Zone Routes -------------------- |
| <span class="badge badge-post">POST</span> | `/tax/zones` | `asyncHandler(createTaxZone)` | — |
| <span class="badge badge-get">GET</span> | `/tax/zones/:id` | `asyncHandler(getTaxZoneById)` | — |
| <span class="badge badge-put">PUT</span> | `/tax/zones/:id` | `asyncHandler(updateTaxZone)` | — |
| <span class="badge badge-delete">DELETE</span> | `/tax/zones/:id` | `asyncHandler(deleteTaxZone)` | — |
| <span class="badge badge-post">POST</span> | `/tax/zones/find` | `asyncHandler(findTaxZoneForAddress)` | NEW: Tax zone finder endpoint |
| <span class="badge badge-get">GET</span> | `/theme` | `isOrganizationLoggedIn` | Theme CRUD |
| <span class="badge badge-post">POST</span> | `/theme` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/theme/:themeId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/theme/:themeId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/theme/:themeId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/theme/:themeId/activate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/theme/:themeId/archive` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/theme/assign/:storeId` | `isOrganizationLoggedIn` | Theme assignment |
| <span class="badge badge-delete">DELETE</span> | `/theme/assign/:storeId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/theme/assignment/:storeId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/theme/built-in` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/theme/overrides` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/theme/overrides/:overrideId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/theme/overrides/:overrideId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/theme/overrides/organization/:organizationId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/theme/overrides/store/:storeId` | `isOrganizationLoggedIn` | Theme overrides |
| <span class="badge badge-get">GET</span> | `/theme/resolve/:storeId` | `isOrganizationLoggedIn` | Resolve theme for storefront rendering |
| <span class="badge badge-post">POST</span> | `/theme/seed/built-in` | `isOrganizationLoggedIn` | Admin: seed built-in themes |
| <span class="badge badge-get">GET</span> | `/theme/slug/:slug` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/track` | `asyncHandler(shippingController.trackShipment)` | — |
| <span class="badge badge-get">GET</span> | `/track/:id` | `asyncHandler(shippingController.trackShipment)` | — |
| <span class="badge badge-get">GET</span> | `/tracking/config` | `isOrganizationLoggedIn` | Config CRUD |
| <span class="badge badge-post">POST</span> | `/tracking/config` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/tracking/config/:storeId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/tracking/config/:storeId/activate` | `isOrganizationLoggedIn` | Lifecycle |
| <span class="badge badge-post">POST</span> | `/tracking/config/:storeId/disable` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/tracking/config/:storeId/gtm` | `isOrganizationLoggedIn` | GTM |
| <span class="badge badge-delete">DELETE</span> | `/tracking/config/:storeId/gtm` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/tracking/config/:storeId/hash-pii` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/tracking/config/:storeId/mappings` | `isOrganizationLoggedIn` | Event Mappings |
| <span class="badge badge-delete">DELETE</span> | `/tracking/config/:storeId/mappings/:sourceEvent` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/tracking/config/:storeId/meta-capi` | `isOrganizationLoggedIn` | Meta CAPI |
| <span class="badge badge-delete">DELETE</span> | `/tracking/config/:storeId/meta-capi` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/tracking/config/:storeId/server-side` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/tracking/process-event` | `isOrganizationLoggedIn` | Process event (manual trigger) |
| <span class="badge badge-get">GET</span> | `/tracking/status` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/transactions` | `asyncHandler(paymentController.listTransactions)` | ============================================================================ Transaction Routes ============================================================================ |
| <span class="badge badge-post">POST</span> | `/transactions` | `asyncHandler(paymentController.initiatePayment)` | — |
| <span class="badge badge-get">GET</span> | `/transactions/:transactionId` | `asyncHandler(paymentController.getTransaction)` | — |
| <span class="badge badge-delete">DELETE</span> | `/transactions/:transactionId` | `asyncHandler(paymentController.deleteTransaction)` | — |
| <span class="badge badge-post">POST</span> | `/transactions/:transactionId/refund` | `asyncHandler(paymentController.processRefund)` | — |
| <span class="badge badge-get">GET</span> | `/transactions/:transactionId/refunds` | `asyncHandler(paymentController.getRefunds)` | — |
| <span class="badge badge-get">GET</span> | `/users` | `isOrganizationLoggedIn` | B2B User management |
| <span class="badge badge-get">GET</span> | `/users/:userId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-delete">DELETE</span> | `/users/:userId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/users/:userId/activate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/users/:userId/profile` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/users/:userId/reactivate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/users/:userId/role` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/users/:userId/spending-limits` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/users/:userId/suspend` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/users/invite` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/vendors` | `isOrganizationLoggedIn` | Vendor CRUD + lifecycle |
| <span class="badge badge-post">POST</span> | `/vendors` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/vendors/:vendorId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/vendors/:vendorId` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/vendors/:vendorId/address` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/vendors/:vendorId/approve` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/vendors/:vendorId/bank-info` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/vendors/:vendorId/commission-rate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/vendors/:vendorId/suspend` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-post">POST</span> | `/vendors/:vendorId/terminate` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-put">PUT</span> | `/vendors/:vendorId/tier` | `isOrganizationLoggedIn` | — |
| <span class="badge badge-get">GET</span> | `/warehouse/:id` | `asyncHandler(warehouseController.getStoreById)` | — |
| <span class="badge badge-get">GET</span> | `/warehouse/:id/availability/:productId` | `asyncHandler(warehouseController.checkStoreAvailability)` | — |
| <span class="badge badge-get">GET</span> | `/warehouse/city/:city` | `asyncHandler(warehouseController.getStoresByCity)` | — |
| <span class="badge badge-get">GET</span> | `/warehouse/country/:country` | `asyncHandler(warehouseController.getStoresByCountry)` | — |
| <span class="badge badge-get">GET</span> | `/warehouse/nearest` | `asyncHandler(warehouseController.findNearestStores)` | Store Locator Routes (Public) |
| <span class="badge badge-get">GET</span> | `/warehouses` | `asyncHandler(warehouseController.getWarehouses)` | Warehouse listing with various filters |
| <span class="badge badge-post">POST</span> | `/warehouses` | `asyncHandler(warehouseController.createWarehouse)` | Warehouse CRUD operations |
| <span class="badge badge-get">GET</span> | `/warehouses/:id` | `asyncHandler(warehouseController.getWarehouseById)` | — |
| <span class="badge badge-put">PUT</span> | `/warehouses/:id` | `asyncHandler(warehouseController.updateWarehouse)` | — |
| <span class="badge badge-delete">DELETE</span> | `/warehouses/:id` | `asyncHandler(warehouseController.deleteWarehouse)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/activate` | `asyncHandler(warehouseController.activateWarehouse)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/bins` | `asyncHandler(warehouseController.createBin)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/:id/bins` | `asyncHandler(warehouseController.getBins)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/:id/bins/:binId` | `asyncHandler(warehouseController.getBinById)` | — |
| <span class="badge badge-put">PUT</span> | `/warehouses/:id/bins/:binId` | `asyncHandler(warehouseController.updateBin)` | — |
| <span class="badge badge-delete">DELETE</span> | `/warehouses/:id/bins/:binId` | `asyncHandler(warehouseController.deleteBin)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/deactivate` | `asyncHandler(warehouseController.deactivateWarehouse)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/default` | `asyncHandler(warehouseController.setDefaultWarehouse)` | Warehouse status management |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/pick-pack` | `asyncHandler(warehouseController.createPickPack)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/:id/pick-pack` | `asyncHandler(warehouseController.getPickPacks)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/:id/pick-pack/:pickPackId` | `asyncHandler(warehouseController.getPickPackById)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/pick-pack/:pickPackId/assign` | `asyncHandler(warehouseController.assignPickPack)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/pick-pack/:pickPackId/complete-packing` | `asyncHandler(warehouseController.completePacking)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/pick-pack/:pickPackId/complete-picking` | `asyncHandler(warehouseController.completePicking)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/pick-pack/:pickPackId/start-packing` | `asyncHandler(warehouseController.startPacking)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/pick-pack/:pickPackId/start-picking` | `asyncHandler(warehouseController.startPicking)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/receiving` | `asyncHandler(warehouseController.createReceiving)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/:id/receiving` | `asyncHandler(warehouseController.getReceiving)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/:id/receiving/:receivingId` | `asyncHandler(warehouseController.getReceivingById)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/receiving/:receivingId/complete` | `asyncHandler(warehouseController.completeReceiving)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/shipping-methods` | `asyncHandler(warehouseController.addShippingMethod)` | Shipping method management |
| <span class="badge badge-delete">DELETE</span> | `/warehouses/:id/shipping-methods/:method` | `asyncHandler(warehouseController.removeShippingMethod)` | — |
| <span class="badge badge-post">POST</span> | `/warehouses/:id/zones` | `asyncHandler(warehouseController.createZone)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/:id/zones` | `asyncHandler(warehouseController.getZones)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/:id/zones/:zoneId` | `asyncHandler(warehouseController.getZoneById)` | — |
| <span class="badge badge-put">PUT</span> | `/warehouses/:id/zones/:zoneId` | `asyncHandler(warehouseController.updateZone)` | — |
| <span class="badge badge-delete">DELETE</span> | `/warehouses/:id/zones/:zoneId` | `asyncHandler(warehouseController.deleteZone)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/code/:code` | `asyncHandler(warehouseController.getWarehouseByCode)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/country/:country` | `asyncHandler(warehouseController.getWarehousesByCountry)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/default` | `asyncHandler(warehouseController.getDefaultWarehouse)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/fulfillment-centers` | `asyncHandler(warehouseController.getFulfillmentCenters)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/nearest` | `asyncHandler(warehouseController.findNearestWarehouses)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/return-centers` | `asyncHandler(warehouseController.getReturnCenters)` | — |
| <span class="badge badge-get">GET</span> | `/warehouses/statistics` | `asyncHandler(warehouseController.getWarehouseStatistics)` | — |
| <span class="badge badge-get">GET</span> | `/webhooks` | `asyncHandler(webhookController.listWebhooks)` | List webhook endpoints
GET /business/webhooks |
| <span class="badge badge-post">POST</span> | `/webhooks` | `asyncHandler(webhookController.registerWebhook)` | Register a new webhook endpoint
POST /business/webhooks |
| <span class="badge badge-get">GET</span> | `/webhooks/:webhookEndpointId` | `asyncHandler(webhookController.getWebhook)` | Get a single webhook endpoint
GET /business/webhooks/:webhookEndpointId |
| <span class="badge badge-put">PUT</span> | `/webhooks/:webhookEndpointId` | `asyncHandler(webhookController.updateWebhook)` | Update a webhook endpoint
PUT /business/webhooks/:webhookEndpointId |
| <span class="badge badge-delete">DELETE</span> | `/webhooks/:webhookEndpointId` | `asyncHandler(webhookController.unregisterWebhook)` | Delete a webhook endpoint
DELETE /business/webhooks/:webhookEndpointId |
| <span class="badge badge-get">GET</span> | `/webhooks/:webhookEndpointId/deliveries` | `asyncHandler(webhookController.getDeliveries)` | Get deliveries for a webhook endpoint
GET /business/webhooks/:webhookEndpointId/deliveries |
| <span class="badge badge-post">POST</span> | `/webhooks/:webhookEndpointId/test` | `asyncHandler(webhookController.testWebhook)` | Test a webhook endpoint
POST /business/webhooks/:webhookEndpointId/test |
| <span class="badge badge-get">GET</span> | `/webhooks/events` | `asyncHandler(webhookController.getAvailableEvents)` | Get available event types
GET /business/webhooks/events |
| <span class="badge badge-get">GET</span> | `/zones` | `asyncHandler(shippingController.getZones)` | — |
| <span class="badge badge-post">POST</span> | `/zones` | `asyncHandler(shippingController.createZone)` | — |
| <span class="badge badge-get">GET</span> | `/zones/:id` | `asyncHandler(shippingController.getZoneById)` | — |
| <span class="badge badge-put">PUT</span> | `/zones/:id` | `asyncHandler(shippingController.updateZone)` | — |
| <span class="badge badge-delete">DELETE</span> | `/zones/:id` | `asyncHandler(shippingController.deleteZone)` | — |

