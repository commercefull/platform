/**
 * Adds exemption scope columns to the `customerTaxExemption` table:
 * - `applicableTaxCategoryIds` (jsonb) — which tax categories this exemption
 *   applies to (null = all categories).
 * - `minOrderAmount` / `maxOrderAmount` (numeric) — order amount bounds.
 * - `exemptionPercent` (numeric, default 100) — supports partial exemption.
 *
 * Also extends the `type` enum with the 10 rule-engine exemption types.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Extend the `type` enum with new exemption types.
  // Knex creates the enum type as "<table>_<column>_enum" (lowercased).
  // We use a DO block to safely add values only if they don't exist.
  await knex.raw(`
    DO $$
    DECLARE
      enum_type_name text;
    BEGIN
      SELECT t.typname INTO enum_type_name
      FROM pg_type t
      JOIN pg_attribute a ON a.atttypid = t.oid
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'customerTaxExemption'
        AND a.attname = 'type'
        AND n.nspname = 'public';

      IF enum_type_name IS NOT NULL THEN
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''resale''', enum_type_name);
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''diplomatic''', enum_type_name);
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''nonprofit''', enum_type_name);
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''vatReverseCharge''', enum_type_name);
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''agricultural''', enum_type_name);
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''manufacturing''', enum_type_name);
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''government''', enum_type_name);
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''educational''', enum_type_name);
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''medical''', enum_type_name);
        EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''export''', enum_type_name);
      END IF;
    END $$;
  `);

  // Add the new scope columns.
  await knex.schema.alterTable('customerTaxExemption', t => {
    t.jsonb('applicableTaxCategoryIds');
    t.decimal('minOrderAmount', 15, 2);
    t.decimal('maxOrderAmount', 15, 2);
    t.decimal('exemptionPercent', 5, 2).notNullable().defaultTo(100);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('customerTaxExemption', t => {
    t.dropColumn('applicableTaxCategoryIds');
    t.dropColumn('minOrderAmount');
    t.dropColumn('maxOrderAmount');
    t.dropColumn('exemptionPercent');
  });
  // Note: enum values cannot be removed from a PostgreSQL enum type.
  // The new type values remain but are harmless if unused.
};
