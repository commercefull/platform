/**
 * GraphQL Security — depth limiting and cost-based complexity analysis.
 *
 * These validation rules are passed to ApolloServer's `validationRules` option
 * to reject malicious or overly expensive queries before execution.
 */

import { GraphQLError, ValidationContext, ASTVisitor, FragmentDefinitionNode, Kind, SelectionNode, SelectionSetNode } from 'graphql';
import { logger } from './logger';

export const DEFAULT_MAX_DEPTH = 10;
export const DEFAULT_MAX_COMPLEXITY = 1000;

/**
 * Field cost map — assigns a cost to list/connection fields that return
 * multiple items. Scalar and single-object fields default to cost 1.
 */
interface FieldCost {
  cost?: number;
}

const defaultFieldCosts: Record<string, FieldCost> = {
  products: { cost: 10 },
  orders: { cost: 10 },
  inventoryItems: { cost: 10 },
  transactions: { cost: 5 },
  shipments: { cost: 5 },
  fulfillments: { cost: 5 },
  promotions: { cost: 5 },
  notifications: { cost: 5 },
  stores: { cost: 5 },
  deliveries: { cost: 5 },
  pointsHistory: { cost: 5 },
  attributes: { cost: 3 },
  attributeValues: { cost: 3 },
  variants: { cost: 3 },
  images: { cost: 2 },
  items: { cost: 2 },
  lines: { cost: 2 },
  addresses: { cost: 2 },
  tickets: { cost: 5 },
  faqs: { cost: 3 },
  warehouses: { cost: 5 },
  endpoints: { cost: 3 },
  deliveries_list: { cost: 5 },
};

/**
 * Depth of a selection: each Field level adds 1, fragment spreads and inline
 * fragments resolve to their own selection sets without adding a level.
 */
function selectionDepth(selection: SelectionNode, fragments: Map<string, FragmentDefinitionNode>, visited: Set<string>): number {
  if (selection.kind === Kind.FIELD) {
    return selection.selectionSet ? 1 + selectionSetDepth(selection.selectionSet, fragments, visited) : 0;
  }
  if (selection.kind === Kind.INLINE_FRAGMENT) {
    return selectionSetDepth(selection.selectionSet, fragments, visited);
  }
  // FragmentSpread — resolve against the document's fragment definitions.
  const name = selection.name.value;
  if (visited.has(name)) {
    return 0; // Cyclic fragments are rejected by spec validation; don't recurse.
  }
  const fragment = fragments.get(name);
  if (!fragment) {
    return 0;
  }
  visited.add(name);
  const depth = selectionSetDepth(fragment.selectionSet, fragments, visited);
  visited.delete(name);
  return depth;
}

function selectionSetDepth(selectionSet: SelectionSetNode, fragments: Map<string, FragmentDefinitionNode>, visited: Set<string>): number {
  let max = 0;
  for (const selection of selectionSet.selections) {
    const depth = selectionDepth(selection, fragments, visited);
    if (depth > max) {
      max = depth;
    }
  }
  return max;
}

/**
 * Create a depth limit validation rule.
 */
export function createDepthLimitRule(maxDepth: number = DEFAULT_MAX_DEPTH) {
  return (context: ValidationContext): ASTVisitor => ({
    OperationDefinition(node) {
      const fragments = new Map<string, FragmentDefinitionNode>();
      for (const definition of context.getDocument().definitions) {
        if (definition.kind === Kind.FRAGMENT_DEFINITION) {
          fragments.set(definition.name.value, definition);
        }
      }
      const depth = selectionSetDepth(node.selectionSet, fragments, new Set());
      if (depth > maxDepth) {
        logger.warn('GraphQL query exceeded depth limit', { depth, maxDepth });
        context.reportError(new GraphQLError(`'${node.operation}' operation exceeds maximum operation depth of ${maxDepth}`));
      }
    },
  });
}

/**
 * Create a cost-based complexity analysis validation rule.
 *
 * Walks the query AST and sums field costs. List fields multiply by their
 * cost factor. Rejects queries that exceed maxComplexity.
 */
function createComplexityRule(maxComplexity: number = DEFAULT_MAX_COMPLEXITY, fieldCosts: Record<string, FieldCost> = defaultFieldCosts) {
  return (context: ValidationContext): ASTVisitor => {
    let totalComplexity = 0;

    return {
      Field: {
        enter(node) {
          const fieldName = node.name.value;

          // Check if this field has a custom cost
          const costEntry = fieldCosts[fieldName];
          const fieldCost = costEntry?.cost ?? 1;

          totalComplexity += fieldCost;

          // Check for nested list selections (e.g., products { variants { images } })
          // Each nesting level multiplies cost
          if (node.selectionSet) {
            for (const selection of node.selectionSet.selections) {
              if (selection.kind === 'Field' && selection.name.value) {
                const nestedCost = fieldCosts[selection.name.value]?.cost ?? 1;
                totalComplexity += fieldCost * nestedCost;
              }
            }
          }
        },
      },
      Document: {
        leave() {
          if (totalComplexity > maxComplexity) {
            logger.warn('GraphQL query exceeded complexity limit', {
              totalComplexity,
              maxComplexity,
            });
            context.reportError(new GraphQLError(`Query complexity ${totalComplexity} exceeds maximum allowed ${maxComplexity}`));
          }
        },
      },
    };
  };
}

/**
 * Get all validation rules for GraphQL hardening.
 * Returns an array suitable for ApolloServer's `validationRules` option.
 */
export function getGraphQLValidationRules(maxDepth: number = DEFAULT_MAX_DEPTH, maxComplexity: number = DEFAULT_MAX_COMPLEXITY) {
  return [createDepthLimitRule(maxDepth), createComplexityRule(maxComplexity)];
}
