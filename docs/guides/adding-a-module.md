# Adding a New Module

Step-by-step guide for engineers to add a new bounded context to the CommerceFull platform.

## Overview

Every module follows the DDD layer structure: `domain → application → infrastructure → interface`. The module is registered in the module manifest, routes are mounted in boot, and events are wired through the event bus.

## 1. Create the Directory Structure

```
modules/<moduleName>/
├── domain/
│   ├── entities/              # Aggregate roots & entities
│   ├── errors/                # Typed domain errors
│   ├── events/                # Domain event classes
│   ├── repositories/          # Repository interfaces (ports)
│   └── valueObjects/          # Value objects
├── application/
│   ├── useCases/              # Use case classes (command + execute)
│   └── ports/                 # ACL ports (if consuming other modules)
├── infrastructure/
│   └── repositories/          # SQL implementations of domain ports
├── interface/
│   ├── controllers/           # Express controllers
│   └── routers/               # Express routers
└── index.ts                   # Public API barrel export
```

## 2. Define Domain Entities

```typescript
// modules/<moduleName>/domain/entities/MyEntity.ts

export interface MyEntityProps {
  myEntityId: string;
  name: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class MyEntity {
  private props: MyEntityProps;

  private constructor(props: MyEntityProps) {
    this.props = props;
  }

  static create(props: Omit<MyEntityProps, 'myEntityId' | 'createdAt' | 'updatedAt'>): MyEntity {
    return new MyEntity({
      ...props,
      myEntityId: generateUUID(), // from libs/uuid
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: MyEntityProps): MyEntity {
    return new MyEntity(props);
  }

  // Domain methods enforce business rules
  activate(): void {
    if (this.props.status === 'archived') {
      throw new MyEntityArchivedError(this.props.myEntityId);
    }
    this.props.status = 'active';
    this.touch();
  }

  // Getters only — mutations go through domain methods
  get myEntityId(): string { return this.props.myEntityId; }
  get name(): string { return this.props.name; }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
```

## 3. Define Domain Errors

```typescript
// modules/<moduleName>/domain/errors/MyModuleErrors.ts

import { AppError } from '../../../../libs/errors';

export abstract class MyModuleError extends AppError {
  abstract readonly code: string;
}

export class MyEntityNotFoundError extends MyModuleError {
  readonly code = 'mymodule.not_found';
  readonly statusCode = 404;
  readonly severity = 'info' as const;

  constructor(myEntityId: string) {
    super(`My entity not found: ${myEntityId}`);
  }
}

export class MyEntityArchivedError extends MyModuleError {
  readonly code = 'mymodule.archived';
  readonly statusCode = 409;
  readonly severity = 'info' as const;

  constructor(myEntityId: string) {
    super(`My entity is archived: ${myEntityId}`);
  }
}
```

## 4. Define Repository Interface (Port)

```typescript
// modules/<moduleName>/domain/repositories/MyEntityRepository.ts

import { MyEntity } from '../entities/MyEntity';

export interface MyEntityRepository {
  findById(id: string): Promise<MyEntity | null>;
  findAll(filters: { status?: string; limit?: number; offset?: number }): Promise<MyEntity[]>;
  save(entity: MyEntity): Promise<MyEntity>;
  delete(id: string): Promise<void>;
}
```

## 5. Implement Repository (Infrastructure)

```typescript
// modules/<moduleName>/infrastructure/repositories/MyEntityRepositoryImpl.ts

import { query, queryOne } from '../../../../libs/db';
import { MyEntity, MyEntityProps } from '../../domain/entities/MyEntity';
import { MyEntityRepository } from '../../domain/repositories/MyEntityRepository';

export class MyEntityRepositoryImpl implements MyEntityRepository {
  async findById(id: string): Promise<MyEntity | null> {
    const row = await queryOne<MyEntityProps>(
      `SELECT * FROM "myEntity" WHERE "myEntityId" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
    return row ? MyEntity.reconstitute(row) : null;
  }

  async save(entity: MyEntity): Promise<MyEntity> {
    const props = entity.toJSON();
    const row = await queryOne<MyEntityProps>(
      `INSERT INTO "myEntity" ("myEntityId", "name", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("myEntityId") DO UPDATE SET
         "name" = $2, "status" = $3, "updatedAt" = $5
       RETURNING *`,
      [props.myEntityId, props.name, props.status, props.createdAt, props.updatedAt],
    );
    return MyEntity.reconstitute(row!);
  }

  // ... other methods
}
```

## 6. Write Use Cases

```typescript
// modules/<moduleName>/application/useCases/CreateMyEntity.ts

import { MyEntity } from '../../domain/entities/MyEntity';
import { MyEntityRepository } from '../../domain/repositories/MyEntityRepository';

export class CreateMyEntityCommand {
  constructor(public readonly name: string) {}
}

export class CreateMyEntityUseCase {
  constructor(private readonly repo: MyEntityRepository) {}

  async execute(command: CreateMyEntityCommand): Promise<MyEntity> {
    const entity = MyEntity.create({ name: command.name, status: 'draft' });
    return this.repo.save(entity);
  }
}
```

## 7. Create the Controller & Router

```typescript
// modules/<moduleName>/interface/controllers/myModuleController.ts

import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { logger } from '../../../../libs/logger';
import { MyEntityRepositoryImpl } from '../../infrastructure/repositories/MyEntityRepositoryImpl';
import { CreateMyEntityUseCase, CreateMyEntityCommand } from '../../application/useCases/CreateMyEntity';

const repo = new MyEntityRepositoryImpl();

export const createMyEntity = async (req: Request, res: Response) => {
  try {
    const useCase = new CreateMyEntityUseCase(repo);
    const entity = await useCase.execute(new CreateMyEntityCommand(req.body.name));
    successResponse(res, entity.toJSON(), 201);
  } catch (error: any) {
    logger.error('mymodule.create_failed', { error });
    errorResponse(res, 'Failed to create entity');
  }
};
```

```typescript
// modules/<moduleName>/interface/routers/myModuleRouter.ts

import { Router } from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { createMyEntity } from '../controllers/myModuleController';

const router = Router();
router.use(isOrganizationLoggedIn); // Required for all /business routes

router.post('/', createMyEntity);
// ... other routes

export default router;
```

**Route naming**: Follow `/business/{topic}/...` convention. The topic must match the module name.

## 8. Create the Migration

```javascript
// migrations/YYYYMMDDHHMMSS_<moduleName>_createMyEntityTable.js

exports.up = function (knex) {
  return knex.schema.createTable('myEntity', t => {
    t.uuid('myEntityId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('name', 255).notNullable();
    t.enu('status', ['draft', 'active', 'archived']).notNullable().defaultTo('draft');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deletedAt');

    t.index('status');
    t.index('createdAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('myEntity');
};
```

See [Migration Standards](#/guidelines/migrations) for the full convention.

## 9. Register the Module Manifest

Add the manifest in `boot/moduleManifests.ts`:

```typescript
{
  name: 'myModule',
  description: 'Does something useful',
  requirement: 'optional',
  dependsOn: [],
  routes: { enabled: true, prefix: '/business/my-module' },
  graphql: { enabled: false },
  events: { types: ['mymodule.created', 'mymodule.updated', 'mymodule.deleted'] },
  tables: ['myEntity'],
  featureFlagKey: 'module.mymodule.enabled',
}
```

See [Module Registry & Feature Flags](#/guides/module-registry) for details.

## 10. Mount Routes

In `boot/routes.ts`, gate the router with the module registry:

```typescript
import { moduleRegistry } from './libs/moduleRegistry';
import myModuleRouter from './modules/myModule/interface/routers/myModuleRouter';

// In the business routes section:
if (moduleRegistry.shouldMountRoutes('myModule')) {
  app.use('/business/my-module', myModuleRouter);
}
```

## 11. Register Event Handlers

If your module emits or consumes events, register handlers in `libs/events/registerEventHandlers.ts`:

```typescript
if (moduleRegistry.shouldRegisterEvents('myModule')) {
  registerHandler('mymodule.created', async (data) => {
    // React to event
  });
}
```

## 12. Add Admin UI (Optional)

If the module needs admin panel views:

1. Create a web controller in `web/admin/controllers/myModuleController.ts`
2. Create EJS views in `web/admin/views/myModule/`
3. Add routes in `web/admin/adminRouters.ts`
4. Add a navigation link in `web/admin/views/partials/navbar.ejs`
5. Add i18n keys in `locales/en/myModule.json`

See [Web Layer Standards](#/guidelines/web-layer) for the controller pattern.

## 13. Write Module Documentation

Create `docs/modules/<moduleName>.md` following the existing module doc pattern. Include:

- Overview
- Use cases
- API endpoints (method, path, description)
- Admin UI routes
- Domain errors (code, status, description)
- Events emitted
- Domain entities
- Application services
- Repository ports
- Owned tables
- Environment variables
- Integration test coverage

## 14. Write Tests

### Unit tests

Place next to the code:

```
modules/<moduleName>/domain/entities/__tests__/MyEntity.test.ts
modules/<moduleName>/application/useCases/__tests__/CreateMyEntity.test.ts
```

### Integration tests

```
tests/integration/<moduleName>/<moduleName>.test.ts
```

Follow the pattern in [Testing Standards](#/guidelines/testing). Include:
- CRUD operations
- Lifecycle transitions
- Listing and retrieval
- Auth rejection test (`it('requests without auth token → 401')`)
- Cleanup in `afterAll`

## 15. Add i18n Namespace

Create `locales/en/<moduleName>.json` with all user-facing strings. Add the namespace to each locale directory.

## 16. Verify

```bash
yarn lint              # TypeScript + ESLint
yarn test:unit         # Unit tests
yarn test:int          # Integration tests (requires running DB + server)
yarn db:migrate        # Run your new migration
yarn db:types          # Regenerate Knex types
```

## Checklist

- [ ] Directory structure follows DDD layers
- [ ] Domain entities use `create()` + `reconstitute()` factory methods
- [ ] Domain errors extend `AppError` with stable `code`, `statusCode`, `severity`
- [ ] Repository interface in `domain/`, implementation in `infrastructure/`
- [ ] Use cases are classes with `execute()` method
- [ ] Controller uses `successResponse()` / `errorResponse()`
- [ ] Router uses `isOrganizationLoggedIn` middleware
- [ ] Route prefix follows `/business/{topic}/...` convention
- [ ] Migration uses camelCase columns, UUIDv7 primary keys, `knex.fn.now()` timestamps
- [ ] Module manifest registered in `boot/moduleManifests.ts`
- [ ] Routes gated by `moduleRegistry.shouldMountRoutes()` in `boot/routes.ts`
- [ ] Event handlers gated by `moduleRegistry.shouldRegisterEvents()`
- [ ] `index.ts` barrel export created
- [ ] Module documentation at `docs/modules/<moduleName>.md`
- [ ] Unit tests for domain entities and use cases
- [ ] Integration tests for all API endpoints
- [ ] i18n namespace created in `locales/en/`
- [ ] `yarn lint` passes
- [ ] `yarn test` passes
