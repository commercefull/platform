import { UserStoreAssignment } from '../entities/UserStoreAssignment';

export interface UserStoreRepository {
  findByUserId(userId: string): Promise<UserStoreAssignment[]>;
  findByStoreId(storeId: string): Promise<UserStoreAssignment[]>;
  findByUserAndStore(userId: string, storeId: string): Promise<UserStoreAssignment | null>;
  findPrimaryStore(userId: string): Promise<UserStoreAssignment | null>;
  save(assignment: UserStoreAssignment): Promise<UserStoreAssignment>;
  delete(userStoreId: string): Promise<void>;
}
