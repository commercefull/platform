/**
 * Consolidated Customer Group Repository
 *
 * Merges customerGroupRepo, customerGroupMembershipRepo,
 * customerCurrencyPreferenceRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Customer Group (groups, memberships, currency preferences)
 */

import customerGroupRepo from './customerGroupRepo';
import customerGroupMembershipRepo from './customerGroupMembershipRepo';
import customerCurrencyPreferenceRepo from './customerCurrencyPreferenceRepo';

class CustomerGroupDataRepository {
  readonly groups = customerGroupRepo;
  readonly memberships = customerGroupMembershipRepo;
  readonly currencyPreferences = customerCurrencyPreferenceRepo;
}

export default new CustomerGroupDataRepository();
