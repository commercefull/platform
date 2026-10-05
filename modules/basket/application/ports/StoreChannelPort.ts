export interface StoreChannelPort {
  isAssigned(storeId: string, salesChannelId: string): Promise<boolean>;
}
