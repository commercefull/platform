/**
 * Consolidated Content Media Repository
 *
 * Merges contentMediaRepo, contentMediaUsageRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Content Media (media files, folders, usage tracking)
 */

import { ContentMediaRepo } from './contentMediaRepo';
import { ContentMediaUsageRepo } from './contentMediaUsageRepo';

const contentMediaRepo = new ContentMediaRepo();
const contentMediaUsageRepo = new ContentMediaUsageRepo();

class ContentMediaDataRepository {
  readonly media = contentMediaRepo;
  readonly usage = contentMediaUsageRepo;
}

export default new ContentMediaDataRepository();
