/**
 * media module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/MediaRepository';
export * from './domain/errors/MediaErrors';

// Interface exports (routers, GraphQL)
export { mediaRouter } from './interface/http/MediaRouter';
export { mediaTypeDefs } from './interface/graphql/typeDefs';
export { mediaResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';

export { manifest } from './manifest';
