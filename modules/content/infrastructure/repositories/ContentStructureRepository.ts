/**
 * Consolidated Content Structure Repository
 *
 * Merges contentCategoryRepo, contentCategorizationRepo,
 * contentNavigationRepo, contentRedirectRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Content Structure (categories, categorization, navigation, redirects)
 */

import { ContentCategoryRepo } from './contentCategoryRepo';
import { ContentCategorizationRepo } from './contentCategorizationRepo';
import { ContentNavigationRepo } from './contentNavigationRepo';
import { ContentRedirectRepo } from './contentRedirectRepo';

const contentCategoryRepo = new ContentCategoryRepo();
const contentCategorizationRepo = new ContentCategorizationRepo();
const contentNavigationRepo = new ContentNavigationRepo();
const contentRedirectRepo = new ContentRedirectRepo();

class ContentStructureRepository {
  readonly categories = contentCategoryRepo;
  readonly categorization = contentCategorizationRepo;
  readonly navigation = contentNavigationRepo;
  readonly redirects = contentRedirectRepo;
}

export default new ContentStructureRepository();
