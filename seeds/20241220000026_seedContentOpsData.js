/**
 * Content Ops Test Data Seed
 * Seeds content types, templates, categories, navigation + items,
 * media folder + media + usage for contentOps integration tests.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const IDS = {
  CONTENT_TYPE: '01942000-0000-7000-8000-000000000001',
  TEMPLATE: '01942001-0000-7000-8000-000000000001',
  CATEGORY_PARENT: '01942002-0000-7000-8000-000000000001',
  CATEGORY_CHILD: '01942002-0000-7000-8000-000000000002',
  NAVIGATION: '01942003-0000-7000-8000-000000000001',
  NAV_ITEM_1: '01942004-0000-7000-8000-000000000001',
  NAV_ITEM_2: '01942004-0000-7000-8000-000000000002',
  MEDIA_FOLDER: '01942005-0000-7000-8000-000000000001',
  MEDIA: '01942006-0000-7000-8000-000000000001',
  MEDIA_USAGE: '01942007-0000-7000-8000-000000000001',
};

exports.seed = async function (knex) {
  const now = new Date();

  if (await knex.schema.hasTable('contentType')) {
    await knex('contentType').where('contentTypeId', IDS.CONTENT_TYPE).del();
    await knex('contentType').insert({
      contentTypeId: IDS.CONTENT_TYPE,
      name: 'Ops Test Type',
      slug: 'ops-test-type',
      isSystem: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (await knex.schema.hasTable('contentTemplate')) {
    await knex('contentTemplate').where('contentTemplateId', IDS.TEMPLATE).del();
    await knex('contentTemplate').insert({
      contentTemplateId: IDS.TEMPLATE,
      name: 'Ops Test Template',
      slug: 'ops-test-template',
      htmlStructure: '<div>{{content}}</div>',
      isSystem: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (await knex.schema.hasTable('contentCategory')) {
    await knex('contentCategory').whereIn('contentCategoryId', [IDS.CATEGORY_PARENT, IDS.CATEGORY_CHILD]).del();
    await knex('contentCategory').insert([
      {
        contentCategoryId: IDS.CATEGORY_PARENT,
        name: 'Ops Parent',
        slug: 'ops-parent',
        sortOrder: 0,
        depth: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        contentCategoryId: IDS.CATEGORY_CHILD,
        name: 'Ops Child',
        slug: 'ops-child',
        sortOrder: 0,
        depth: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }

  if (await knex.schema.hasTable('contentNavigation')) {
    if (await knex.schema.hasTable('contentNavigationItem')) {
      await knex('contentNavigationItem')
        .whereIn('contentNavigationItemId', [IDS.NAV_ITEM_1, IDS.NAV_ITEM_2])
        .del();
    }
    await knex('contentNavigation').where('contentNavigationId', IDS.NAVIGATION).del();
    await knex('contentNavigation').insert({
      contentNavigationId: IDS.NAVIGATION,
      name: 'Ops Nav',
      slug: 'ops-nav',
      location: 'header',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    if (await knex.schema.hasTable('contentNavigationItem')) {
      await knex('contentNavigationItem').insert([
        {
          contentNavigationItemId: IDS.NAV_ITEM_1,
          navigationId: IDS.NAVIGATION,
          title: 'Item A',
          type: 'url',
          url: 'https://example.com/a',
          openInNewTab: false,
          isActive: true,
          sortOrder: 0,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          contentNavigationItemId: IDS.NAV_ITEM_2,
          navigationId: IDS.NAVIGATION,
          title: 'Item B',
          type: 'url',
          url: 'https://example.com/b',
          openInNewTab: false,
          isActive: true,
          sortOrder: 1,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
  }

  if (await knex.schema.hasTable('contentMediaFolder')) {
    await knex('contentMediaFolder').where('contentMediaFolderId', IDS.MEDIA_FOLDER).del();
    await knex('contentMediaFolder').insert({
      contentMediaFolderId: IDS.MEDIA_FOLDER,
      name: 'Ops Folder',
      depth: 0,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (await knex.schema.hasTable('contentMedia')) {
    if (await knex.schema.hasTable('contentMediaUsage')) {
      await knex('contentMediaUsage').where('contentMediaUsageId', IDS.MEDIA_USAGE).del();
    }
    await knex('contentMedia').where('contentMediaId', IDS.MEDIA).del();
    await knex('contentMedia').insert({
      contentMediaId: IDS.MEDIA,
      title: 'Ops Media',
      fileName: 'ops-test.png',
      filePath: '/uploads/ops-test.png',
      url: 'https://example.com/ops-test.png',
      fileType: 'image/png',
      fileSize: 1024,
      sortOrder: 0,
      isExternal: true,
      createdAt: now,
      updatedAt: now,
    });

    if (await knex.schema.hasTable('contentMediaUsage')) {
      await knex('contentMediaUsage').insert({
        contentMediaUsageId: IDS.MEDIA_USAGE,
        mediaId: IDS.MEDIA,
        entityType: 'contentPage',
        entityId: '00000000-0000-0000-0000-000000000001',
        field: 'heroImage',
        createdAt: now,
      });
    }
  }
};
