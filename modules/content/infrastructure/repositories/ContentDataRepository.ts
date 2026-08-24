/**
 * Consolidated Content Data Repository
 *
 * Merges contentRepo, contentPageVersionRepo, contentPageTranslationRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Content Page (pages, blocks, templates, versions, translations)
 */

import contentRepo from './contentRepo';
import { ContentPageVersionRepo } from './contentPageVersionRepo';
import { ContentPageTranslationRepo } from './contentPageTranslationRepo';

const contentPageVersionRepo = new ContentPageVersionRepo();
const contentPageTranslationRepo = new ContentPageTranslationRepo();

class ContentDataRepository {
  readonly pages = contentRepo;
  readonly versions = contentPageVersionRepo;
  readonly translations = contentPageTranslationRepo;
}

export default new ContentDataRepository();
