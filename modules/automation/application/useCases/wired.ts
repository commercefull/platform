import { AutomationRuleRepositoryImpl, ExecutionLogRepositoryImpl } from '../../infrastructure';
import { AutomationExecutionEngine } from '../services/AutomationExecutionEngine';
import { CreateAutomationRuleUseCase } from './CreateAutomationRule';
import { UpdateAutomationRuleUseCase } from './UpdateAutomationRule';
import { DeleteAutomationRuleUseCase } from './DeleteAutomationRule';
import { GetAutomationRuleUseCase } from './GetAutomationRule';
import { ListAutomationRulesUseCase } from './ListAutomationRules';

const ruleRepo = new AutomationRuleRepositoryImpl();
const logRepo = new ExecutionLogRepositoryImpl();

export const createAutomationRuleUseCase = new CreateAutomationRuleUseCase(ruleRepo);
export const updateAutomationRuleUseCase = new UpdateAutomationRuleUseCase(ruleRepo);
export const deleteAutomationRuleUseCase = new DeleteAutomationRuleUseCase(ruleRepo);
export const getAutomationRuleUseCase = new GetAutomationRuleUseCase(ruleRepo);
export const listAutomationRulesUseCase = new ListAutomationRulesUseCase(ruleRepo);

export const executionEngine = new AutomationExecutionEngine(ruleRepo, logRepo);
export { AutomationExecutionEngine };
