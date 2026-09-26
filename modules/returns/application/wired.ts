import { ReturnRuleRepo, ReturnRuleRepo as returnRuleRepo } from '../infrastructure';
import { ManageReturnRulesUseCase } from './useCases/ManageReturnRules';

export { returnRuleRepo, ReturnRuleRepo };

export const manageReturnRulesUseCase = new ManageReturnRulesUseCase(ReturnRuleRepo);
