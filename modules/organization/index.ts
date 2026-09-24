/**
 * organization module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/OrganizationRepository';
export * from './domain/errors/OrganizationErrors';
export * from './domain/entities/Organization';

// Interface exports (routers, GraphQL)
export { organizationBusinessRouter } from './interface/http/organizationBusinessRouter';
export { organizationTypeDefs } from './interface/graphql/typeDefs';
export { organizationResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';

export { manifest } from './manifest';
