/**
 * Language Repository
 * Handles CRUD for the "language" table
 */

import { query, queryOne } from '../../../../libs/db';
import type { Language } from 'libs/db/types';
import { generateUUID as uuidv4 } from '../../../../libs/uuid';

export type LanguageRecord = Language;

export async function listLanguages(): Promise<LanguageRecord[]> {
  const rows = await query<LanguageRecord[]>(`SELECT * FROM "language" ORDER BY "name"`);
  return rows || [];
}

export async function findLanguageById(languageId: string): Promise<LanguageRecord | null> {
  return queryOne<LanguageRecord>(`SELECT * FROM "language" WHERE "languageId" = $1`, [languageId]);
}

export async function createLanguage(params: { code: string; name: string; nativeName?: string; isDefault?: boolean; isActive?: boolean }): Promise<string> {
  const languageId = uuidv4();
  const now = new Date();

  if (params.isDefault) {
    await query(`UPDATE "language" SET "isDefault" = false`);
  }

  await query(
    `INSERT INTO "language" ("languageId", "code", "name", "nativeName", "isDefault", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [languageId, params.code, params.name, params.nativeName || params.name, params.isDefault || false, params.isActive !== false, now, now],
  );

  return languageId;
}

export async function updateLanguage(languageId: string, updates: { name?: string; nativeName?: string; isDefault?: boolean; isActive?: boolean }): Promise<void> {
  const now = new Date();

  if (updates.isDefault) {
    await query(`UPDATE "language" SET "isDefault" = false`);
  }

  await query(
    `UPDATE "language" SET
      "name" = COALESCE($1, "name"),
      "nativeName" = COALESCE($2, "nativeName"),
      "isDefault" = COALESCE($3, "isDefault"),
      "isActive" = COALESCE($4, "isActive"),
      "updatedAt" = $5
     WHERE "languageId" = $6`,
    [updates.name, updates.nativeName, updates.isDefault, updates.isActive, now, languageId],
  );
}

export async function deleteLanguage(languageId: string): Promise<void> {
  await query(`DELETE FROM "language" WHERE "languageId" = $1`, [languageId]);
}
