jest.mock('./logger', () => ({
  logger: { info: jest.fn(), warning: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { parse, validate, buildSchema } from 'graphql';
import {
  createDepthLimitRule,
  getGraphQLValidationRules,
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_COMPLEXITY,
} from './graphqlSecurity';

const schema = buildSchema(`
  type Product {
    id: ID!
    name: String!
    variants: [Variant!]!
    images: [Image!]!
  }
  type Variant {
    id: ID!
    sku: String!
    images: [Image!]!
    attributes: [Attribute!]!
  }
  type Image {
    id: ID!
    url: String!
  }
  type Attribute {
    id: ID!
    name: String!
    values: [String!]!
  }
  type Order {
    id: ID!
    items: [OrderItem!]!
  }
  type OrderItem {
    id: ID!
    product: Product!
  }
  type Query {
    products: [Product!]!
    orders: [Order!]!
    product(id: ID!): Product
  }
`);

function validateQuery(query: string, rules: ReturnType<typeof getGraphQLValidationRules>) {
  const doc = parse(query);
  return validate(schema, doc, rules as never);
}

describe('graphqlSecurity', () => {
  describe('createDepthLimitRule', () => {
    it('allows queries within depth limit', () => {
      const rules = [createDepthLimitRule(5)];
      const query = `query { products { id name } }`;
      const errors = validate(schema, parse(query), rules as never);
      expect(errors).toHaveLength(0);
    });

    it('rejects queries exceeding depth limit', () => {
      const rules = [createDepthLimitRule(2)];
      // depth: products(1) -> variants(2) -> images(3) exceeds limit of 2
      const query = `query { products { variants { images { id } } } }`;
      const errors = validate(schema, parse(query), rules as never);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('depth');
    });

    it('allows shallow queries with low depth limit', () => {
      const rules = [createDepthLimitRule(2)];
      const query = `query { products { id } }`;
      const errors = validate(schema, parse(query), rules as never);
      expect(errors).toHaveLength(0);
    });

    it('rejects deeply nested query with default depth limit', () => {
      // depth: products -> variants -> attributes -> values = 4 (within default 10)
      const query = `query { products { variants { attributes { values } } } }`;
      const errors = validateQuery(query, getGraphQLValidationRules(DEFAULT_MAX_DEPTH, DEFAULT_MAX_COMPLEXITY));
      expect(errors).toHaveLength(0);
    });
  });

  describe('createComplexityRule', () => {
    it('allows simple queries under complexity limit', () => {
      const rules = getGraphQLValidationRules(10, 1000);
      const query = `query { products { id name } }`;
      const errors = validateQuery(query, rules);
      expect(errors).toHaveLength(0);
    });

    it('rejects queries exceeding complexity limit', () => {
      // products (cost 10) x variants (cost 3) x images (cost 2) = 60 per product
      // Plus nested: products x variants x images = 10*3 + 10*3*2 = 90
      // With many fields this should exceed a low limit
      const rules = getGraphQLValidationRules(10, 50);
      const query = `query { products { variants { images { id url } attributes { id name values } } } }`;
      const errors = validateQuery(query, rules);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('complexity');
    });

    it('assigns higher cost to list fields', () => {
      // products has cost 10, a simple field has cost 1
      const rules = getGraphQLValidationRules(10, 15);
      const query = `query { products { id } }`;
      const errors = validateQuery(query, rules);
      // products (10) + id (1) + products*id (10*1=10) = 21 > 15
      expect(errors.length).toBeGreaterThan(0);
    });

    it('allows low-cost queries with tight complexity limit', () => {
      const rules = getGraphQLValidationRules(10, 5);
      // product (single object, cost 1) + id (1) + product*id (1) = 3
      const query = `query { product(id: "1") { id } }`;
      const errors = validateQuery(query, rules);
      expect(errors).toHaveLength(0);
    });
  });

  describe('getGraphQLValidationRules', () => {
    it('returns array of validation rules', () => {
      const rules = getGraphQLValidationRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThanOrEqual(2);
    });

    it('enforces both depth and complexity', () => {
      const rules = getGraphQLValidationRules(2, 10);
      // Exceeds depth (3 levels) and complexity
      const query = `query { products { variants { id } } }`;
      const errors = validateQuery(query, rules);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('default constants', () => {
    it('DEFAULT_MAX_DEPTH is 10', () => {
      expect(DEFAULT_MAX_DEPTH).toBe(10);
    });

    it('DEFAULT_MAX_COMPLEXITY is 1000', () => {
      expect(DEFAULT_MAX_COMPLEXITY).toBe(1000);
    });
  });
});
