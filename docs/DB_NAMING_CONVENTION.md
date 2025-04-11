# CommerceFull Platform Naming Convention

## Database Naming Convention: snake_case

The CommerceFull platform has standardized on **snake_case** for all database column names. This document explains the naming convention, provides examples, and offers guidance for developers working with the codebase.

## Convention Guidelines

### Tables
- Use **snake_case** for table names
- Use singular form (e.g., `customer` not `customers`)
- Prefix tables with feature name when appropriate (e.g., `order_payment`)

### Columns
- Use **snake_case** for all column names (e.g., `first_name`, `customer_id`)
- Use descriptive names that clearly indicate the purpose
- Use consistent naming patterns across related tables

### Indexes and Constraints
- Use **snake_case** for index and constraint names
- Follow a pattern of `table_name_column_name_idx` for indexes
- Follow a pattern of `table_name_column_name_constraint` for constraints

## Examples

### ✅ Correct Usage (snake_case)

```sql
CREATE TABLE customer (
  id uuid PRIMARY KEY,
  first_name varchar(100),
  last_name varchar(100),
  email_verified boolean,
  last_login_at timestamp,
  created_at timestamp
);

CREATE TABLE order_payment (
  id uuid PRIMARY KEY,
  order_id uuid REFERENCES "order",
  payment_method varchar(50),
  transaction_id varchar(255),
  payment_status varchar(50)
);
```

### ❌ Incorrect Usage (camelCase)

```sql
CREATE TABLE customer (
  id uuid PRIMARY KEY,
  firstName varchar(100),
  lastName varchar(100),
  emailVerified boolean,
  lastLoginAt timestamp,
  createdAt timestamp
);
```

## Code-Database Mapping

When working with database entities in code:

1. **TypeScript Interfaces** should use snake_case for properties that map directly to database columns:

```typescript
interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email_verified: boolean;
  last_login_at: string;
  created_at: string;
}
```

2. **SQL Queries** should reference column names using snake_case:

```typescript
const customer = await queryOne<Customer>(
  'SELECT * FROM "customer" WHERE "email" = $1 AND "is_active" = true',
  [email]
);
```

3. **Repository methods** should accept and return objects with snake_case properties that match database columns.

## Implementation Notes

This naming convention represents a change from the previous camelCase standard used in some parts of the platform. The change was implemented to:

1. Follow industry best practices for database design
2. Improve consistency across the codebase
3. Make SQL queries more readable and less error-prone

## Migration Path

For existing code that uses camelCase:

1. Update relevant migrations to use snake_case column names
2. Modify repository interfaces and methods to use snake_case
3. Update SQL queries to reference snake_case column names
4. Adapt controllers to work with objects using snake_case property names

## Questions and Support

If you have questions about this naming convention or need help updating existing code to comply with it, please contact the platform team.
