import type { HttpRouter } from 'libs/http';
import { asyncHandler } from '../../../libs/asyncHandler';
import {
  createPromotion,
  createPromotionForm,
  deletePromotion,
  editPromotionForm,
  listPromotions,
  previewPromotion,
  updatePromotion,
  viewPromotion,
  createCoupon,
  createCouponForm,
  deleteCoupon,
  editCouponForm,
  listCoupons,
  updateCoupon,
  validateCoupon,
  viewCoupon,
  activateGiftCardAction,
  assignGiftCardAction,
  cancelGiftCardAction,
  checkGiftCardBalance,
  createGiftCard,
  createGiftCardForm,
  editGiftCardForm,
  listGiftCards,
  refundToGiftCardAction,
  reloadGiftCardAction,
  viewGiftCard,
} from '../../../modules/promotion';
import {
  createPaymentGateway,
  createPaymentGatewayForm,
  deletePaymentGateway,
  editPaymentGatewayForm,
  listDisputes,
  listPaymentFees,
  listPaymentGateways,
  listPaymentMethods,
  listPaymentReports,
  listPaymentSettings,
  listPaymentTransactions,
  updateDisputeStatus,
  updatePaymentGateway,
  updatePaymentSettings,
  viewDispute,
  viewPaymentBalance,
  viewPaymentGateway,
  viewPaymentReport,
  createFraudRule,
  deleteFraudRule,
  listFraudRules,
  simulateFraudScreening,
  updateFraudRule,
} from '../../../modules/payment';
import {
  activateShippingMethod,
  createShippingMethod,
  createShippingMethodForm,
  deactivateShippingMethod,
  deleteShippingMethod,
  editShippingMethodForm,
  listShippingMethods,
  updateShippingMethod,
  viewShippingMethod,
  activateShippingZone,
  createShippingZone,
  createShippingZoneForm,
  deactivateShippingZone,
  deleteShippingZone,
  editShippingZoneForm,
  listShippingZones,
  updateShippingZone,
  viewShippingZone,
  activateShippingRate,
  calculateShippingRate,
  createShippingRate,
  createShippingRateForm,
  deactivateShippingRate,
  deleteShippingRate,
  editShippingRateForm,
  listShippingRates,
  updateShippingRate,
  viewShippingRate,
  listShippingSurcharges,
  createShippingSurchargeForm,
  createShippingSurcharge,
  viewShippingSurcharge,
  editShippingSurchargeForm,
  updateShippingSurcharge,
  deleteShippingSurcharge,
} from '../../../modules/shipping';
import {
  createContentPage,
  createContentPageForm,
  deleteContentPage,
  editContentPageForm,
  listContentMedia,
  listContentPages,
  listContentTemplates,
  publishContentPage,
  updateContentPage,
  viewContentPage,
  generateRobotsTxt,
  generateSitemap,
  listSEOSettings,
  updateSEOSettings,
  createContentBlock,
  createContentBlockForm,
  deleteContentBlock,
  editContentBlockForm,
  listContentBlocks,
  reorderContentBlocks,
  updateContentBlock,
} from '../../../modules/content';
import {
  activateNotificationTemplate,
  cloneNotificationTemplate,
  createNotificationTemplate,
  createNotificationTemplateForm,
  createWebhook,
  createWebhookForm,
  deactivateNotificationTemplate,
  deactivateWebhook,
  deleteNotificationTemplate,
  editNotificationTemplateForm,
  listBatches,
  listNotificationTemplates,
  listTemplateTranslations,
  listWebhooks,
  previewNotificationTemplate,
  updateNotificationTemplate,
  viewBatch,
  viewNotificationTemplate,
} from '../../../modules/notification';
import {
  createDraft,
  createDraftForm,
  deleteDraft,
  listPageBuilderDrafts,
  pageBuilderEditor,
  pageBuilderPreview,
  publishDraft,
} from '../../../modules/pagebuilder';
import {
  activateTheme,
  archiveTheme,
  assignTheme,
  deleteTheme,
  listThemes,
  saveOverride,
  themeDetail,
  themePreview,
  unassignTheme,
} from '../../../modules/theme';
import {
  bulkDeleteMedia,
  createFolder,
  deleteMedia,
  editMediaForm,
  listMedia,
  updateMedia,
  uploadMedia,
  uploadMediaForm,
  viewMedia,
} from '../../../modules/media';

/**
 * Marketing admin routes: promotions/coupons/gift cards, payments, shipping,
 * content & SEO, notifications, page builder, themes, and media library.
 */
export function registerMarketingRoutes(router: HttpRouter): void {
  registerPromotionAndShippingRoutes(router);
  registerContentRoutes(router);
}

/**
 * Promotions, coupons, gift cards, payments, and shipping.
 */
function registerPromotionAndShippingRoutes(router: HttpRouter): void {
  // ==========================================================================
  // Promotion Routes
  // ==========================================================================

  router.get('/promotions', asyncHandler(listPromotions));
  router.get('/promotions/create', asyncHandler(createPromotionForm));
  router.post('/promotions', asyncHandler(createPromotion));
  router.get('/promotions/:promotionId', asyncHandler(viewPromotion));
  router.get('/promotions/:promotionId/edit', asyncHandler(editPromotionForm));
  router.post('/promotions/:promotionId', asyncHandler(updatePromotion)); // Form POST
  router.put('/promotions/:promotionId', asyncHandler(updatePromotion)); // API PUT
  router.delete('/promotions/:promotionId', asyncHandler(deletePromotion));
  router.post('/promotions/preview', asyncHandler(previewPromotion));

  // ==========================================================================
  // Coupon Routes
  // ==========================================================================

  router.get('/promotions/coupons', asyncHandler(listCoupons));
  router.get('/promotions/coupons/create', asyncHandler(createCouponForm));
  router.post('/promotions/coupons', asyncHandler(createCoupon));
  router.get('/promotions/coupons/:couponId', asyncHandler(viewCoupon));
  router.get('/promotions/coupons/:couponId/edit', asyncHandler(editCouponForm));
  router.post('/promotions/coupons/:couponId', asyncHandler(updateCoupon));
  router.delete('/promotions/coupons/:couponId', asyncHandler(deleteCoupon));
  router.post('/promotions/coupons/validate', asyncHandler(validateCoupon));

  // ==========================================================================
  // Gift Card Routes
  // ==========================================================================

  router.get('/promotions/gift-cards', asyncHandler(listGiftCards));
  router.get('/promotions/gift-cards/create', asyncHandler(createGiftCardForm));
  router.post('/promotions/gift-cards', asyncHandler(createGiftCard));
  router.get('/promotions/gift-cards/:giftCardId', asyncHandler(viewGiftCard));
  router.get('/promotions/gift-cards/:giftCardId/edit', asyncHandler(editGiftCardForm));
  router.post('/promotions/gift-cards/:giftCardId/activate', asyncHandler(activateGiftCardAction));
  router.post('/promotions/gift-cards/:giftCardId/assign', asyncHandler(assignGiftCardAction));
  router.post('/promotions/gift-cards/:giftCardId/reload', asyncHandler(reloadGiftCardAction));
  router.post('/promotions/gift-cards/:giftCardId/refund', asyncHandler(refundToGiftCardAction));
  router.post('/promotions/gift-cards/:giftCardId/cancel', asyncHandler(cancelGiftCardAction));
  router.get('/promotions/gift-cards/balance/:code', asyncHandler(checkGiftCardBalance));

  // ==========================================================================
  // Payment Routes
  // ==========================================================================

  router.get('/payments', asyncHandler(listPaymentGateways));
  router.get('/payments/gateways', asyncHandler(listPaymentGateways));
  router.get('/payments/gateways/create', asyncHandler(createPaymentGatewayForm));
  router.post('/payments/gateways', asyncHandler(createPaymentGateway));
  router.get('/payments/gateways/:gatewayId', asyncHandler(viewPaymentGateway));
  router.get('/payments/gateways/:gatewayId/edit', asyncHandler(editPaymentGatewayForm));
  router.post('/payments/gateways/:gatewayId', asyncHandler(updatePaymentGateway));
  router.delete('/payments/gateways/:gatewayId', asyncHandler(deletePaymentGateway));

  router.get('/payments/methods', asyncHandler(listPaymentMethods));
  router.get('/payments/transactions', asyncHandler(listPaymentTransactions));

  // Payment Disputes
  router.get('/payments/disputes', asyncHandler(listDisputes));
  router.get('/payments/disputes/:disputeId', asyncHandler(viewDispute));
  router.post('/payments/disputes/:disputeId/status', asyncHandler(updateDisputeStatus));

  // Payment Fees
  router.get('/payments/fees', asyncHandler(listPaymentFees));

  // Payment Settings
  router.get('/payments/settings', asyncHandler(listPaymentSettings));
  router.post('/payments/settings/:organizationId', asyncHandler(updatePaymentSettings));

  // Payment Balance
  router.get('/payments/balance', asyncHandler(viewPaymentBalance));

  // Payment Reports
  router.get('/payments/reports', asyncHandler(listPaymentReports));
  router.get('/payments/reports/:reportId', asyncHandler(viewPaymentReport));

  // Fraud Rules (Epic F)
  router.get('/payment/fraud/rules', asyncHandler(listFraudRules));
  router.post('/payment/fraud/rules', asyncHandler(createFraudRule));
  router.put('/payment/fraud/rules/:fraudRuleId', asyncHandler(updateFraudRule));
  router.delete('/payment/fraud/rules/:fraudRuleId', asyncHandler(deleteFraudRule));
  router.post('/payment/fraud/simulate', asyncHandler(simulateFraudScreening));

  // ==========================================================================
  // Shipping Routes
  // ==========================================================================

  // Shipping overview - redirect to methods
  router.get('/shipping', asyncHandler(listShippingMethods));
  router.get('/shipping/methods/create', asyncHandler(createShippingMethodForm));
  router.post('/shipping/methods', asyncHandler(createShippingMethod));
  router.get('/shipping/methods/:methodId', asyncHandler(viewShippingMethod));
  router.get('/shipping/methods/:methodId/edit', asyncHandler(editShippingMethodForm));
  router.post('/shipping/methods/:methodId', asyncHandler(updateShippingMethod));
  router.delete('/shipping/methods/:methodId', asyncHandler(deleteShippingMethod));
  router.post('/shipping/methods/:methodId/activate', asyncHandler(activateShippingMethod));
  router.post('/shipping/methods/:methodId/deactivate', asyncHandler(deactivateShippingMethod));

  // ==========================================================================
  // Shipping Zones Routes
  // ==========================================================================

  router.get('/shipping/zones', asyncHandler(listShippingZones));
  router.get('/shipping/zones/create', asyncHandler(createShippingZoneForm));
  router.post('/shipping/zones', asyncHandler(createShippingZone));
  router.get('/shipping/zones/:zoneId', asyncHandler(viewShippingZone));
  router.get('/shipping/zones/:zoneId/edit', asyncHandler(editShippingZoneForm));
  router.post('/shipping/zones/:zoneId', asyncHandler(updateShippingZone));
  router.post('/shipping/zones/:zoneId/activate', asyncHandler(activateShippingZone));
  router.post('/shipping/zones/:zoneId/deactivate', asyncHandler(deactivateShippingZone));
  router.delete('/shipping/zones/:zoneId', asyncHandler(deleteShippingZone));

  // ==========================================================================
  // Shipping Rates Routes
  // ==========================================================================

  router.get('/shipping/rates', asyncHandler(listShippingRates));
  router.get('/shipping/rates/create', asyncHandler(createShippingRateForm));
  router.post('/shipping/rates', asyncHandler(createShippingRate));
  router.get('/shipping/rates/:rateId', asyncHandler(viewShippingRate));
  router.get('/shipping/rates/:rateId/edit', asyncHandler(editShippingRateForm));
  router.post('/shipping/rates/:rateId', asyncHandler(updateShippingRate));
  router.post('/shipping/rates/:rateId/activate', asyncHandler(activateShippingRate));
  router.post('/shipping/rates/:rateId/deactivate', asyncHandler(deactivateShippingRate));
  router.delete('/shipping/rates/:rateId', asyncHandler(deleteShippingRate));
  router.post('/shipping/rates/calculate', asyncHandler(calculateShippingRate));

  // ==========================================================================
  // Shipping Surcharges Routes
  // ==========================================================================

  router.get('/shipping/surcharges', asyncHandler(listShippingSurcharges));
  router.get('/shipping/surcharges/create', asyncHandler(createShippingSurchargeForm));
  router.post('/shipping/surcharges', asyncHandler(createShippingSurcharge));
  router.get('/shipping/surcharges/:surchargeId', asyncHandler(viewShippingSurcharge));
  router.get('/shipping/surcharges/:surchargeId/edit', asyncHandler(editShippingSurchargeForm));
  router.post('/shipping/surcharges/:surchargeId', asyncHandler(updateShippingSurcharge));
  router.delete('/shipping/surcharges/:surchargeId', asyncHandler(deleteShippingSurcharge));
}

/**
 * Content pages/blocks, SEO, notifications, media library,
 * page builder, and themes.
 */
function registerContentRoutes(router: HttpRouter): void {
  // ==========================================================================
  // Content Routes
  // ==========================================================================

  router.get('/content/pages', asyncHandler(listContentPages));
  router.get('/content/pages/create', asyncHandler(createContentPageForm));
  router.post('/content/pages', asyncHandler(createContentPage));
  router.get('/content/pages/:pageId', asyncHandler(viewContentPage));
  router.get('/content/pages/:pageId/edit', asyncHandler(editContentPageForm));
  router.post('/content/pages/:pageId', asyncHandler(updateContentPage));
  router.post('/content/pages/:pageId/publish', asyncHandler(publishContentPage));
  router.delete('/content/pages/:pageId', asyncHandler(deleteContentPage));

  router.get('/content/templates', asyncHandler(listContentTemplates));
  router.get('/content/media', asyncHandler(listContentMedia));

  // ==========================================================================
  // SEO Routes
  // ==========================================================================

  router.get('/marketing/seo', asyncHandler(listSEOSettings));
  router.post('/marketing/seo', asyncHandler(updateSEOSettings));
  router.get('/marketing/seo/robots.txt', asyncHandler(generateRobotsTxt));
  router.get('/marketing/seo/sitemap.xml', asyncHandler(generateSitemap));

  // ==========================================================================
  // Notification Routes
  // ==========================================================================

  router.get('/notifications/templates', asyncHandler(listNotificationTemplates));
  router.get('/notifications/templates/create', asyncHandler(createNotificationTemplateForm));
  router.post('/notifications/templates', asyncHandler(createNotificationTemplate));
  router.get('/notifications/templates/:templateId', asyncHandler(viewNotificationTemplate));
  router.get('/notifications/templates/:templateId/edit', asyncHandler(editNotificationTemplateForm));
  router.post('/notifications/templates/:templateId', asyncHandler(updateNotificationTemplate));
  router.post('/notifications/templates/:templateId/activate', asyncHandler(activateNotificationTemplate));
  router.post('/notifications/templates/:templateId/deactivate', asyncHandler(deactivateNotificationTemplate));
  router.delete('/notifications/templates/:templateId', asyncHandler(deleteNotificationTemplate));
  router.post('/notifications/templates/:templateId/clone', asyncHandler(cloneNotificationTemplate));
  router.post('/notifications/templates/:templateId/preview', asyncHandler(previewNotificationTemplate));
  router.get('/notifications/templates/:templateId/translations', asyncHandler(listTemplateTranslations));
  router.get('/notifications/batches', asyncHandler(listBatches));
  router.get('/notifications/batches/:batchId', asyncHandler(viewBatch));
  router.get('/notifications/webhooks', asyncHandler(listWebhooks));
  router.get('/notifications/webhooks/create', asyncHandler(createWebhookForm));
  router.post('/notifications/webhooks', asyncHandler(createWebhook));
  router.post('/notifications/webhooks/:webhookId/deactivate', asyncHandler(deactivateWebhook));

  // ==========================================================================
  // Content Blocks Routes
  // ==========================================================================

  router.get('/content/blocks', asyncHandler(listContentBlocks));
  router.get('/content/blocks/create', asyncHandler(createContentBlockForm));
  router.post('/content/blocks', asyncHandler(createContentBlock));
  router.get('/content/blocks/:blockId/edit', asyncHandler(editContentBlockForm));
  router.post('/content/blocks/:blockId', asyncHandler(updateContentBlock));
  router.delete('/content/blocks/:blockId', asyncHandler(deleteContentBlock));
  router.post('/content/pages/:pageId/reorder-blocks', asyncHandler(reorderContentBlocks));

  // ==========================================================================
  // Media Library Routes
  // ==========================================================================

  router.get('/content/media', asyncHandler(listMedia));
  router.get('/content/media/upload', asyncHandler(uploadMediaForm));
  router.post('/content/media/upload', asyncHandler(uploadMedia));
  router.get('/content/media/:mediaId', asyncHandler(viewMedia));
  router.get('/content/media/:mediaId/edit', asyncHandler(editMediaForm));
  router.post('/content/media/:mediaId', asyncHandler(updateMedia));
  router.delete('/content/media/:mediaId', asyncHandler(deleteMedia));
  router.post('/content/media/bulk-delete', asyncHandler(bulkDeleteMedia));
  router.post('/content/media/folders', asyncHandler(createFolder));

  // ==========================================================================
  // Page Builder Routes
  // ==========================================================================

  router.get('/page-builder', asyncHandler(listPageBuilderDrafts));
  router.get('/page-builder/create', asyncHandler(createDraftForm));
  router.post('/page-builder/create', asyncHandler(createDraft));
  router.get('/page-builder/:draftId', asyncHandler(pageBuilderEditor));
  router.get('/page-builder/:draftId/preview', asyncHandler(pageBuilderPreview));
  router.post('/page-builder/:draftId/publish', asyncHandler(publishDraft));
  router.delete('/page-builder/:draftId', asyncHandler(deleteDraft));

  // ==========================================================================
  // Theme Management Routes
  // ==========================================================================

  router.get('/themes', asyncHandler(listThemes));
  router.get('/themes/:themeId', asyncHandler(themeDetail));
  router.get('/themes/:themeId/preview', asyncHandler(themePreview));
  router.post('/themes/:themeId/assign', asyncHandler(assignTheme));
  router.post('/themes/:themeId/unassign', asyncHandler(unassignTheme));
  router.post('/themes/:themeId/override', asyncHandler(saveOverride));
  router.post('/themes/:themeId/activate', asyncHandler(activateTheme));
  router.post('/themes/:themeId/archive', asyncHandler(archiveTheme));
  router.post('/themes/:themeId/delete', asyncHandler(deleteTheme));
}
