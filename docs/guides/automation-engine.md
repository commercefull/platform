# Automation Engine

A guide to the CommerceFull automation engine — how rules are defined, persisted, evaluated, and executed on the event bus.

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Event Bus   │────▶│  Execution Engine │────▶│  Action Executor  │
│  (trigger)   │     │  (evaluate + run) │     │  (side effects)   │
└─────────────┘     └────────┬─────────┘     └───────────────────┘
                     │        │
              ┌──────▼──┐  ┌──▼──────────────┐
              │ Rule DB  │  │ Execution Log DB │
              │ (JSONB)  │  │ (audit trail)    │
              └─────────┘  └─────────────────┘
```

The automation engine sits on top of the existing event bus (`libs/events/eventBus.ts`) and provides a declarative rule system: **when X happens and Y is true, do Z**.

## Module Structure

```
modules/automation/
├── domain/
│   ├── entities/AutomationRule.ts       # Rule entity (create, update, activate, recordExecution)
│   ├── services/ConditionEvaluator.ts   # 15-operator condition DSL evaluator
│   ├── services/ActionExecutor.ts       # Action registry + sequential/parallel execution
│   ├── errors/AutomationErrors.ts       # Domain errors
│   └── repositories/AutomationRepository.ts  # Port interfaces
├── infrastructure/
│   ├── repositories/AutomationRepositoryImpl.ts  # PostgreSQL rule + log repos
│   └── index.ts
├── application/
│   ├── services/AutomationExecutionEngine.ts  # Core engine: trigger → evaluate → execute → log
│   ├── useCases/AutomationRuleCrud.ts          # Create/Update/Delete/Get/List use cases
│   ├── useCases/wired.ts                       # Singleton wiring
│   └── useCases/index.ts
├── interface/
│   ├── controllers/automationController.ts     # HTTP controller
│   └── routers/automationRouter.ts             # /business/automation routes
└── index.ts                                    # Public barrel
```

## Core Concepts

### 1. Trigger Types

A rule is activated by a trigger. Four trigger types are supported:

| Trigger Type | Description | Config Required |
|---|---|---|
| `event` | Reacts to a specific event bus event | `triggerConfig.eventName` |
| `schedule` | Runs on a cron schedule (future) | `triggerConfig.cronExpression` |
| `manual` | Triggered via API call | None |
| `segment_membership_added` / `segment_membership_removed` | Reacts to CDP segment changes | `triggerConfig.segmentId` |

Example — event trigger:
```json
{
  "triggerType": "event",
  "triggerConfig": { "eventName": "order.completed" }
}
```

### 2. Condition DSL

Conditions are evaluated against a **context object** that contains the triggering event, customer, order, and product data. Each condition has a `field`, `operator`, and `value`/`values`.

**15 operators:**

| Operator | Description | Example |
|---|---|---|
| `eq` | Equals | `{ field: "customer.tier", operator: "eq", value: "loyal" }` |
| `neq` | Not equals | `{ field: "order.status", operator: "neq", value: "cancelled" }` |
| `gt` | Greater than | `{ field: "order.totalAmount", operator: "gt", value: 100 }` |
| `gte` | Greater than or equal | `{ field: "customer.lifetimeValue", operator: "gte", value: 5000 }` |
| `lt` | Less than | `{ field: "customer.daysSinceLastOrder", operator: "lt", value: 30 }` |
| `lte` | Less than or equal | `{ field: "product.price", operator: "lte", value: 50 }` |
| `in` | Value in list | `{ field: "customer.rfmSegment", operator: "in", values: ["champion", "loyal"] }` |
| `notIn` | Value not in list | `{ field: "order.status", operator: "notIn", values: ["cancelled", "refunded"] }` |
| `contains` | Array contains value | `{ field: "customer.tags", operator: "contains", value: "vip" }` |
| `notContains` | Array does not contain | `{ field: "customer.tags", operator: "notContains", value: "wholesale" }` |
| `startsWith` | String starts with | `{ field: "event.type", operator: "startsWith", value: "order" }` |
| `endsWith` | String ends with | `{ field: "event.type", operator: "endsWith", value: ".completed" }` |
| `isNull` | Value is null/undefined | `{ field: "customer.tier", operator: "isNull" }` |
| `isNotNull` | Value is not null | `{ field: "customer.tier", operator: "isNotNull" }` |
| `regex` | Matches regex pattern | `{ field: "event.type", operator: "regex", value: "^order\\." }` |

**Predefined fields:**

| Field | Resolved from context |
|---|---|
| `event.type` | `context.event.type` |
| `event.data.*` | `context.event` (full object) |
| `customer.tier` | `context.customer.tier` |
| `customer.lifetimeValue` | `context.customer.lifetimeValue` |
| `customer.totalOrders` | `context.customer.totalOrders` |
| `customer.daysSinceLastOrder` | `context.customer.daysSinceLastOrder` |
| `customer.rfmSegment` | `context.customer.rfmSegment` |
| `customer.tags` | `context.customer.tags` |
| `order.totalAmount` | `context.order.totalAmount` |
| `order.itemCount` | `context.order.itemCount` |
| `order.status` | `context.order.status` |
| `product.price` | `context.product.price` |
| `product.categoryId` | `context.product.categoryId` |
| `product.status` | `context.product.status` |
| `custom` | Uses `dataPath` for arbitrary nested access |

**Custom dataPath:** For fields not in the predefined list, use `field: "custom"` with a `dataPath` to resolve from the context:

```json
{
  "field": "custom",
  "operator": "eq",
  "value": "express",
  "dataPath": "event.data.shippingMethod"
}
```

**Match modes:**
- `all` (default) — All conditions must be true
- `any` — At least one condition must be true

### 3. Action DSL

Actions are the side effects executed when conditions are met. Each action has a `type`, `config`, and optional `delayMs`.

**12 action types:**

| Action Type | Description | Config |
|---|---|---|
| `send_notification` | Sends a notification via JobScheduler | `userId`, `notificationType`, `title`, `message`, `data`, `channels` |
| `send_email` | Sends an email (future) | `to`, `template`, `data` |
| `add_tag` | Adds a tag to a customer profile | `customerId`, `tag` |
| `remove_tag` | Removes a tag from a customer profile | `customerId`, `tag` |
| `add_to_segment` | Adds customer to a CDP segment (future) | `customerId`, `segmentId` |
| `remove_from_segment` | Removes customer from a segment (future) | `customerId`, `segmentId` |
| `apply_discount` | Applies a discount (future) | `customerId`, `percent`, `code` |
| `create_order` | Creates an order (future) | `items`, `customerId` |
| `update_order_status` | Updates order status (future) | `orderId`, `status` |
| `emit_event` | Emits a new event on the event bus | `eventName`, `eventData` |
| `webhook` | Calls an external webhook (future) | `url`, `method`, `headers`, `body` |
| `custom` | Custom handler — logged only | Any config |

**Execution modes:**
- `sequential` (default) — Actions run in order; stops on first failure
- `parallel` — All actions run concurrently via `Promise.all`

**Delay:** Individual actions can have `delayMs` to wait before execution:

```json
{
  "type": "send_notification",
  "config": { "title": "Follow up", "message": "How was your order?" },
  "delayMs": 86400000
}
```

### 4. Extending Actions

New action types are registered via the action registry:

```typescript
import { registerActionHandler } from '../modules/automation/domain/services/ActionExecutor';

registerActionHandler('apply_discount', async (action, context) => {
  const customerId = action.config.customerId as string;
  const percent = action.config.percent as number;
  // ... apply discount logic ...
  return { actionType: 'apply_discount', success: true, output: { customerId, percent } };
});
```

The handler receives the `RuleAction` and an `ActionContext` containing the event, customer, order, product, organizationId, ruleId, and executionLogId.

## Execution Flow

### Event-Triggered Execution

1. An event is emitted on the event bus (e.g., `order.completed`)
2. The execution engine's `triggerEvent()` method is called with the event name and data
3. The engine loads all active rules matching `triggerType: "event"` and `triggerConfig.eventName` matching the event
4. For each rule (ordered by priority descending):
   - An execution log entry is created with status `running`
   - Conditions are evaluated against the context (`{ event: { type, data, correlationId } }`)
   - If conditions fail → log status `skipped`, increment execution count, done
   - If conditions pass → execute actions (sequential or parallel)
   - Action results are logged
   - Status set to `success` (all actions succeeded), `partial` (some succeeded), or `failed` (all failed)
   - Rule's execution/success/failure counts are updated
   - Execution log is finalized with duration, condition results, and action results

### Manual Trigger

Call `executionEngine.triggerManual(ruleId, context?)` via the API or programmatically. Same flow as above but with `triggerType: "manual"`.

## API Endpoints

All routes are mounted at `/business/automation` with `isOrganizationLoggedIn` auth.

| Method | Path | Description |
|---|---|---|
| `GET` | `/automation` | List all rules (query: `activeOnly=true`) |
| `GET` | `/automation/:ruleId` | Get a single rule |
| `POST` | `/automation` | Create a new rule |
| `PUT` | `/automation/:ruleId` | Update a rule |
| `DELETE` | `/automation/:ruleId` | Soft-delete a rule |
| `POST` | `/automation/:ruleId/trigger` | Manually trigger a rule (body: `{ context?: {} }`) |
| `GET` | `/automation/:ruleId/logs` | Get execution logs for a rule (query: `limit=50`) |

### Create Rule Example

```bash
curl -X POST http://localhost:3000/business/automation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "VIP Welcome Email",
    "description": "Send welcome email when a VIP customer registers",
    "triggerType": "event",
    "triggerConfig": { "eventName": "customer.registered" },
    "conditions": [
      { "field": "customer.tier", "operator": "eq", "value": "vip" }
    ],
    "conditionMatchMode": "all",
    "actions": [
      {
        "type": "send_notification",
        "config": {
          "notificationType": "welcome_vip",
          "title": "Welcome VIP!",
          "message": "Thanks for joining our VIP program.",
          "channels": ["email", "in_app"]
        }
      },
      {
        "type": "add_tag",
        "config": { "tag": "vip_welcomed" }
      }
    ],
    "actionExecutionMode": "sequential",
    "priority": 10
  }'
```

### Manual Trigger Example

```bash
curl -X POST http://localhost:3000/business/automation/rule-id/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "context": {
      "customer": { "customerId": "c1", "tier": "vip", "lifetimeValue": 10000 }
    }
  }'
```

## Database Schema

### `automationRule` table

| Column | Type | Description |
|---|---|---|
| `automationRuleId` | UUID PK | Unique identifier |
| `name` | TEXT | Rule name |
| `description` | TEXT | Optional description |
| `triggerType` | TEXT | `event`, `schedule`, `manual`, `segment_membership_added`, `segment_membership_removed` |
| `triggerConfig` | JSONB | Trigger configuration (eventName, cronExpression, segmentId) |
| `conditions` | JSONB | Array of condition objects |
| `conditionMatchMode` | TEXT | `all` or `any` |
| `actions` | JSONB | Array of action objects |
| `actionExecutionMode` | TEXT | `sequential` or `parallel` |
| `isActive` | BOOLEAN | Whether the rule is active |
| `priority` | INT | Higher = evaluated first |
| `executionCount` | INT | Total executions |
| `successCount` | INT | Successful executions |
| `failureCount` | INT | Failed executions |
| `lastTriggeredAt` | TIMESTAMP | Last trigger time |
| `lastExecutedAt` | TIMESTAMP | Last execution completion |
| `organizationId` | UUID | Optional org scope |
| `createdBy` | TEXT | Creator |
| `createdAt` / `updatedAt` / `deletedAt` | TIMESTAMP | Audit timestamps |

**Indexes:** `isActive+deletedAt`, `triggerType+isActive`, `organizationId+isActive`, `priority`

### `automationExecutionLog` table

| Column | Type | Description |
|---|---|---|
| `executionLogId` | UUID PK | Unique identifier |
| `automationRuleId` | UUID FK | Reference to rule |
| `triggerType` | TEXT | How the rule was triggered |
| `triggerEventId` | TEXT | Event ID (if event-triggered) |
| `correlationId` | TEXT | Correlation ID for tracing |
| `triggerData` | JSONB | The context that triggered the rule |
| `conditionResults` | JSONB | Whether conditions passed |
| `actionResults` | JSONB | Results of each action |
| `status` | TEXT | `pending`, `running`, `success`, `failed`, `skipped`, `partial` |
| `errorMessage` | TEXT | Error message if failed |
| `durationMs` | INT | Execution duration |
| `startedAt` | TIMESTAMP | Execution start |
| `completedAt` | TIMESTAMP | Execution completion |
| `organizationId` | UUID | Optional org scope |

**Indexes:** `automationRuleId+startedAt`, `status`, `correlationId`, `triggerEventId`

## Programmatic Usage

### Using the execution engine directly

```typescript
import { executionEngine } from '../modules/automation/application/useCases/wired';

// Trigger all rules matching an event
const results = await executionEngine.triggerEvent('order.completed', {
  orderId: 'o1',
  customerId: 'c1',
  totalAmount: 500,
}, correlationId);

// Manually trigger a specific rule
const result = await executionEngine.triggerManual('rule-uuid', {
  customer: { customerId: 'c1', tier: 'vip', lifetimeValue: 10000 },
});
```

### Using use cases

```typescript
import {
  createAutomationRuleUseCase,
  listAutomationRulesUseCase,
} from '../modules/automation/application/useCases/wired';

// Create a rule
const rule = await createAutomationRuleUseCase.execute({
  name: 'Low Stock Alert',
  triggerType: 'event',
  triggerConfig: { eventName: 'inventory.low' },
  conditions: [],
  actions: [
    { type: 'send_notification', config: { title: 'Low Stock!', message: 'Reorder needed.' } },
  ],
});

// List active rules
const rules = await listAutomationRulesUseCase.execute(true);
```

### Registering a custom action handler

```typescript
import { registerActionHandler } from '../modules/automation/domain/services/ActionExecutor';

registerActionHandler('apply_discount', async (action, context) => {
  const { customerId, percent } = action.config as { customerId: string; percent: number };
  // Apply discount logic...
  return { actionType: 'apply_discount', success: true, output: { customerId, percent } };
});
```

## Integration with Event Bus

The automation engine is designed to integrate with the platform's event bus (`libs/events/eventBus.ts`). To wire event-triggered rules:

1. Register a handler on the event bus that calls `executionEngine.triggerEvent()`
2. Or add a call in `libs/events/registerEventHandlers.ts` to route events to the automation engine

Example wiring in `registerEventHandlers.ts`:

```typescript
import { executionEngine } from '../../modules/automation/application/useCases/wired';

// Inside registerAllEventHandlers():
if (moduleRegistry.shouldRegisterEvents('automation')) {
  eventBus.registerHandler('order.completed', async (payload) => {
    await executionEngine.triggerEvent('order.completed', payload.data, payload.correlationId);
  });
}
```

## Execution Log & Audit Trail

Every rule execution is logged in the `automationExecutionLog` table with:
- The trigger data (event payload or manual context)
- Whether conditions passed
- Individual action results (success/failure, output, error, duration)
- Overall status and duration
- Correlation ID for tracing across systems

This provides a complete audit trail for debugging and monitoring automation behavior.

## Testing

Tests are in:
- `modules/automation/domain/automation.test.ts` — Entity lifecycle, condition evaluation (all 15 operators), dataPath resolution, match modes
- `modules/automation/infrastructure/repositories/automationRepo.test.ts` — Repository CRUD with mocked DB, execution log CRUD

Run:
```bash
npx jest --selectProjects unit --testPathPatterns="automation" --no-coverage
```
