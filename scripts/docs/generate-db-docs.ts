/**
 * Generate database schema documentation by introspecting PostgreSQL.
 *
 * Queries information_schema for tables, columns, constraints, and
 * foreign keys. Outputs markdown with one section per table plus a
 * Mermaid ERD diagram.
 *
 * Requires a running PostgreSQL instance (uses the same connection
 * config as the application via DATABASE_URL or individual PG env vars).
 *
 * Outputs: docs/generated/database-schema.md
 *
 * Usage: tsx scripts/docs/generate-db-docs.ts
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const OUTPUT = path.resolve(__dirname, '../../docs/generated/database-schema.md');

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  is_primary_key: boolean;
  foreign_key: { refTable: string; refColumn: string } | null;
}

interface TableInfo {
  table_name: string;
  columns: ColumnInfo[];
}

async function main(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ||
      `postgres://${process.env.POSTGRES_USER || 'ecomm-user'}:${process.env.POSTGRES_PASSWORD || 'ecomm-password'}@${process.env.POSTGRES_HOST || '127.0.0.1'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'ecomm-db'}`,
  });

  try {
    console.log('[docs:db] Connecting to PostgreSQL...');

    // Get all tables in the public schema
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tableNames = tablesResult.rows.map((r: { table_name: string }) => r.table_name);
    console.log(`[docs:db] Found ${tableNames.length} tables`);

    if (tableNames.length === 0) {
      console.error('[docs:db] No tables found. Is the database migrated?');
      process.exit(1);
    }

    // Get columns for all tables
    const columnsResult = await pool.query(`
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key,
        fk.foreign_table_name AS fk_table,
        fk.foreign_column_name AS fk_column
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      LEFT JOIN (
        SELECT
          kcu.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
          AND tc.constraint_schema = ccu.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position
    `);

    // Group columns by table
    const tables: Map<string, TableInfo> = new Map();

    for (const row of columnsResult.rows as ColumnInfo[]) {
      if (!tables.has(row.table_name)) {
        tables.set(row.table_name, { table_name: row.table_name, columns: [] });
      }
      tables.get(row.table_name)!.columns.push(row);
    }

    // Generate markdown
    let md = '# Database Schema\n\n';
    md += '> Auto-generated from PostgreSQL information_schema. Do not edit manually.\n';
    md += '> Run `yarn docs:db` to regenerate.\n\n';
    md += `**Tables:** ${tables.size}\n\n`;

    // Table of contents
    md += '## Table of Contents\n\n';
    for (const tableName of Array.from(tables.keys()).sort()) {
      md += `- [${tableName}](#${tableName})\n`;
    }
    md += '\n';

    // Mermaid ERD (simplified — only show FK relationships)
    md += '## Entity Relationship Diagram\n\n';
    md += '```mermaid\nerDiagram\n';

    for (const [tableName, table] of tables) {
      // Define table with key fields
      const pkCols = table.columns.filter(c => c.is_primary_key);
      const fkCols = table.columns.filter(c => c.foreign_key);

      if (pkCols.length > 0 || fkCols.length > 0) {
        const fields = table.columns.slice(0, 8).map(c => {
          let fieldDef = `    ${c.data_type.replace(/ /g, '_')} ${c.column_name}`;
          if (c.is_primary_key) fieldDef += ' PK';
          if (c.foreign_key) fieldDef += ' FK';
          return fieldDef;
        });
        md += `    ${tableName} {\n${fields.join('\n')}\n    }\n`;
      }

      // Draw relationships
      for (const fkCol of fkCols) {
        if (fkCol.foreign_key) {
          md += `    ${tableName} }o--|| ${fkCol.foreign_key.refTable} : "${fkCol.column_name} → ${fkCol.foreign_key.refColumn}"\n`;
        }
      }
    }

    md += '```\n\n';

    // Per-table details
    md += '## Table Details\n\n';

    for (const [tableName, table] of Array.from(tables.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      md += `### ${tableName}\n\n`;
      md += '| Column | Type | Nullable | Default | PK | FK |\n';
      md += '|---|---|---|---|---|---|\n';

      for (const col of table.columns) {
        let typeDisplay = col.data_type;
        if (col.character_maximum_length) {
          typeDisplay += `(${col.character_maximum_length})`;
        }

        const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
        const defaultVal = col.column_default || '—';
        const pk = col.is_primary_key ? '✓' : '';
        const fk = col.foreign_key ? `→ ${col.foreign_key.refTable}.${col.foreign_key.refColumn}` : '';

        md += `| \`${col.column_name}\` | ${typeDisplay} | ${nullable} | ${defaultVal} | ${pk} | ${fk} |\n`;
      }

      md += '\n';
    }

    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, md);
    console.log(`[docs:db] Generated ${OUTPUT} (${tables.size} tables)`);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('[docs:db] Error:', err);
  process.exit(1);
});
