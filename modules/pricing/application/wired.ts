import pricingDataRepository from '../infrastructure/repositories/PricingDataRepository';
import pricingRuleRepository from '../infrastructure/repositories/PricingRuleRepository';
import currencyRepository from '../infrastructure/repositories/CurrencyRepository';
import { pricingRuleRepo } from '../infrastructure';
import { MembershipBenefitsAdapter } from '../infrastructure/acl/MembershipBenefitsAdapter';
import { LoyaltyBalanceAdapter } from '../infrastructure/acl/LoyaltyBalanceAdapter';
import { MembershipRepo } from '../../membership/infrastructure/repositories/membershipRepo';
import { LoyaltyRepo } from '../../loyalty/infrastructure/repositories/loyaltyRepo';
import { PricingService } from './pricingService';

export { pricingDataRepository, pricingRuleRepository, currencyRepository };

export { pricingRuleRepo };

export const pricingService = new PricingService(
  new MembershipBenefitsAdapter(new MembershipRepo()),
  new LoyaltyBalanceAdapter(new LoyaltyRepo()),
  pricingRuleRepository,
  pricingDataRepository,
  currencyRepository,
);
