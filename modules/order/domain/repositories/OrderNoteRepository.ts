export interface OrderNote {
  orderNoteId: string;
  createdAt: Date;
  updatedAt: Date;
  orderId: string;
  content: string;
  isCustomerVisible: boolean;
  createdBy?: string;
  deletedAt?: Date;
}

export type OrderNoteCreateParams = Omit<OrderNote, 'orderNoteId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export interface OrderNoteRepository {
  findByOrder(orderId: string): Promise<OrderNote[]>;
  create(params: OrderNoteCreateParams): Promise<OrderNote>;
  softDelete(orderNoteId: string): Promise<boolean>;
}
