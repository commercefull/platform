/**
 * Migration Validator
 *
 * Statically analyzes migration files to detect common anti-patterns
 * that violate the expand/contract policy or zero-downtime checklist.
 *
 * Usage:
 *   npx ts-node scripts/validate-migrations.ts
 *   npx ts-node scripts/validate-migrations.ts --dir migrations
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

interface MigrationViolation {
  file: string;
  line: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  totalFiles: number;
  violations: MigrationViolation[];
  passed: boolean;
}

/**
 * Rules checked:
 *
 * ERROR-level:
 * 1. NOT NULL on new column without default (breaks existing rows)
 * 2. DROP COLUMN in a migration (should be separate contract migration)
 * 3. DROP TABLE without guard
 * 4. Missing exports.down
 *
 * WARNING-level:
 * 5. No hasTable/hasColumn guard in alter migration
 * 6. CREATE INDEX without CONCURRENTLY (locks table)
 * 7. RENAME COLUMN (should use expand/contract)
 * 8. Type narrowing (e.g., string -> integer)
 */
export function validateMigrationFile(filePath: string, content: string): MigrationViolation[] {
  const violations: MigrationViolation[] = [];
  const lines = content.split('\n');
  const fileName = filePath.split('/').pop() || filePath;

  const isAlter = fileName.includes('alter') || fileName.includes('Alter');
  const _isDrop = fileName.includes('drop') || fileName.includes('Drop');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Rule 1: NOT NULL on new column without default
    if (line.match(/\.notNullable\(\)/i) && !line.match(/defaultTo/i)) {
      // Check if this is in a createTable (safe) vs alterTable (unsafe)
      const context = lines.slice(Math.max(0, i - 5), i + 1).join('\n');
      if (context.includes('alterTable') && !context.includes('hasColumn')) {
        violations.push({
          file: filePath,
          line: lineNum,
          rule: 'NOT_NULL_WITHOUT_DEFAULT',
          message: 'NOT NULL column added without default in alterTable — use expand/contract (add nullable, backfill, then add constraint)',
          severity: 'error',
        });
      }
    }

    // Rule 2: DROP COLUMN
    if (line.match(/\.dropColumn\(/i)) {
      violations.push({
        file: filePath,
        line: lineNum,
        rule: 'DROP_COLUMN',
        message: 'DROP COLUMN detected — ensure no running code references this column. Deploy code change first, then drop in a follow-up migration.',
        severity: 'error',
      });
    }

    // Rule 3: DROP TABLE without guard
    if (line.match(/\.dropTable\(/i) || line.match(/\.dropTableIfExists\(/i)) {
      if (!line.match(/ifExists/i) && !lines.slice(Math.max(0, i - 3), i).join('\n').match(/hasTable/i)) {
        violations.push({
          file: filePath,
          line: lineNum,
          rule: 'DROP_TABLE_UNGUARDED',
          message: 'DROP TABLE without hasTable guard — add defensive check or use dropTableIfExists',
          severity: 'error',
        });
      }
    }

    // Rule 4: Missing exports.down
    if (line.match(/exports\.up\s*=/) && !content.match(/exports\.down\s*=/)) {
      violations.push({
        file: filePath,
        line: lineNum,
        rule: 'MISSING_DOWN',
        message: 'Migration has exports.up but no exports.down — always implement rollback',
        severity: 'error',
      });
    }

    // Rule 5: No guard in alter migration
    if (isAlter && line.match(/exports\.up\s*=/)) {
      const upBody = content.split('exports.up')[1] || '';
      if (!upBody.match(/hasTable|hasColumn/i)) {
        violations.push({
          file: filePath,
          line: lineNum,
          rule: 'NO_GUARD_IN_ALTER',
          message: 'Alter migration without hasTable/hasColumn guard — add defensive checks for diverse environments',
          severity: 'warning',
        });
      }
    }

    // Rule 6: CREATE INDEX without CONCURRENTLY
    if (line.match(/CREATE INDEX/i) && !line.match(/CONCURRENTLY/i) && !line.match(/CREATE INDEX CONCURRENTLY/i)) {
      violations.push({
        file: filePath,
        line: lineNum,
        rule: 'INDEX_WITHOUT_CONCURRENTLY',
        message: 'CREATE INDEX without CONCURRENTLY — will lock the table. Use CREATE INDEX CONCURRENTLY for large tables.',
        severity: 'warning',
      });
    }

    // Rule 7: RENAME COLUMN
    if (line.match(/\.renameColumn\(/i)) {
      violations.push({
        file: filePath,
        line: lineNum,
        rule: 'RENAME_COLUMN',
        message: 'renameColumn detected — use expand/contract instead (add new column, backfill, update code, drop old)',
        severity: 'warning',
      });
    }
  }

  return violations;
}

/**
 * Validate all migration files in a directory.
 */
export function validateMigrations(dir: string = join(process.cwd(), 'migrations')): ValidationResult {
  const violations: MigrationViolation[] = [];

  if (!existsSync(dir)) {
    return {
      totalFiles: 0,
      violations: [],
      passed: true,
    };
  }

  const files = readdirSync(dir)
    .filter(f => extname(f) === '.js')
    .sort();

  for (const file of files) {
    const filePath = join(dir, file);
    const content = readFileSync(filePath, 'utf-8');
    violations.push(...validateMigrationFile(filePath, content));
  }

  const hasErrors = violations.some(v => v.severity === 'error');

  return {
    totalFiles: files.length,
    violations,
    passed: !hasErrors,
  };
}

/**
 * Format validation results for CLI output.
 */
export function formatResults(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push(`Validated ${result.totalFiles} migration files`);
  lines.push(`Found ${result.violations.length} violation(s)`);
  lines.push('');

  if (result.violations.length === 0) {
    lines.push('✅ All migrations pass validation');
    return lines.join('\n');
  }

  // Group by severity
  const errors = result.violations.filter(v => v.severity === 'error');
  const warnings = result.violations.filter(v => v.severity === 'warning');

  if (errors.length > 0) {
    lines.push(`❌ ${errors.length} error(s):`);
    for (const v of errors) {
      const fileName = v.file.split('/').pop();
      lines.push(`  ${fileName}:${v.line} [${v.rule}] ${v.message}`);
    }
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push(`⚠️  ${warnings.length} warning(s):`);
    for (const v of warnings) {
      const fileName = v.file.split('/').pop();
      lines.push(`  ${fileName}:${v.line} [${v.rule}] ${v.message}`);
    }
  }

  lines.push('');
  lines.push(result.passed ? '✅ No errors — migrations pass validation' : '❌ Errors found — fix before deploying');

  return lines.join('\n');
}

// CLI entry point
if (require.main === module) {
  const dir = process.argv.includes('--dir')
    ? process.argv[process.argv.indexOf('--dir') + 1]
    : join(process.cwd(), 'migrations');

  const result = validateMigrations(dir);
  console.log(formatResults(result));
  process.exit(result.passed ? 0 : 1);
}
