/**
 * Page Builder Test Data Seed
 * Seeds a page draft with two blocks in the "main" region for
 * pagebuilderOps integration tests (theme update, region reorder).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const ORGANIZATION_ID = '01911000-0000-7000-8000-000000000001';
const DRAFT_ID = '0193d000-0000-7000-8000-000000000001';
const BLOCK_IDS = {
  FIRST: '0193d001-0000-7000-8000-000000000001',
  SECOND: '0193d001-0000-7000-8000-000000000002',
};

exports.seed = async function (knex) {
  const hasPageDraft = await knex.schema.hasTable('pageDraft');
  if (!hasPageDraft) {
    return;
  }

  await knex('pageDraft').where('draftId', DRAFT_ID).del();

  const now = new Date();

  await knex('pageDraft').insert({
    draftId: DRAFT_ID,
    organizationId: ORGANIZATION_ID,
    title: 'Ops Page',
    slug: 'ops-page',
    pageType: 'cms',
    status: 'draft',
    blocks: JSON.stringify([
      {
        blockId: BLOCK_IDS.FIRST,
        typeId: 'heading',
        region: 'main',
        order: 0,
        content: { text: 'Block A', level: 1 },
        settings: {},
      },
      {
        blockId: BLOCK_IDS.SECOND,
        typeId: 'heading',
        region: 'main',
        order: 1,
        content: { text: 'Block B', level: 1 },
        settings: {},
      },
    ]),
    version: 1,
    createdAt: now,
    updatedAt: now,
  });
};
