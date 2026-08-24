import { VendorRepositoryImpl } from '../../infrastructure/repositories/VendorRepositoryImpl';
import { CommissionRuleRepositoryImpl } from '../../infrastructure/repositories/CommissionRuleRepositoryImpl';
import { VendorPayoutRepositoryImpl } from '../../infrastructure/repositories/VendorPayoutRepositoryImpl';
import { MarketplaceController } from '../../interface/controllers/marketplaceController';

const vendorRepo = new VendorRepositoryImpl();
const commissionRepo = new CommissionRuleRepositoryImpl();
const payoutRepo = new VendorPayoutRepositoryImpl();

export const marketplaceController = new MarketplaceController(vendorRepo, commissionRepo, payoutRepo);

export {
  ManageVendorUseCase,
  ManageCommissionRuleUseCase,
  ManagePayoutUseCase,
} from '../../application/useCases/Marketplace';

export {
  VendorRepositoryImpl,
  CommissionRuleRepositoryImpl,
  VendorPayoutRepositoryImpl,
} from '../../infrastructure';
