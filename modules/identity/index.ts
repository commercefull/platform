/**
 * identity module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/StoreUserRepository';
export * from './domain/repositories/UserRepository';
export * from './domain/repositories/SessionRepository';
export * from './domain/repositories/TokenRepository';
export * from './domain/repositories/SocialAccountRepository';
export * from './domain/repositories/AdminManagementRepository';
export * from './domain/repositories/SsoProviderRepository';
export * from './domain/entities/SamlProvider';
export * from './domain/entities/OidcProvider';
export * from './domain/errors/SsoErrors';
export * from './domain/events/IdentityEvents';
export * from './domain/events/emitIdentityEvent';
export * from './domain/errors/IdentityErrors';
export * from './application/wired';

// Interface exports (routers, GraphQL)
export { identityCustomerRouter } from './interface/routers/identityCustomerRouter';
export { identitySocialRouter } from './interface/routers/identitySocialRouter';
export { identityBusinessRouter } from './interface/routers/identityBusinessRouter';
export { ssoRouter } from './interface/routers/ssoRouter';
export { scimRouter } from './interface/routers/scimRouter';
export { identityTypeDefs } from './interface/graphql/typeDefs';
export { identityResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
