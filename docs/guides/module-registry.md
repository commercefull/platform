# Module Registry & Feature Flags

The platform includes a module registry system that controls which modules are active at runtime. Each of the 42 modules declares a manifest, and the registry gates route mounting, GraphQL schema inclusion, event handler registration, and migration execution.

## How It Works

### Manifest Declaration

Each module declares its own manifest in `modules/<name>/manifest.ts` (re-exported through the module barrel). `boot/moduleManifests.ts` collects them and calls `moduleRegistry.registerAll(...)`:

```typescript
// modules/audit/manifest.ts
import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'audit',
  description: 'Immutable, hash-chained audit log',
  requirement: 'optional',
  routes: [{ path: '/business/audit', auth: 'organization' }],
  graphql: { enabled: false },
  events: { subscribes: [], publishes: ['log.recorded', 'chain.verified', 'chain.tampered'] },
  tables: { names: ['auditLog'] },
  featureFlagKey: 'module.audit.enabled',
};
```

### Registry API

The registry singleton (`libs/moduleRegistry/registry.ts`) exposes:

| Method                             | Returns   | Description                                     |
| ---------------------------------- | --------- | ----------------------------------------------- |
| `isEnabled(moduleName)`            | `boolean` | Whether the module is active                    |
| `shouldMountRoutes(moduleName)`    | `boolean` | Whether to mount the module's Express routers   |
| `shouldIncludeGraphQL(moduleName)` | `boolean` | Whether to include the module's GraphQL schema  |
| `shouldRegisterEvents(moduleName)` | `boolean` | Whether to register the module's event handlers |
| `shouldRunMigrations(moduleName)`  | `boolean` | Whether to run the module's migrations          |
| `setFeatureFlagProvider(fn)`       | `void`    | Plug in a DB-backed async flag provider         |
| `reset()`                          | `void`    | Clear all registrations (for tests)             |

### Boot Sequence

```
app.ts
  1. registerModuleManifestsSync()   — collect each module's manifest.ts, initialize with env vars
  2. registerAllEventHandlers()      — each module's eventHandlers.ts register fn is gated by shouldRegisterEvents()
  3. startOutboxDispatcher()         — durable event bus
  4. boot/routes.ts                  — each router checks shouldMountRoutes()
  5. boot/graphql.ts                 — each schema checks shouldIncludeGraphQL()
  6. initializeScheduledJobs()       — each module's scheduledJobs.ts registered when the module is enabled
```

## Required vs Optional Modules

| Requirement  | Count | Modules                                                                    |
| ------------ | ----- | -------------------------------------------------------------------------- |
| **Required** | 6     | `identity`, `order`, `product`, `payment`, `configuration`, `organization` |
| **Optional** | 36    | All others — can be toggled off                                            |

Required modules are always loaded and cannot be disabled. Optional modules can be toggled via environment variables or a DB-backed feature flag provider.

## Toggling Modules

### Via Environment Variable

```bash
# Disable a module
MODULE_AUDIT_ENABLED=false
MODULE_MARKETPLACE_ENABLED=false

# Enable a module (default for optional modules is enabled)
MODULE_TRACKING_ENABLED=true
```

The env var pattern is `MODULE_<NAME>_ENABLED` where `<NAME>` is the module name in uppercase.

### Via DB-Backed Feature Flag Provider

For runtime toggling without restarts, plug in an async provider:

```typescript
import { moduleRegistry } from './libs/moduleRegistry';

moduleRegistry.setFeatureFlagProvider(async (key: string) => {
  const result = await queryOne<{ isEnabled: boolean }>(`SELECT "isEnabled" FROM "featureFlag" WHERE "key" = $1`, [key]);
  return result?.isEnabled ?? true; // default to enabled
});
```

The provider is called with the `featureFlagKey` from each module's manifest. If the provider throws or returns `undefined`, the module defaults to enabled.

### Dependency Resolution

Optional modules with unmet `dependsOn` are auto-disabled. For example, `pagebuilder` depends on `content` and `theme` — if either is disabled, `pagebuilder` is also disabled.

```typescript
{
  name: 'pagebuilder',
  requirement: 'optional',
  dependsOn: ['content', 'theme'],
  // ...
}
```

## Adding a New Module to the Registry

1. Declare the manifest in `modules/myModule/manifest.ts`, export it from the module barrel, and add it to the `manifests` array in `boot/moduleManifests.ts`:

```typescript
// modules/myModule/manifest.ts
import type { ModuleManifest } from '../../libs/moduleRegistry';

export const manifest: ModuleManifest = {
  name: 'myModule',
  description: 'Does something useful',
  requirement: 'optional',
  dependsOn: [],
  routes: [{ path: '/business/my-module', auth: 'organization' }],
  graphql: { enabled: false },
  events: { subscribes: ['mymodule.thing_happened'], publishes: ['mymodule.thing_happened'] },
  tables: { names: ['myModuleTable'] },
  featureFlagKey: 'module.mymodule.enabled',
};
```

2. Mount your router in `boot/routes.ts` — add it to the customer/business router list with its module name so `shouldMountRoutes` gates it.

3. Own your event handlers in `modules/myModule/application/eventHandlers.ts` and add an entry to `eventHandlerModules` in `boot/registerEventHandlers.ts` — the entry is gated by `shouldRegisterEvents('myModule')`. Declare cross-module dependencies as narrow injected ports; boot (the composition root) passes the concrete repositories.

4. Own your cron jobs in `modules/myModule/scheduledJobs.ts` (export `scheduledJobs: ScheduledJobDefinition[]`) and add the module to `jobModules` in `boot/scheduledJobs.ts` — jobs register only while the module is enabled.

5. Toggle with `MODULE_MYMODULE_ENABLED=false` or via DB flag.

## Testing

The registry can be reset between tests:

```typescript
import { moduleRegistry } from '../../libs/moduleRegistry';

afterEach(() => {
  moduleRegistry.reset();
});
```

Unit tests for the registry itself are in `libs/moduleRegistry/registry.test.ts` (23 tests covering registration, initialization, required vs optional, env var toggle, feature flag provider, dependencies, and all `should*` helpers).
