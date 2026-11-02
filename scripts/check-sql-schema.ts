/**
 * check-sql-schema — validates quoted SQL identifiers in repository queries
 * against the generated schema types in libs/db/types.ts.
 *
 * Catches schema drift: queries referencing columns that no longer exist
 * (e.g. "altText" when the column is "alt") before they surface as runtime
 * 42703 errors. Regenerate types with `yarn db:types` after migrations.
 *
 * Conservative by design: statements containing dynamic interpolation (${})
 * or referencing tables absent from types.ts are skipped rather than flagged.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['modules', 'libs', 'web', 'boot'];
const SKIP_FILES = /\.(test|spec)\.ts$|check-sql-schema\.ts$/;

interface Finding {
  file: string;
  line: number;
  table: string;
  columns: string[];
}

// ---------- parse generated types ----------

function pascal(name: string): string {
  return name
    .split(/[_\-\s]/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join('');
}

function loadTableColumns(): Map<string, Set<string>> {
  const src = fs.readFileSync(path.join(ROOT, 'libs/db/types.ts'), 'utf8');

  const typeCols = new Map<string, Set<string>>();
  for (const m of src.matchAll(/export type (\w+) = \{([^}]*)\};/gs)) {
    const cols = new Set<string>();
    for (const cm of m[2].matchAll(/^\s*"?([A-Za-z_]\w*)"?\s*:/gm)) cols.add(cm[1]);
    typeCols.set(m[1], cols);
  }

  const tableCols = new Map<string, Set<string>>();
  const enumBlock = src.match(/export enum Table \{([\s\S]*?)\}/)?.[1] ?? '';
  for (const m of enumBlock.matchAll(/(\w+)\s*=\s*"(\w+)"/g)) {
    const cols = typeCols.get(pascal(m[2]));
    if (cols) tableCols.set(m[2], cols);
  }
  return tableCols;
}

// ---------- statement analysis ----------

const SQL_KEYWORDS = new Set([
  'on',
  'as',
  'join',
  'left',
  'right',
  'inner',
  'outer',
  'full',
  'cross',
  'where',
  'and',
  'or',
  'not',
  'in',
  'is',
  'null',
  'like',
  'between',
  'case',
  'when',
  'then',
  'else',
  'end',
  'select',
  'from',
  'group',
  'by',
  'order',
  'limit',
  'offset',
  'asc',
  'desc',
  'distinct',
  'union',
  'all',
  'returning',
  'values',
  'set',
  'using',
  'lateral',
  'exists',
  'asc',
  'insert',
  'update',
  'delete',
  'into',
  'default',
  'true',
  'false',
]);

interface StmtCtx {
  tables: Set<string>; // real table names in scope
  aliasToTable: Map<string, string>;
  outAliases: Set<string>; // AS-defined output names
}

function analyzeStatement(sql: string, tableCols: Map<string, Set<string>>): { table: string; bad: string[] }[] {
  const ctx: StmtCtx = { tables: new Set(), aliasToTable: new Map(), outAliases: new Set() };

  // Collect FROM / JOIN / UPDATE / INTO targets with aliases
  for (const m of sql.matchAll(/(?:FROM|JOIN|UPDATE|INTO)\s+"?([A-Za-z_]\w*)"?(?:\s+(?:AS\s+)?([A-Za-z_]\w*))?/gi)) {
    const [, table, alias] = m;
    ctx.tables.add(table);
    if (alias && !SQL_KEYWORDS.has(alias.toLowerCase()) && !/^\$/.test(alias)) {
      ctx.aliasToTable.set(alias, table);
    }
  }
  // DELETE FROM "t"
  for (const m of sql.matchAll(/DELETE\s+FROM\s+"?([A-Za-z_]\w*)"?/gi)) ctx.tables.add(m[1]);

  // AS-defined output column names are not inputs — never flag them
  for (const m of sql.matchAll(/\bAS\s+"?([A-Za-z_]\w*)"?/gi)) ctx.outAliases.add(m[1]);
  for (const m of sql.matchAll(/\bAS\s+([A-Za-z_]\w*)\b/gi)) ctx.outAliases.add(m[1]);

  // INSERT INTO "t" ("a", "b") column list
  for (const m of sql.matchAll(/INSERT\s+INTO\s+"?([A-Za-z_]\w*)"?\s*\(([^)]*)\)/gi)) {
    const [, table, list] = m;
    const known = tableCols.get(table);
    if (!known) continue;
    const bad: string[] = [];
    for (const cm of list.matchAll(/"([A-Za-z_]\w*)"/g)) {
      if (!known.has(cm[1])) bad.push(cm[1]);
    }
    if (bad.length) return [{ table, bad }];
  }

  const bad: { table: string; bad: string[] }[] = [];
  const knownTables = [...ctx.tables].filter(t => tableCols.has(t));
  if (knownTables.length === 0) return [];

  // Qualified refs: alias."col" or "table"."col" — validate against resolved table
  for (const m of sql.matchAll(/(?:"([A-Za-z_]\w*)"|([A-Za-z_]\w*))\."([A-Za-z_]\w*)"/g)) {
    const owner = m[1] ?? m[2];
    const col = m[3];
    const table = ctx.aliasToTable.get(owner) ?? (ctx.tables.has(owner) ? owner : undefined);
    if (!table || !tableCols.has(table)) continue;
    if (!tableCols.get(table)!.has(col)) bad.push({ table, bad: [col] });
  }

  // Single-table statements: unqualified quoted cols in WHERE/SET/ORDER/GROUP/RETURNING
  if (knownTables.length === 1 && ctx.tables.size === 1) {
    const table = knownTables[0];
    const known = tableCols.get(table)!;
    const clauses = sql.matchAll(
      /(?:WHERE|SET|GROUP\s+BY|ORDER\s+BY|RETURNING|HAVING)([\s\S]*?)(?:WHERE|SET|GROUP\s+BY|ORDER\s+BY|RETURNING|HAVING|$)/gi,
    );
    for (const m of clauses) {
      for (const cm of m[1].matchAll(/(?<![\w."])"([A-Za-z_]\w*)"(?!\s*[.(])/g)) {
        const col = cm[1];
        if (!known.has(col) && !ctx.outAliases.has(col) && !ctx.tables.has(col)) bad.push({ table, bad: [col] });
      }
    }
  }
  return bad;
}

// ---------- file scan ----------

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.name.endsWith('.ts') && !SKIP_FILES.test(entry.name)) yield p;
  }
}

function extractSql(src: string): { sql: string; index: number }[] {
  const stmts: { sql: string; index: number }[] = [];
  // SQL lives in backtick template strings passed to query*/raw helpers
  for (const m of src.matchAll(/(?:query|queryOne|raw|execute|trx?\.\w+)\s*(?:<[^>]*>)?\s*\(\s*`([^`]*)`/g)) {
    const sql = m[1];
    if (/\$\{/.test(sql)) continue; // dynamic — can't prove statically
    if (!/\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(sql)) continue;
    stmts.push({ sql, index: m.index });
  }
  return stmts;
}

// ---------- full-row typing check ----------
// SELECT * / RETURNING * results must be typed with generated Db* row types
// (or Pick<Omit<DbX>, *Row projection contracts), never domain/hand-rolled types.

const QUERY_HELPERS = '(?:query|queryOne|queryOneOrThrow|txQuery|txQueryOne)';
const ROW_GENERIC_OK =
  /^(Db\w*|Pick<Db|Omit<Db|Partial<Db|\w*Row(?:\[\])?$|\w*Db(?:\[\])?$|Record|unknown|\{|Array<\s*(\{|Db|Record|unknown)|void\b|any\b|T\b|U\b)/;

function resolveSqlVar(src: string, varName: string, before: number): string | null {
  // Find the last `let|const <name> = <expr>;` assignment before the call and
  // concatenate every template literal inside the expression (covers ternaries),
  // plus `<name> += `...`` appends between assignment and call.
  const assignRe = new RegExp(`(?:let|const)\\s+${varName}\\s*=\\s*([^;]+);`, 'g');
  let base: { expr: string; index: number } | null = null;
  for (const m of src.matchAll(assignRe)) {
    if (m.index < before) base = { expr: m[1], index: m.index };
  }
  if (!base) return null;
  const literals = [...base.expr.matchAll(/`([^`]*)`/g)].map(l => l[1]);
  if (literals.length === 0) return null;
  let combined = literals.join('\n');
  const appendRe = new RegExp(`${varName}\\s*\\+=\\s*\`([^\`]*)\``, 'g');
  for (const m of src.matchAll(appendRe)) {
    if (m.index > base.index && m.index < before) combined += '\n' + m[1];
  }
  return combined;
}

function extractFullRowFindings(src: string): { generic: string; index: number }[] {
  const findings: { generic: string; index: number }[] = [];
  const callRe = new RegExp(
    `(?<![.\\w$])${QUERY_HELPERS}\\s*(?:<([^;()]*(?:<[^<>]*>)?[^;()]*)>)?\\s*\\(\\s*(\`([^\`]*)\`|([A-Za-z_$][\\w$]*))`,
    'g',
  );
  for (const m of src.matchAll(callRe)) {
    const generic = (m[1] ?? '').trim();
    let sql: string | undefined = m[3];
    const sqlVar = m[4];
    if (sql === undefined && sqlVar && /sql$/i.test(sqlVar)) {
      sql = resolveSqlVar(src, sqlVar, m.index) ?? undefined;
    }
    if (!sql || /\$\{/.test(sql)) continue;
    if (!/\b(SELECT\s+\*|RETURNING\s+\*)/i.test(sql)) continue;
    if (!generic || !ROW_GENERIC_OK.test(generic)) {
      findings.push({ generic: generic || '(untyped)', index: m.index });
    }
  }
  return findings;
}

const tableCols = loadTableColumns();
const findings: Finding[] = [];
const rowFindings: { file: string; line: number; generic: string }[] = [];

for (const dir of SCAN_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const src = fs.readFileSync(file, 'utf8');
    for (const { sql, index } of extractSql(src)) {
      for (const { table, bad } of analyzeStatement(sql, tableCols)) {
        findings.push({
          file: path.relative(ROOT, file),
          line: src.slice(0, index).split('\n').length,
          table,
          columns: bad,
        });
      }
    }
    for (const f of extractFullRowFindings(src)) {
      rowFindings.push({
        file: path.relative(ROOT, file),
        line: src.slice(0, f.index).split('\n').length,
        generic: f.generic,
      });
    }
  }
}

// Deduplicate identical file/line/column findings
const seen = new Set<string>();
const unique = findings.filter(f => {
  const key = `${f.file}:${f.line}:${f.table}:${f.columns.join(',')}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

let failed = false;
if (unique.length) {
  console.error(`✗ check-sql-schema: ${unique.length} queries reference columns missing from libs/db/types.ts\n`);
  for (const f of unique) console.error(`  ${f.file}:${f.line}  [${f.table}] ${f.columns.join(', ')}`);
  console.error('\nFix the query or run `yarn db:types` if types are stale.');
  failed = true;
}
if (rowFindings.length) {
  console.error(
    `\n✗ check-sql-schema: ${rowFindings.length} full-row queries (SELECT */RETURNING *) are not typed with generated Db* row types\n`,
  );
  for (const f of rowFindings) console.error(`  ${f.file}:${f.line}  query<${f.generic}>`);
  console.error(
    '\nUse `Db{Table}` from libs/db/types for SELECT */RETURNING *; projections use `*Row` or `Pick<Db*, ...>` types. Map rows to domain types before returning.',
  );
  failed = true;
}
if (failed) process.exit(1);
console.log(`✓ check-sql-schema: all static SQL columns match generated types`);
