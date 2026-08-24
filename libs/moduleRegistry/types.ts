/**
 * Module Manifest Types
 *
 * Each module declares a manifest describing its name, dependencies,
 * routes, GraphQL schema, events, and database tables. The registry
 * uses these manifests to toggle modules on/off via feature flags.
 */

/** Whether a module is required or optional. */
export type ModuleRequirement = 'required' | 'optional';

/** Route mount point descriptor. */
export interface RouteDeclaration {
  /** Express mount path, e.g. '/business/products' or '/customer/orders'. */
  path: string;
  /** Which auth scope is required. */
  auth: 'admin' | 'organization' | 'customer' | 'public' | 'webhook';
}

/** GraphQL schema descriptor. */
export interface GraphQLDeclaration {
  /** Whether this module contributes to the GraphQL schema. */
  enabled: boolean;
}

/** Event subscription descriptor. */
export interface EventDeclaration {
  /** Event types this module subscribes to. */
  subscribes: string[];
  /** Event types this module emits. */
  publishes: string[];
}

/** Database table descriptor. */
export interface TableDeclaration {
  /** Table names owned by this module. */
  names: string[];
}

/**
 * Module Manifest — declared by each module in its `manifest.ts` file.
 */
export interface ModuleManifest {
  /** Unique module name, matching the directory name. */
  name: string;
  /** Human-readable description. */
  description: string;
  /** Whether this module can be toggled off. Required modules always load. */
  requirement: ModuleRequirement;
  /** Modules this module depends on (must be enabled for this to load). */
  dependsOn?: string[];
  /** Routes this module mounts. */
  routes?: RouteDeclaration[];
  /** GraphQL schema contribution. */
  graphql?: GraphQLDeclaration;
  /** Events this module subscribes to and publishes. */
  events?: EventDeclaration;
  /** Database tables owned by this module. */
  tables?: TableDeclaration;
  /** Feature flag key used to toggle this module. If null, always enabled. */
  featureFlagKey?: string;
}
