import fs from 'fs';
import path from 'path';
import { knex, Knex } from 'knex';
import { updateTypes } from 'knex-types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const knexConfig = require('../knexfile');

const OUTPUT_PATH = path.resolve(__dirname, '../libs/db/types.ts');
const TEMP_PATH = OUTPUT_PATH + '.tmp';

const resolveEnvironmentConfig = (environment: string): Knex.Config => {
  const config = knexConfig[environment];

  if (!config) {
    throw new Error(`Knex configuration for environment "${environment}" not found.`);
  }

  return config as Knex.Config;
};

const toTypeName = (table: string): string =>
  table.charAt(0).toUpperCase() + table.slice(1).replace(/(\d)([a-z])/g, (_m, d, c) => d + c.toUpperCase());

const rewriteColumnType = (source: string, table: string, col: string, tsType: string): string => {
  const blockRe = new RegExp(`export type ${toTypeName(table)} = \\{([\\s\\S]*?)\\};`);
  const match = source.match(blockRe);
  if (!match) return source;

  let block = match[1];
  // Preserve optionality: `col: string | null` -> `col: 'a' | 'b' | null`
  const fieldRe = new RegExp(`(\\s${col}:) string( \\| null)?`, 'g');
  block = block.replace(fieldRe, (_m, prefix, nullable) => `${prefix} ${tsType}${nullable ?? ''}`);
  return source.replace(blockRe, `export type ${toTypeName(table)} = {${block}};`);
};

// knex-types maps Postgres bigint (int8) to `string`, but the pg driver is
// configured (libs/db/pool.ts) to parse int8 into JS numbers. Post-process the
// generated file so bigint columns are typed `number`, matching runtime values.
const rewriteBigintFields = (columnsByTable: Map<string, Set<string>>): void => {
  let source = fs.readFileSync(TEMP_PATH, 'utf8');

  for (const [table, columns] of columnsByTable) {
    for (const col of columns) {
      source = rewriteColumnType(source, table, col, 'number');
    }
  }

  fs.writeFileSync(OUTPUT_PATH, source);
};

// Knex `t.enum(col, [...])` (non-native) stores text/varchar + a CHECK
// constraint (`col = ANY (ARRAY['a', 'b', ...])`). knex-types types the column
// as plain `string`, hiding the allowed values. Extract single-column enum
// CHECKs and rewrite them as string-literal unions so writes of invalid
// values fail type-checking.
const parseEnumLiterals = (definition: string): string[] | null => {
  const m = definition.match(/ARRAY\[([\s\S]*?)\]/) ?? definition.match(/\bIN\s*\(([\s\S]*?)\)/);
  if (!m) return null;
  const literals = [...m[1].matchAll(/'((?:[^']|'')*)'/g)].map(x => x[1].replace(/''/g, "'"));
  return literals.length > 0 ? literals : null;
};

const rewriteEnumFields = (enumColumns: Map<string, Map<string, string[]>>): void => {
  let source = fs.readFileSync(OUTPUT_PATH, 'utf8');

  for (const [table, columns] of enumColumns) {
    for (const [col, literals] of columns) {
      const union = literals.map(l => `'${l.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`).join(' | ');
      source = rewriteColumnType(source, table, col, union);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, source);
};

async function main(): Promise<void> {
  const environment = process.env.NODE_ENV || 'development';
  const config = resolveEnvironmentConfig(environment);

  const db = knex(config);

  // Query bigint columns before updateTypes — it leaves the pool unable to
  // service further acquires once it finishes.
  const { rows } = await db.raw(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND data_type = 'bigint'`,
  );
  const columnsByTable = new Map<string, Set<string>>();
  for (const { table_name, column_name } of rows) {
    if (!columnsByTable.has(table_name)) columnsByTable.set(table_name, new Set());
    columnsByTable.get(table_name)!.add(column_name);
  }

  // Single-column CHECK constraints carrying enum literal lists.
  const { rows: checkRows } = await db.raw(
    `SELECT rel.relname AS table_name, a.attname AS column_name,
            pg_get_constraintdef(con.oid) AS definition
     FROM pg_constraint con
     JOIN pg_class rel ON rel.oid = con.conrelid
     JOIN pg_namespace n ON n.oid = con.connamespace
     JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
     WHERE con.contype = 'c' AND n.nspname = 'public'
       AND array_length(con.conkey, 1) = 1`,
  );
  const enumColumns = new Map<string, Map<string, string[]>>();
  for (const { table_name, column_name, definition } of checkRows) {
    const literals = parseEnumLiterals(definition);
    if (!literals) continue;
    if (!enumColumns.has(table_name)) enumColumns.set(table_name, new Map());
    enumColumns.get(table_name)!.set(column_name, literals);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  // updateTypes resolves before its write stream finishes — await 'finish'
  const stream = fs.createWriteStream(TEMP_PATH);
  const finished = new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  await updateTypes(db, { output: stream });
  await finished;

  rewriteBigintFields(columnsByTable);
  fs.rmSync(TEMP_PATH, { force: true });
  rewriteEnumFields(enumColumns);

  await db.destroy().catch(() => {});
}

main().catch(_error => {
  process.exit(1);
});
