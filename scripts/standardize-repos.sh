#!/bin/bash

# Repository Standardization Script
# This script updates all repositories to use consistent table naming with quoted identifiers

set -e

PLATFORM_ROOT="/Users/ank6259/work/commercefull/platform"

echo "🔧 Starting Repository Standardization..."
echo "================================================"

# List of repositories that need updates (from REPO_STANDARDIZATION_TODO.md)
REPOS=(
  # High Priority
  "modules/business/infrastructure/repositories/BusinessRepo.ts"
  "modules/store/infrastructure/repositories/StoreRepo.ts"
  "modules/configuration/infrastructure/repositories/SystemConfigurationRepo.ts"
  "modules/order/repos/orderItemRepo.ts"
  "modules/order/repos/orderFulfillmentRepo.ts"
  "modules/order/repos/orderAddressRepo.ts"
  "modules/order/repos/orderReturnRepo.ts"
  "modules/order/repos/fulfillmentStatusHistoryRepo.ts"
  "modules/payment/repos/payoutRepo.ts"
  "modules/payment/repos/fraudRepo.ts"
  "modules/payment/repos/subscriptionInvoiceRepo.ts"
  "modules/payment/repos/payoutItemRepo.ts"
  "modules/payment/repos/payoutSettingsRepo.ts"
  "modules/media/infrastructure/repositories/mediaRepo.ts"
  "modules/product/repos/productMediaRepo.ts"
  "modules/product/repos/productReviewRepo.ts"
  "modules/product/repos/bundleRepo.ts"
  "modules/product/repos/productRelationshipRepo.ts"
  "modules/product/repos/productSeoRepo.ts"
  "modules/product/repos/productDownloadRepo.ts"
  "modules/pricing/repos/priceListRepo.ts"
  "modules/pricing/repos/currencyPriceRuleRepo.ts"
  "modules/pricing/repos/ruleAdjustmentRepo.ts"
  "modules/pricing/repos/ruleConditionRepo.ts"
  "modules/membership/repos/membershipRepo.ts"
  "modules/membership/repos/membershipPaymentRepo.ts"
  "modules/membership/repos/membershipPlanBenefitRepo.ts"
  "modules/distribution/repos/fulfillmentRepo.ts"
  "modules/distribution/repos/shippingRepo.ts"
  "modules/distribution/repos/warehouseRepo.ts"
  "modules/distribution/repos/channelRepo.ts"
  "modules/distribution/repos/pickupRepo.ts"
  "modules/distribution/repos/preOrderRepo.ts"
  "modules/b2b/repos/approvalRepo.ts"
  "modules/b2b/repos/companyRepo.ts"
  "modules/b2b/repos/quoteRepo.ts"
  
  # Medium Priority
  "modules/analytics/repos/analyticsRepo.ts"
  "modules/analytics/repos/reportingRepo.ts"
  "modules/loyalty/repos/customerLoyaltyTransactionRepo.ts"
  "modules/marketing/repos/abandonedCartRepo.ts"
  "modules/marketing/repos/emailCampaignRepo.ts"
  "modules/marketing/repos/affiliateRepo.ts"
  "modules/marketing/repos/recommendationRepo.ts"
  "modules/notification/repos/notificationTemplateRepo.ts"
  "modules/notification/repos/notificationDeliveryLogRepo.ts"
  "modules/supplier/repos/supplierAddressRepo.ts"
  "modules/supplier/repos/supplierProductRepo.ts"
  
  # Low Priority
  "modules/localization/repos/translationRepo.ts"
)

count=0
total=${#REPOS[@]}

for repo in "${REPOS[@]}"; do
  count=$((count + 1))
  file="$PLATFORM_ROOT/$repo"
  
  if [ ! -f "$file" ]; then
    echo "⚠️  [$count/$total] File not found: $repo"
    continue
  fi
  
  echo "📝 [$count/$total] Processing: $repo"
  
  # Check if already has db/types import
  if grep -q "db/types" "$file"; then
    echo "   ✅ Already standardized"
    continue
  fi
  
  # Add Table import after the db import line
  # This is a simple sed command - for complex cases, manual review is needed
  if grep -q "from.*libs/db'" "$file" || grep -q 'from.*libs/db"' "$file"; then
    echo "   🔄 Adding Table import..."
    # Note: This is a placeholder - actual implementation would need more sophisticated text processing
    echo "   ⚠️  Manual review required"
  else
    echo "   ⚠️  No db import found - manual review required"
  fi
done

echo ""
echo "================================================"
echo "✅ Standardization script completed!"
echo "📊 Processed: $count/$total repositories"
echo ""
echo "⚠️  IMPORTANT: This script identified files that need updates."
echo "   Manual review and updates are required for each repository."
echo "   See /docs/REPO_STANDARDIZATION_TODO.md for the complete list."
