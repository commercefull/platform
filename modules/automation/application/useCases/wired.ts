import { AutomationRuleRepositoryImpl, ExecutionLogRepositoryImpl, AutomationActionEffectsImpl } from '../../infrastructure';
import { createActionHandlers } from '../../domain/services/ActionExecutor';
import { CreateAutomationRuleUseCase } from './CreateAutomationRule';
import { UpdateAutomationRuleUseCase } from './UpdateAutomationRule';
import { DeleteAutomationRuleUseCase } from './DeleteAutomationRule';
import { GetAutomationRuleUseCase } from './GetAutomationRule';
import { ListAutomationRulesUseCase } from './ListAutomationRules';
import { ExecuteAutomationRuleUseCase } from './ExecuteAutomationRule';
import { TriggerAutomationRuleUseCase } from './TriggerAutomationRule';

const ruleRepo = new AutomationRuleRepositoryImpl();
const logRepo = new ExecutionLogRepositoryImpl();

export const createAutomationRuleUseCase = new CreateAutomationRuleUseCase(ruleRepo);
export const updateAutomationRuleUseCase = new UpdateAutomationRuleUseCase(ruleRepo);
export const deleteAutomationRuleUseCase = new DeleteAutomationRuleUseCase(ruleRepo);
export const getAutomationRuleUseCase = new GetAutomationRuleUseCase(ruleRepo);
export const listAutomationRulesUseCase = new ListAutomationRulesUseCase(ruleRepo);

const actionHandlers = createActionHandlers(new AutomationActionEffectsImpl());

export const executeAutomationRuleUseCase = new ExecuteAutomationRuleUseCase(ruleRepo, logRepo, actionHandlers);
export const triggerAutomationRuleUseCase = new TriggerAutomationRuleUseCase(ruleRepo, executeAutomationRuleUseCase);
