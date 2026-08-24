/**
 * Consolidated Identity Data Repository
 *
 * Merges IdentityRepository, TokenRepository, socialAccountRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Identity (users, tokens, social accounts)
 */

import identityRepo from './IdentityRepository';
import tokenRepo from './TokenRepository';
import { SocialAccountRepo } from './socialAccountRepo';

// Re-export types for backward compatibility
export type { SocialProvider, UserType, SocialProfileData } from '../../domain/entities/SocialAccount';

const socialAccountRepoInstance = new SocialAccountRepo();

class IdentityDataRepository {
  readonly users = identityRepo;
  readonly tokens = tokenRepo;
  readonly social = socialAccountRepoInstance;
}

export default new IdentityDataRepository();
