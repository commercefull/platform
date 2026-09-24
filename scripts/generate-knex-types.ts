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

// knex-types maps Postgres bigint (int8) to `string`, but the pg driver is
// configured (libs/db/pool.ts) to parse int8 into JS numbers. Post-process the
// generated file so bigint columns are typed `number`, matching runtime values.
const rewriteBigintFields = (columnsByTable: Map<string, Set<string>>): void => {
  let source = fs.readFileSync(TEMP_PATH, 'utf8');

  // Generated blocks look like: export type TableName = { ... col: string; col: string | null; ... }
  // knex-types names types upperFirst(camelCase(tableName)) — digits split words
  // (e.g. "b2bQuote" -> "B2BQuote"). Table names are already camelCase, so
  // uppercase the first letter and any letter following a digit.
  const toTypeName = (table: string): string =>
    table.charAt(0).toUpperCase() + table.slice(1).replace(/(\d)([a-z])/g, (_m, d, c) => d + c.toUpperCase());

  for (const [table, columns] of columnsByTable) {
    const typeName = toTypeName(table);
    const blockRe = new RegExp(`export type ${typeName} = \\{([\\s\\S]*?)\\};`);
    const match = source.match(blockRe);
    if (!match) continue;

    let block = match[1];
    for (const col of columns) {
      const fieldRe = new RegExp(`(\\s${col}:) string`, 'g');
      block = block.replace(fieldRe, '$1 number');
    }
    source = source.replace(blockRe, `export type ${typeName} = {${block}};`);
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

  await db.destroy().catch(() => {});
}

main().catch(_error => {
  process.exit(1);
});
