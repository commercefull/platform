# Automation Module

## Overview

The Automation module provides a rule-based automation engine — condition/action DSL, event-bus-triggered execution, and execution logging.

---

## Public API (`index.ts`)

| Export | Type | Description |
|---|---|---|
| `AutomationRule` | Entity | Rule definition with trigger, conditions, actions |
| `AutomationRepository` | Port | Repository interface for rules and execution logs |
| `AutomationErrors` | Errors | Domain error classes |
| `ConditionEvaluator` | Service | Evaluates rule conditions against event context |
| `ActionExecutor` | Service | Executes rule actions (webhook, email, flag toggle) |
| `AutomationExecutionEngine` | Service | Orchestrates rule evaluation and execution |

---

## Domain Entities

| Entity | Description |
|---|---|
| `AutomationRule` | Rule with `ruleId`, `name`, `trigger` (event type), `conditions`, `actions`, `status` (active/paused/disabled), `executionCount` |

## Domain Errors

| Error | Code | Status |
|---|---|---|
| `AutomationRuleNotFoundError` | `automation.rule_not_found` | 404 |
| `AutomationValidationError` | `automation.validation_error` | 400 |
| `AutomationExecutionError` | `automation.execution_error` | 500 |

## Events

| Direction | Events |
|---|---|
| Publishes | `automation.rule_executed`, `automation.rule_failed` |
| Subscribes | `*` (wildcard — evaluates rules against any event) |

## Tables

| Table | Description |
|---|---|
| `automationRule` | Rule definitions with conditions and actions |
| `automationExecutionLog` | Execution records with status, output, duration |

## Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/business/automation/rules` | List automation rules |
| POST | `/business/automation/rules` | Create automation rule |
| PUT | `/business/automation/rules/:id` | Update automation rule |
| DELETE | `/business/automation/rules/:id` | Delete automation rule |
| GET | `/business/automation/rules/:id/executions` | Get execution history |
