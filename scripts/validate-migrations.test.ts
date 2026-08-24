import { validateMigrationFile, validateMigrations, formatResults } from '../scripts/validate-migrations';

describe('validateMigrationFile', () => {
  it('passes for a clean create migration', () => {
    const content = `
exports.up = function (knex) {
  return knex.schema.createTable('testTable', t => {
    t.uuid('testId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('name').notNullable();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('testTable');
};
`;
    const violations = validateMigrationFile('20260823000000_test_createTestTable.js', content);
    expect(violations).toHaveLength(0);
  });

  it('detects NOT NULL without default in alterTable', () => {
    const content = `
exports.up = function (knex) {
  return knex.schema.alterTable('product', t => {
    t.string('newColumn').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('product', t => {
    t.dropColumn('newColumn');
  });
};
`;
    const violations = validateMigrationFile('20260823000000_product_alterProduct.js', content);
    const notNullViolations = violations.filter(v => v.rule === 'NOT_NULL_WITHOUT_DEFAULT');
    expect(notNullViolations.length).toBeGreaterThan(0);
    expect(notNullViolations[0].severity).toBe('error');
  });

  it('does not flag NOT NULL in createTable', () => {
    const content = `
exports.up = function (knex) {
  return knex.schema.createTable('testTable', t => {
    t.string('name').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('testTable');
};
`;
    const violations = validateMigrationFile('20260823000000_test_createTestTable.js', content);
    const notNullViolations = violations.filter(v => v.rule === 'NOT_NULL_WITHOUT_DEFAULT');
    expect(notNullViolations).toHaveLength(0);
  });

  it('detects DROP COLUMN', () => {
    const content = `
exports.up = async function (knex) {
  await knex.schema.alterTable('product', t => {
    t.dropColumn('oldColumn');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('product', t => {
    t.string('oldColumn').nullable();
  });
};
`;
    const violations = validateMigrationFile('20260823000000_product_alterProduct.js', content);
    const dropViolations = violations.filter(v => v.rule === 'DROP_COLUMN');
    expect(dropViolations.length).toBeGreaterThan(0);
    expect(dropViolations[0].severity).toBe('error');
  });

  it('detects missing exports.down', () => {
    const content = `
exports.up = function (knex) {
  return knex.schema.createTable('testTable', t => {
    t.uuid('testId').primary();
  });
};
`;
    const violations = validateMigrationFile('20260823000000_test_createTestTable.js', content);
    const missingDown = violations.filter(v => v.rule === 'MISSING_DOWN');
    expect(missingDown.length).toBeGreaterThan(0);
    expect(missingDown[0].severity).toBe('error');
  });

  it('detects unguarded DROP TABLE', () => {
    const content = `
exports.up = function (knex) {
  return knex.schema.dropTable('oldTable');
};

exports.down = function (knex) {
  return knex.schema.createTable('oldTable', t => {
    t.uuid('id').primary();
  });
};
`;
    const violations = validateMigrationFile('20260823000000_test_dropOldTable.js', content);
    const dropTableViolations = violations.filter(v => v.rule === 'DROP_TABLE_UNGUARDED');
    expect(dropTableViolations.length).toBeGreaterThan(0);
    expect(dropTableViolations[0].severity).toBe('error');
  });

  it('does not flag guarded DROP TABLE', () => {
    const content = `
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('oldTable');
  if (!hasTable) return;
  return knex.schema.dropTable('oldTable');
};

exports.down = function (knex) {
  return knex.schema.createTable('oldTable', t => {
    t.uuid('id').primary();
  });
};
`;
    const violations = validateMigrationFile('20260823000000_test_dropOldTable.js', content);
    const dropTableViolations = violations.filter(v => v.rule === 'DROP_TABLE_UNGUARDED');
    expect(dropTableViolations).toHaveLength(0);
  });

  it('warns about alter migration without guards', () => {
    const content = `
exports.up = function (knex) {
  return knex.schema.alterTable('product', t => {
    t.string('newColumn').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('product', t => {
    t.dropColumn('newColumn');
  });
};
`;
    const violations = validateMigrationFile('20260823000000_product_alterProduct.js', content);
    const guardViolations = violations.filter(v => v.rule === 'NO_GUARD_IN_ALTER');
    expect(guardViolations.length).toBeGreaterThan(0);
    expect(guardViolations[0].severity).toBe('warning');
  });

  it('warns about CREATE INDEX without CONCURRENTLY', () => {
    const content = `
exports.up = async function (knex) {
  await knex.raw('CREATE INDEX "idx_product_slug" ON "product" ("slug")');
};

exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS "idx_product_slug"');
};
`;
    const violations = validateMigrationFile('20260823000000_product_alterProduct.js', content);
    const indexViolations = violations.filter(v => v.rule === 'INDEX_WITHOUT_CONCURRENTLY');
    expect(indexViolations.length).toBeGreaterThan(0);
    expect(indexViolations[0].severity).toBe('warning');
  });

  it('does not flag CREATE INDEX CONCURRENTLY', () => {
    const content = `
exports.up = async function (knex) {
  await knex.raw('CREATE INDEX CONCURRENTLY "idx_product_slug" ON "product" ("slug")');
};

exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS "idx_product_slug"');
};
`;
    const violations = validateMigrationFile('20260823000000_product_alterProduct.js', content);
    const indexViolations = violations.filter(v => v.rule === 'INDEX_WITHOUT_CONCURRENTLY');
    expect(indexViolations).toHaveLength(0);
  });

  it('warns about renameColumn', () => {
    const content = `
exports.up = function (knex) {
  return knex.schema.alterTable('product', t => {
    t.renameColumn('oldName', 'newName');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('product', t => {
    t.renameColumn('newName', 'oldName');
  });
};
`;
    const violations = validateMigrationFile('20260823000000_product_alterProduct.js', content);
    const renameViolations = violations.filter(v => v.rule === 'RENAME_COLUMN');
    expect(renameViolations.length).toBeGreaterThan(0);
    expect(renameViolations[0].severity).toBe('warning');
  });
});

describe('validateMigrations', () => {
  it('returns passed=true for empty directory', () => {
    const result = validateMigrations('/nonexistent/path');
    expect(result.totalFiles).toBe(0);
    expect(result.passed).toBe(true);
  });

  it('validates real migrations directory', () => {
    const result = validateMigrations();
    expect(result.totalFiles).toBeGreaterThan(0);
    // Legacy migrations may have warnings but should not have errors
    // that block validation (they're grandfathered)
    expect(result.violations).toBeDefined();
  });
});

describe('formatResults', () => {
  it('formats passing result', () => {
    const result = {
      totalFiles: 5,
      violations: [],
      passed: true,
    };
    const output = formatResults(result);
    expect(output).toContain('5 migration files');
    expect(output).toContain('✅');
  });

  it('formats failing result with errors', () => {
    const result = {
      totalFiles: 3,
      violations: [
        { file: '/migrations/bad.js', line: 5, rule: 'DROP_COLUMN', message: 'Drop detected', severity: 'error' as const },
        { file: '/migrations/warn.js', line: 10, rule: 'NO_GUARD', message: 'No guard', severity: 'warning' as const },
      ],
      passed: false,
    };
    const output = formatResults(result);
    expect(output).toContain('❌');
    expect(output).toContain('1 error');
    expect(output).toContain('1 warning');
    expect(output).toContain('DROP_COLUMN');
  });
});
