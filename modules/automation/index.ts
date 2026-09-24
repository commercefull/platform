export * from './domain/entities/AutomationRule';
export * from './domain/services/ConditionEvaluator';
export * from './domain/services/ActionExecutor';
export * from './domain/errors/AutomationErrors';
export * from './domain/repositories/AutomationRepository';
export * from './infrastructure';
export * from './application/useCases';

// Interface exports (routers, GraphQL)
export { automationBusinessRouter } from './interface/routers/automationRouter';
export * from './interface/controllers';
