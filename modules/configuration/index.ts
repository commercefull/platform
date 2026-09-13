/**
 * configuration module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/SystemConfigurationRepository';
export * from './domain/errors/ConfigurationErrors';

// Interface exports (routers, GraphQL)
export { systemConfigurationRouter } from './interface/http/SystemConfigurationRouter';
export { configurationTypeDefs } from './interface/graphql/typeDefs';
export { configurationResolvers } from './interface/graphql/resolvers';
